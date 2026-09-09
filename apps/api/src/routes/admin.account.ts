import { Router } from "express";
import { z } from "zod";
import { normalizePhone } from "@meili/shared";
import { AppError } from "../lib/errors.js";
import { asyncHandler } from "../lib/http.js";
import { blockIfTempPassword, requireRole, requireStaffAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const adminAccountRouter = Router();

adminAccountRouter.put(
  "/me/name",
  requireStaffAuth,
  blockIfTempPassword,
  asyncHandler(async (req, res) => {
    const body = z.object({ fullName: z.string().min(1) }).parse(req.body);
    const staff = await prisma.staff.update({ where: { id: req.staff!.id }, data: { fullName: body.fullName } });
    res.json({ id: staff.id, fullName: staff.fullName });
  }),
);

// --------------------------------------------------- phone-change requests
// Not in the original Backend Design Document (its /admin/me/phone/otp used
// OTP, which contradicts the confirmed "no OTP anywhere for admin" rule).
// Instead: any staff/admin can *request* a phone change, but only an admin
// can approve or reject it — no self-service, no OTP.
adminAccountRouter.post(
  "/me/phone/request",
  requireStaffAuth,
  blockIfTempPassword,
  asyncHandler(async (req, res) => {
    const body = z.object({ newPhone: z.string().min(8).transform(normalizePhone) }).parse(req.body);

    const existing = await prisma.staff.findUnique({ where: { phone: body.newPhone } });
    if (existing) throw new AppError(409, "เบอร์นี้มีบัญชีอยู่แล้ว", "phone_taken");

    const pending = await prisma.staffPhoneChangeRequest.findFirst({ where: { staffId: req.staff!.id, status: "pending" } });
    if (pending) throw new AppError(409, "มีคำขอเปลี่ยนเบอร์ที่รออนุมัติอยู่แล้ว", "phone_change_already_pending");

    const request = await prisma.staffPhoneChangeRequest.create({
      data: { staffId: req.staff!.id, newPhone: body.newPhone },
    });
    res.status(201).json({ id: request.id, newPhone: request.newPhone, status: request.status });
  }),
);

adminAccountRouter.get(
  "/me/phone/requests",
  requireStaffAuth,
  blockIfTempPassword,
  asyncHandler(async (req, res) => {
    const requests = await prisma.staffPhoneChangeRequest.findMany({
      where: { staffId: req.staff!.id },
      orderBy: { requestedAt: "desc" },
      take: 10,
    });
    res.json({ items: requests });
  }),
);

// Admin-only review queue — approving here is the only way a staff/admin
// phone number ever changes.
adminAccountRouter.get(
  "/phone-requests",
  requireStaffAuth,
  blockIfTempPassword,
  requireRole("admin"),
  asyncHandler(async (_req, res) => {
    const requests = await prisma.staffPhoneChangeRequest.findMany({
      where: { status: "pending" },
      orderBy: { requestedAt: "asc" },
      include: { staff: { select: { fullName: true, phone: true } } },
    });
    res.json({ items: requests });
  }),
);

adminAccountRouter.patch(
  "/phone-requests/:id/approve",
  requireStaffAuth,
  blockIfTempPassword,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const request = await prisma.staffPhoneChangeRequest.findUnique({ where: { id: req.params.id } });
    if (!request || request.status !== "pending") throw new AppError(404, "ไม่พบคำขอนี้ หรือดำเนินการไปแล้ว", "phone_request_not_found");

    const phoneTaken = await prisma.staff.findUnique({ where: { phone: request.newPhone } });
    if (phoneTaken) throw new AppError(409, "เบอร์นี้มีบัญชีอยู่แล้ว", "phone_taken");

    await prisma.$transaction([
      prisma.staff.update({ where: { id: request.staffId }, data: { phone: request.newPhone } }),
      prisma.staffPhoneChangeRequest.update({
        where: { id: request.id },
        data: { status: "approved", reviewedById: req.staff!.id, reviewedAt: new Date() },
      }),
    ]);
    res.json({ ok: true });
  }),
);

adminAccountRouter.patch(
  "/phone-requests/:id/reject",
  requireStaffAuth,
  blockIfTempPassword,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const request = await prisma.staffPhoneChangeRequest.findUnique({ where: { id: req.params.id } });
    if (!request || request.status !== "pending") throw new AppError(404, "ไม่พบคำขอนี้ หรือดำเนินการไปแล้ว", "phone_request_not_found");

    await prisma.staffPhoneChangeRequest.update({
      where: { id: request.id },
      data: { status: "rejected", reviewedById: req.staff!.id, reviewedAt: new Date() },
    });
    res.json({ ok: true });
  }),
);
