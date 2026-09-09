import { Router } from "express";
import { z } from "zod";
import { normalizePhone } from "@meili/shared";
import { AppError } from "../lib/errors.js";
import { asyncHandler } from "../lib/http.js";
import { signStaffToken } from "../lib/jwt.js";
import { requireStaffAuth } from "../middleware/auth.js";
import { comparePassword, hashPassword } from "../lib/password.js";
import { prisma } from "../lib/prisma.js";

export const adminAuthRouter = Router();

const phoneSchema = z.string().min(8).transform(normalizePhone);

function toPublicStaff(staff: { id: string; fullName: string; phone: string; role: "admin" | "staff"; isTempPassword: boolean }) {
  return {
    id: staff.id,
    fullName: staff.fullName,
    phone: staff.phone,
    role: staff.role,
    forcePasswordChange: staff.isTempPassword,
  };
}

// No OTP anywhere in this router by design (confirmed rule): phone+password
// only, and accounts exist only via /admin/staff (Step 7) — there is no
// public signup or "secret code" self-elevation path.
adminAuthRouter.post(
  "/auth/login",
  asyncHandler(async (req, res) => {
    const body = z.object({ phone: phoneSchema, password: z.string().min(1) }).parse(req.body);

    const staff = await prisma.staff.findUnique({ where: { phone: body.phone } });
    if (!staff) throw new AppError(401, "เบอร์หรือรหัสผ่านไม่ถูกต้อง", "invalid_credentials");
    if (staff.status !== "active") throw new AppError(403, "บัญชีนี้ถูกระงับการใช้งาน", "account_suspended");

    const ok = await comparePassword(body.password, staff.passwordHash);
    if (!ok) throw new AppError(401, "เบอร์หรือรหัสผ่านไม่ถูกต้อง", "invalid_credentials");

    await prisma.staff.update({ where: { id: staff.id }, data: { lastLoginAt: new Date() } });

    const token = signStaffToken(staff.id, staff.role);
    res.json({ token, staff: toPublicStaff(staff) });
  }),
);

adminAuthRouter.get(
  "/me",
  requireStaffAuth,
  asyncHandler(async (req, res) => {
    const staff = await prisma.staff.findUniqueOrThrow({ where: { id: req.staff!.id } });
    res.json({ staff: toPublicStaff(staff) });
  }),
);

// Deliberately NOT gated by blockIfTempPassword — this is the one route a
// forced-temp-password account must still be able to reach.
adminAuthRouter.put(
  "/me/password",
  requireStaffAuth,
  asyncHandler(async (req, res) => {
    const body = z.object({ oldPassword: z.string(), newPassword: z.string().min(8) }).parse(req.body);
    const staff = await prisma.staff.findUniqueOrThrow({ where: { id: req.staff!.id } });

    const ok = await comparePassword(body.oldPassword, staff.passwordHash);
    if (!ok) throw new AppError(401, "รหัสผ่านเดิมไม่ถูกต้อง", "wrong_old_password");

    const passwordHash = await hashPassword(body.newPassword);
    await prisma.staff.update({
      where: { id: staff.id },
      data: { passwordHash, isTempPassword: false },
    });
    res.json({ ok: true });
  }),
);

adminAuthRouter.post(
  "/auth/logout",
  requireStaffAuth,
  asyncHandler(async (_req, res) => {
    res.json({ ok: true });
  }),
);
