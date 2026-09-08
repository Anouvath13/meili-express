import { Router } from "express";
import { z } from "zod";
import { normalizePhone } from "@meili/shared";
import { AppError } from "../lib/errors.js";
import { asyncHandler } from "../lib/http.js";
import { signCustomerToken } from "../lib/jwt.js";
import { requireCustomerAuth } from "../middleware/auth.js";
import { generateAndSendOtp, verifyOtp } from "../lib/otp.js";
import { comparePassword, hashPassword } from "../lib/password.js";
import { prisma } from "../lib/prisma.js";
import { assertNotSelfReferral, creditReferralBonus, generateAccountId } from "../lib/referral.js";

export const customerAuthRouter = Router();

const phoneSchema = z.string().min(8).transform(normalizePhone);
const otpPurposeSchema = z.enum(["register", "login", "reset_password"]);

function toPublicUser(user: { id: string; accountId: string; phone: string; fullName: string | null; email: string | null; passwordHash: string | null }) {
  return {
    id: user.id,
    accountId: user.accountId,
    phone: user.phone,
    fullName: user.fullName,
    email: user.email,
    hasPassword: user.passwordHash !== null,
  };
}

// ---------------------------------------------------------------- send-otp
customerAuthRouter.post(
  "/send-otp",
  asyncHandler(async (req, res) => {
    const body = z.object({ phone: phoneSchema, purpose: otpPurposeSchema }).parse(req.body);

    const existing = await prisma.user.findUnique({ where: { phone: body.phone } });
    if (body.purpose === "register" && existing) {
      throw new AppError(409, "เบอร์นี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบแทน");
    }
    if ((body.purpose === "login" || body.purpose === "reset_password") && !existing) {
      throw new AppError(404, "ไม่พบบัญชีที่ใช้เบอร์นี้");
    }

    const { devCode } = await generateAndSendOtp(body.phone, body.purpose);
    res.json({ ok: true, ...(devCode ? { devCode } : {}) });
  }),
);

// -------------------------------------------------------------- verify-otp
// Pre-check only — does not consume the code. Lets the frontend confirm
// "OTP correct" before the user finishes the rest of a form.
customerAuthRouter.post(
  "/verify-otp",
  asyncHandler(async (req, res) => {
    const body = z.object({ phone: phoneSchema, otp: z.string().length(6), purpose: otpPurposeSchema }).parse(req.body);
    await verifyOtp(body.phone, body.otp, body.purpose, { consume: false });
    res.json({ ok: true });
  }),
);

// ---------------------------------------------------------------- register
customerAuthRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        phone: phoneSchema,
        otp: z.string().length(6),
        fullName: z.string().min(1),
        referralCode: z.string().optional(),
      })
      .parse(req.body);

    const existing = await prisma.user.findUnique({ where: { phone: body.phone } });
    if (existing) throw new AppError(409, "เบอร์นี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบแทน");

    await verifyOtp(body.phone, body.otp, "register", { consume: true });

    let referrer: { id: string; phone: string } | null = null;
    if (body.referralCode) {
      referrer = await prisma.user.findUnique({
        where: { accountId: body.referralCode },
        select: { id: true, phone: true },
      });
      if (!referrer) throw new AppError(400, "รหัสแนะนำไม่ถูกต้อง");
      await assertNotSelfReferral(referrer.phone, body.phone);
    }

    const accountId = await generateAccountId();

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          accountId,
          phone: body.phone,
          fullName: body.fullName,
          lastLoginAt: new Date(),
        },
      });

      if (referrer) {
        const referral = await tx.referral.create({
          data: { referrerId: referrer.id, refereeId: created.id },
        });
        await creditReferralBonus(tx, referral.id, referrer.id, created.id);
      }

      return created;
    });

    const token = signCustomerToken(user.id);
    res.status(201).json({ token, user: toPublicUser(user) });
  }),
);

// ------------------------------------------------------------- login (OTP)
customerAuthRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const body = z.object({ phone: phoneSchema, otp: z.string().length(6) }).parse(req.body);

    const user = await prisma.user.findUnique({ where: { phone: body.phone } });
    if (!user) throw new AppError(404, "ไม่พบบัญชีที่ใช้เบอร์นี้");
    if (user.status !== "active") throw new AppError(403, "บัญชีนี้ถูกระงับการใช้งาน");

    await verifyOtp(body.phone, body.otp, "login", { consume: true });
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = signCustomerToken(user.id);
    res.json({ token, user: toPublicUser(user) });
  }),
);

