import { getConfigNumber } from "./config.js";
import { AppError } from "./errors.js";
import { prisma } from "./prisma.js";

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
