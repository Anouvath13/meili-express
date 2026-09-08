import crypto from "node:crypto";
import type { OtpPurpose } from "../generated/prisma/enums.js";
import { AppError } from "./errors.js";
import { hashPassword, comparePassword } from "./password.js";
import { prisma } from "./prisma.js";
import { isMockSms, sendSms } from "./sms.js";

const OTP_TTL_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;

const OTP_MESSAGE: Record<OtpPurpose, string> = {
  register: "รหัส OTP สมัครสมาชิก MEILI EXPRESS ของคุณคือ",
  login: "รหัส OTP เข้าสู่ระบบ MEILI EXPRESS ของคุณคือ",
  reset_password: "รหัส OTP ตั้งรหัสผ่านใหม่ MEILI EXPRESS ของคุณคือ",
  change_phone: "รหัส OTP ยืนยันเบอร์ใหม่ MEILI EXPRESS ของคุณคือ",
};

// Returns the plaintext code only when SMS_PROVIDER=mock, so local dev/tests
// can read it straight from the API response instead of tailing server logs.
export async function generateAndSendOtp(phone: string, purpose: OtpPurpose): Promise<{ devCode?: string }> {
  const code = crypto.randomInt(100000, 999999).toString();
  const codeHash = await hashPassword(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);

  await prisma.otp.create({
    data: { phone, purpose, codeHash, expiresAt },
  });

  await sendSms(phone, `${OTP_MESSAGE[purpose]} ${code} (${OTP_TTL_MINUTES} นาที)`);

  return isMockSms ? { devCode: code } : {};
}

// `consume: false` is a pre-check only (Backend Design Document's
// /auth/verify-otp) — it doesn't burn the code, so the real action
// (register/login/reset-password) still gets to consume it once.
export async function verifyOtp(
  phone: string,
  code: string,
  purpose: OtpPurpose,
  opts: { consume: boolean },
): Promise<void> {
  const otp = await prisma.otp.findFirst({
    where: { phone, purpose, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    throw new AppError(400, "OTP ไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอรหัสใหม่");
  }
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    throw new AppError(429, "กรอกรหัส OTP ผิดหลายครั้งเกินไป กรุณาขอรหัสใหม่");
  }

  const ok = await comparePassword(code, otp.codeHash);
  if (!ok) {
    await prisma.otp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    throw new AppError(400, "รหัส OTP ไม่ถูกต้อง");
  }

  if (opts.consume) {
    await prisma.otp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
  }
}
