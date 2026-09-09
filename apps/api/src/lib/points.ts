import { getConfigNumber } from "./config.js";
import { AppError } from "./errors.js";
import { notifyUser } from "./notify.js";
import { prisma } from "./prisma.js";
import { expiryForThisYear } from "./referral.js";

export async function pointsBalance(userId: string) {
  const [unlocked, locked, nextExpiry] = await Promise.all([
    prisma.pointsLedger.aggregate({
      where: { userId, status: "unlocked", OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] },
      _sum: { delta: true },
    }),
    prisma.pointsLedger.aggregate({ where: { userId, status: "locked" }, _sum: { delta: true } }),
    prisma.pointsLedger.findFirst({
      where: { userId, status: "unlocked", expiresAt: { gte: new Date() } },
      orderBy: { expiresAt: "asc" },
      select: { expiresAt: true },
    }),
  ]);

  return {
    unlocked: unlocked._sum.delta ?? 0,
    locked: locked._sum.delta ?? 0,
    expiresAt: nextExpiry?.expiresAt ?? null,
  };
}

// §2 applyRedemption, scoped to one shipment/invoice — mirrors the Backend
// Design Document's algorithm exactly (15% cap, point value, balance check).
export async function redeemPointsForShipment(userId: string, shipmentId: string, pointsToUse: number) {
  if (pointsToUse <= 0) throw new AppError(400, "จำนวนแต้มต้องมากกว่า 0");

  const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
  if (!shipment || shipment.userId !== userId) throw new AppError(404, "ไม่พบบิลนี้", "invoice_not_found");
  if (shipment.status !== "priced_awaiting_payment") {
    throw new AppError(400, "แลกแต้มได้เฉพาะบิลที่คิดราคาแล้วและยังไม่ได้ชำระเงิน", "redeem_wrong_status");
  }
  if (shipment.price === null) throw new AppError(400, "บิลนี้ยังไม่มีราคา", "invoice_no_price");

  const alreadyRedeemed = await prisma.pointsLedger.findFirst({
    where: { shipmentId, source: "redemption" },
  });
  if (alreadyRedeemed) throw new AppError(409, "แลกแต้มสำหรับบิลนี้ไปแล้ว", "already_redeemed");

  const [discountCapPct, pointValue] = await Promise.all([
    getConfigNumber("discount_cap_pct"),
    getConfigNumber("point_value"),
  ]);

  const price = Number(shipment.price);
  const maxDiscount = price * discountCapPct;
  const maxPoints = Math.floor(maxDiscount / pointValue);
  if (pointsToUse > maxPoints) {
    throw new AppError(400, `แลกแต้มได้สูงสุด ${maxPoints} แต้ม (เพดาน ${Math.round(discountCapPct * 100)}% ของบิล)`, "redeem_over_cap");
  }

  const balance = await pointsBalance(userId);
  if (pointsToUse > balance.unlocked) {
    throw new AppError(400, "แต้มไม่พอ", "insufficient_points");
  }

  await prisma.pointsLedger.create({
    data: {
      userId,
      shipmentId,
      delta: -pointsToUse,
      source: "redemption",
      status: "unlocked",
      note: `Redeemed on ${shipment.billNumber}`,
    },
  });

  const discount = pointsToUse * pointValue;
  return { pointsUsed: pointsToUse, discount, total: price - discount };
}

// §2 calculatePoints — called once, when a shipment's status is set to
// `delivered` (that's the point notif_delivered fires: "จัดส่งสำเร็จ +
// แต้มได้รับ"). Idempotent: refuses to double-award if a transport entry
// already exists for this shipment.
export async function calculatePoints(shipmentId: string): Promise<number> {
  const shipment = await prisma.shipment.findUniqueOrThrow({ where: { id: shipmentId } });

  const already = await prisma.pointsLedger.findFirst({ where: { shipmentId, source: "transport" } });
  if (already) return 0;

  const [minWeightKg, pointsPerKg, expiryMonth, expiryDay] = await Promise.all([
    getConfigNumber("min_weight_kg"),
    getConfigNumber("points_per_kg"),
    getConfigNumber("points_expiry_month"),
    getConfigNumber("points_expiry_day"),
  ]);

  const weightKg = shipment.weightKg !== null ? Number(shipment.weightKg) : 0;
  if (weightKg < minWeightKg) return 0;

  const points = Math.floor(weightKg * pointsPerKg);
  if (points <= 0) return 0;

  await prisma.pointsLedger.create({
    data: {
      userId: shipment.userId,
      shipmentId,
      delta: points,
      source: "transport",
      status: "unlocked",
      expiresAt: expiryForThisYear(expiryMonth, expiryDay),
    },
  });
  return points;
}

// §2 checkRefereeUnlock — call after calculatePoints for the same shipment's
// owner. Unlocks the referee's locked referral bonus once their cumulative
// *delivered* weight crosses the configured threshold.
export async function checkRefereeUnlock(refereeUserId: string): Promise<boolean> {
  const referral = await prisma.referral.findFirst({ where: { refereeId: refereeUserId, status: "pending" } });
  if (!referral) return false;

  const threshold = await getConfigNumber("referee_unlock_threshold_kg");
  const delivered = await prisma.shipment.aggregate({
    where: { userId: refereeUserId, status: "delivered" },
    _sum: { weightKg: true },
  });
  const totalKg = Number(delivered._sum.weightKg ?? 0);

  await prisma.referral.update({ where: { id: referral.id }, data: { cumulativeKg: totalKg } });
  if (totalKg < threshold) return false;

  await prisma.$transaction([
    prisma.pointsLedger.updateMany({
      where: { referralId: referral.id, userId: refereeUserId, status: "locked" },
      data: { status: "unlocked" },
    }),
    prisma.referral.update({
      where: { id: referral.id },
      data: { status: "unlocked", refereeUnlockAt: new Date() },
    }),
  ]);
  await notifyUser(refereeUserId, "notif_referral_unlocked");
  return true;
}

// Convenience wrapper for the admin bill-status-update endpoint — runs both
// steps in the order the Backend Design Document describes ("เรียกทุกครั้ง
// หลัง calculatePoints สำเร็จ").
export async function awardPointsOnDelivery(shipmentId: string): Promise<{ pointsAwarded: number; refereeUnlocked: boolean }> {
  const shipment = await prisma.shipment.findUniqueOrThrow({ where: { id: shipmentId } });
  const pointsAwarded = await calculatePoints(shipmentId);
  const refereeUnlocked = await checkRefereeUnlock(shipment.userId);
  return { pointsAwarded, refereeUnlocked };
}

// §2 "Cron Job: ปีใหม่รีเซ็ตแต้ม" — 0 1 1 1 * (Jan 1st, 01:00). Any unlocked,
// expired balance is zeroed out via an offsetting `expiry_reset` entry so
// the ledger stays an append-only audit trail rather than mutating history.
export async function resetExpiredPoints() {
  const expired = await prisma.pointsLedger.findMany({
    where: { status: "unlocked", expiresAt: { lt: new Date() } },
  });

  const byUser = new Map<string, number>();
  for (const entry of expired) {
    byUser.set(entry.userId, (byUser.get(entry.userId) ?? 0) + entry.delta);
  }

  let affected = 0;
  for (const [userId, net] of byUser) {
    if (net > 0) {
      await prisma.pointsLedger.create({
        data: { userId, delta: -net, source: "expiry_reset", status: "unlocked", note: "Annual reset" },
      });
      affected++;
    }
  }
  console.log(`[points] Annual reset complete — ${affected} user(s) affected.`);
  return affected;
}
