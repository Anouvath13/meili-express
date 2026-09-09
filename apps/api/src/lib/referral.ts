import { customAlphabet } from "nanoid";
import { getConfigNumber } from "./config.js";
import { AppError } from "./errors.js";
import { prisma, type TransactionClient } from "./prisma.js";

// Unambiguous alphabet (no 0/O/1/I) since account_id doubles as the
// customer-facing referral code (Backend Design Document §6).
const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

export async function generateAccountId(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = nanoid();
    const exists = await prisma.user.findUnique({ where: { accountId: candidate } });
    if (!exists) return candidate;
  }
  throw new AppError(500, "ไม่สามารถสร้างรหัสสมาชิกได้ กรุณาลองใหม่");
}

// §3 "Self-Referral Check" — phone match only for now. Device-fingerprint
// and farm-pattern detection need a fingerprint from the client, which
// Component Spec's register form doesn't currently collect; wire that up
// when/if the frontend starts sending one.
export async function assertNotSelfReferral(referrerPhone: string, newUserPhone: string) {
  if (referrerPhone === newUserPhone) {
    throw new AppError(400, "ไม่สามารถใช้รหัสแนะนำของตัวเองได้");
  }
}

// §2 creditReferralBonus — called once, right after the referral link is
// created at register time. Referrer unlocks immediately; referee's bonus
// stays locked until checkRefereeUnlock (Step 5, triggered off shipment
// delivery) clears the weight threshold.
export async function creditReferralBonus(tx: TransactionClient, referralId: string, referrerId: string, refereeId: string) {
  const [bonusReferrer, bonusReferee, expiryMonth, expiryDay] = await Promise.all([
    getConfigNumber("referral_bonus_referrer"),
    getConfigNumber("referral_bonus_referee"),
    getConfigNumber("points_expiry_month"),
    getConfigNumber("points_expiry_day"),
  ]);
  const expiresAt = expiryForThisYear(expiryMonth, expiryDay);

  await tx.pointsLedger.create({
    data: {
      userId: referrerId,
      referralId,
      delta: bonusReferrer,
      source: "referral",
      status: "unlocked",
      expiresAt,
    },
  });
  await tx.pointsLedger.create({
    data: {
      userId: refereeId,
      referralId,
      delta: bonusReferee,
      source: "referral",
      status: "locked",
      expiresAt,
    },
  });
  await tx.referral.update({
    where: { id: referralId },
    data: { referrerBonusCreditedAt: new Date() },
  });
}

export function expiryForThisYear(month: number, day: number): Date {
  const now = new Date();
  const year = now.getMonth() + 1 > month || (now.getMonth() + 1 === month && now.getDate() > day)
    ? now.getFullYear() + 1
    : now.getFullYear();
  return new Date(Date.UTC(year, month - 1, day));
}
