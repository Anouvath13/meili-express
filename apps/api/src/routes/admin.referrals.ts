import { Router } from "express";
import { z } from "zod";
import { AppError } from "../lib/errors.js";
import { asyncHandler } from "../lib/http.js";
import { blockIfTempPassword, requireRole, requireStaffAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const adminReferralsRouter = Router();

// "referral" isn't in STAFF_PAGES — fraud review is admin-only.
const adminOnly = [requireStaffAuth, blockIfTempPassword, requireRole("admin" as const)];

adminReferralsRouter.get(
  "/referrals",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const query = z.object({ status: z.enum(["pending", "unlocked", "flagged"]).optional() }).parse(req.query);
    const referrals = await prisma.referral.findMany({
      where: query.status ? { status: query.status } : undefined,
      include: {
        referrer: { select: { fullName: true, phone: true, accountId: true } },
        referee: { select: { fullName: true, phone: true } },
      },
      orderBy: { linkedAt: "desc" },
    });
    res.json({
      items: referrals.map((r) => ({
        id: r.id,
        referrerName: r.referrer.fullName,
        referrerPhone: r.referrer.phone,
        referralCode: r.referrer.accountId,
        refereeName: r.referee.fullName,
        refereePhone: r.referee.phone,
        cumulativeKg: r.cumulativeKg,
        status: r.status,
        fraudFlag: r.fraudFlag,
        fraudReason: r.fraudReason,
        linkedAt: r.linkedAt,
      })),
    });
  }),
);

adminReferralsRouter.patch(
  "/referrals/:id/approve",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const referral = await prisma.referral.findUnique({ where: { id: req.params.id } });
    if (!referral) throw new AppError(404, "ไม่พบรายการนี้", "referral_not_found");
    const updated = await prisma.referral.update({
      where: { id: referral.id },
      data: { fraudFlag: false, fraudReason: null, reviewedById: req.staff!.id, reviewedAt: new Date() },
    });
    res.json({ referral: updated });
  }),
);

adminReferralsRouter.patch(
  "/referrals/:id/suspend",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const body = z.object({ note: z.string().optional() }).parse(req.body);
    const referral = await prisma.referral.findUnique({ where: { id: req.params.id } });
    if (!referral) throw new AppError(404, "ไม่พบรายการนี้", "referral_not_found");

    const updated = await prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: "flagged",
        fraudFlag: true,
        fraudReason: body.note ?? "manual_review",
        reviewedById: req.staff!.id,
        reviewedAt: new Date(),
      },
    });
    res.json({ referral: updated });
  }),
);

// -------------------------------------------------------------- fraud flags
adminReferralsRouter.get(
  "/fraud/flags",
  ...adminOnly,
  asyncHandler(async (_req, res) => {
    const flags = await prisma.fraudFlag.findMany({
      where: { reviewed: false },
      include: { user: { select: { fullName: true, phone: true, accountId: true } } },
      orderBy: { detectedAt: "desc" },
    });
    res.json({ items: flags });
  }),
);

adminReferralsRouter.put(
  "/fraud/flags/:id",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const body = z.object({ action: z.enum(["approve", "suspend"]), note: z.string().optional() }).parse(req.body);
    const flag = await prisma.fraudFlag.findUnique({ where: { id: req.params.id } });
    if (!flag) throw new AppError(404, "ไม่พบรายการนี้", "fraud_flag_not_found");

    await prisma.$transaction([
      prisma.fraudFlag.update({ where: { id: flag.id }, data: { reviewed: true, reviewedById: req.staff!.id, reviewedAt: new Date() } }),
      prisma.user.update({ where: { id: flag.userId }, data: { status: body.action === "approve" ? "active" : "suspended" } }),
    ]);
    res.json({ ok: true });
  }),
);