// -------------------------------------------------- login-password (optional)
// Not in the original Backend Design Document's endpoint list — added per
// the confirmed rule: password is an optional fallback method customers can
// set up after their first OTP login; OTP always still works.
customerAuthRouter.post(
  "/login-password",
  asyncHandler(async (req, res) => {
    const body = z.object({ phone: phoneSchema, password: z.string().min(1) }).parse(req.body);

    const user = await prisma.user.findUnique({ where: { phone: body.phone } });
    if (!user || !user.passwordHash) throw new AppError(401, "เบอร์หรือรหัสผ่านไม่ถูกต้อง");
    if (user.status !== "active") throw new AppError(403, "บัญชีนี้ถูกระงับการใช้งาน");

    const ok = await comparePassword(body.password, user.passwordHash);
    if (!ok) throw new AppError(401, "เบอร์หรือรหัสผ่านไม่ถูกต้อง");

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = signCustomerToken(user.id);
    res.json({ token, user: toPublicUser(user) });
  }),
);

// ------------------------------------------------------------ set-password
// First-time opt-in (no old password to check) — offered right after a
// successful OTP login per the confirmed flow.
customerAuthRouter.post(
  "/set-password",
  requireCustomerAuth,
  asyncHandler(async (req, res) => {
    const body = z.object({ password: z.string().min(6) }).parse(req.body);
    const passwordHash = await hashPassword(body.password);
    await prisma.user.update({ where: { id: req.userId! }, data: { passwordHash } });
    res.json({ ok: true });
  }),
);

// --------------------------------------------------------- change-password
customerAuthRouter.post(
  "/change-password",
  requireCustomerAuth,
  asyncHandler(async (req, res) => {
    const body = z.object({ oldPassword: z.string(), newPassword: z.string().min(6) }).parse(req.body);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
    if (!user.passwordHash) throw new AppError(400, "ยังไม่ได้ตั้งรหัสผ่าน กรุณาใช้ set-password ก่อน");

    const ok = await comparePassword(body.oldPassword, user.passwordHash);
    if (!ok) throw new AppError(401, "รหัสผ่านเดิมไม่ถูกต้อง");

    const passwordHash = await hashPassword(body.newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    res.json({ ok: true });
  }),
);

// -------------------------------------------------------- forgot-password
customerAuthRouter.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const body = z.object({ phone: phoneSchema }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { phone: body.phone } });
    if (!user) throw new AppError(404, "ไม่พบบัญชีที่ใช้เบอร์นี้");

    const { devCode } = await generateAndSendOtp(body.phone, "reset_password");
    res.json({ ok: true, ...(devCode ? { devCode } : {}) });
  }),
);

// --------------------------------------------------------- reset-password
customerAuthRouter.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const body = z
      .object({ phone: phoneSchema, otp: z.string().length(6), newPassword: z.string().min(6) })
      .parse(req.body);

    const user = await prisma.user.findUnique({ where: { phone: body.phone } });
    if (!user) throw new AppError(404, "ไม่พบบัญชีที่ใช้เบอร์นี้");

    await verifyOtp(body.phone, body.otp, "reset_password", { consume: true });

    const passwordHash = await hashPassword(body.newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    res.json({ ok: true });
  }),
);

// ------------------------------------------------------------------- logout
customerAuthRouter.post(
  "/logout",
  requireCustomerAuth,
  asyncHandler(async (_req, res) => {
    // Stateless JWT — nothing server-side to invalidate yet. Kept as a real
    // endpoint (rather than a client-only no-op) so a token-blacklist can
    // slot in later without an API shape change.
    res.json({ ok: true });
  }),
);

// ----------------------------------------------------------------------- me
customerAuthRouter.get(
  "/me",
  requireCustomerAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });

    const balance = await prisma.pointsLedger.aggregate({
      where: { userId: user.id, status: "unlocked", OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] },
      _sum: { delta: true },
    });
    const locked = await prisma.pointsLedger.aggregate({
      where: { userId: user.id, status: "locked" },
      _sum: { delta: true },
    });

    res.json({
      user: toPublicUser(user),
      points: { unlocked: balance._sum.delta ?? 0, locked: locked._sum.delta ?? 0 },
    });
  }),
);
