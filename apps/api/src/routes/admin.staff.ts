import { Router } from "express";
import { z } from "zod";
import { normalizePhone } from "@meili/shared";
import { AppError } from "../lib/errors.js";
import { asyncHandler } from "../lib/http.js";
import { blockIfTempPassword, requireRole, requireStaffAuth } from "../middleware/auth.js";
import { generateTempPassword, hashPassword } from "../lib/password.js";
import { prisma } from "../lib/prisma.js";

export const adminStaffRouter = Router();

// StaffPage isn't in STAFF_PAGES — creating/resetting accounts is admin-only.
const adminOnly = [requireStaffAuth, blockIfTempPassword, requireRole("admin" as const)];

function toPublicStaff(s: { id: string; fullName: string; phone: string; role: string; status: string; createdAt: Date; lastLoginAt: Date | null }) {
  return { id: s.id, fullName: s.fullName, phone: s.phone, role: s.role, status: s.status, createdAt: s.createdAt, lastLoginAt: s.lastLoginAt };
}

adminStaffRouter.get(
  "/staff",
  ...adminOnly,
  asyncHandler(async (_req, res) => {
    const staff = await prisma.staff.findMany({ orderBy: { createdAt: "asc" } });
    res.json({ items: staff.map(toPublicStaff) });
  }),
);

// Mirrors the seed script's first-admin pattern: random temp password,
// returned once in the response, forced change on first login.
adminStaffRouter.post(
  "/staff",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const body = z
      .object({ fullName: z.string().min(1), phone: z.string().min(8).transform(normalizePhone), role: z.enum(["admin", "staff"]) })
      .parse(req.body);

    const existing = await prisma.staff.findUnique({ where: { phone: body.phone } });
    if (existing) throw new AppError(409, "เบอร์นี้มีบัญชีอยู่แล้ว", "phone_taken");

    const tempPassword = generateTempPassword();
    const staff = await prisma.staff.create({
      data: {
        fullName: body.fullName,
        phone: body.phone,
        role: body.role,
        passwordHash: await hashPassword(tempPassword),
        isTempPassword: true,
      },
    });
    await prisma.staffResetLog.create({
      data: { staffId: staff.id, performedById: req.staff!.id, action: "created", note: `role=${body.role}` },
    });

    res.status(201).json({ staff: toPublicStaff(staff), tempPassword });
  }),
);

adminStaffRouter.patch(
  "/staff/:id/reset-phone",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const body = z.object({ newPhone: z.string().min(8).transform(normalizePhone) }).parse(req.body);
    const target = await prisma.staff.findUnique({ where: { id: req.params.id } });
    if (!target) throw new AppError(404, "ไม่พบพนักงานนี้", "staff_not_found");

    const existing = await prisma.staff.findUnique({ where: { phone: body.newPhone } });
    if (existing) throw new AppError(409, "เบอร์นี้มีบัญชีอยู่แล้ว", "phone_taken");

    await prisma.$transaction([
      prisma.staff.update({ where: { id: target.id }, data: { phone: body.newPhone } }),
      prisma.staffResetLog.create({
        data: { staffId: target.id, performedById: req.staff!.id, action: "reset_phone", note: `-> ${body.newPhone}` },
      }),
    ]);
    res.json({ ok: true });
  }),
);

adminStaffRouter.patch(
  "/staff/:id/reset-password",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const target = await prisma.staff.findUnique({ where: { id: req.params.id } });
    if (!target) throw new AppError(404, "ไม่พบพนักงานนี้", "staff_not_found");

    const tempPassword = generateTempPassword();
    await prisma.$transaction([
      prisma.staff.update({ where: { id: target.id }, data: { passwordHash: await hashPassword(tempPassword), isTempPassword: true } }),
      prisma.staffResetLog.create({ data: { staffId: target.id, performedById: req.staff!.id, action: "reset_password" } }),
    ]);
    res.json({ ok: true, tempPassword });
  }),
);

adminStaffRouter.patch(
  "/staff/:id/suspend",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const target = await prisma.staff.findUnique({ where: { id: req.params.id } });
    if (!target) throw new AppError(404, "ไม่พบพนักงานนี้", "staff_not_found");
    if (target.id === req.staff!.id) throw new AppError(400, "ไม่สามารถระงับบัญชีตัวเองได้", "cannot_suspend_self");

    const nextStatus = target.status === "active" ? "suspended" : "active";
    await prisma.$transaction([
      prisma.staff.update({ where: { id: target.id }, data: { status: nextStatus } }),
      prisma.staffResetLog.create({ data: { staffId: target.id, performedById: req.staff!.id, action: nextStatus === "suspended" ? "suspend" : "unsuspend" } }),
    ]);
    res.json({ ok: true, status: nextStatus });
  }),
);

adminStaffRouter.get(
  "/staff/reset-log",
  ...adminOnly,
  asyncHandler(async (_req, res) => {
    const log = await prisma.staffResetLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { staff: { select: { fullName: true, phone: true } }, performedBy: { select: { fullName: true } } },
    });
    res.json({
      items: log.map((l) => ({
        id: l.id,
        action: l.action,
        note: l.note,
        createdAt: l.createdAt,
        staffName: l.staff.fullName,
        staffPhone: l.staff.phone,
        performedByName: l.performedBy.fullName,
      })),
    });
  }),
);
