import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errors.js";
import { verifyCustomerToken, verifyStaffToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      staff?: { id: string; role: "admin" | "staff" };
    }
  }
}

function bearerToken(req: Request): string {
  const header = req.headers.authorization ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new AppError(401, "ต้องเข้าสู่ระบบก่อน", "not_authenticated");
  }
  return token;
}

export function requireCustomerAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const payload = verifyCustomerToken(bearerToken(req));
    req.userId = payload.sub;
    next();
  } catch {
    next(new AppError(401, "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่", "session_expired"));
  }
}

// Loads the Staff row (not just the JWT claims) so a suspended account or a
// still-temp password is caught even mid-session, without waiting for the
// token to expire.
export async function requireStaffAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const payload = verifyStaffToken(bearerToken(req));
    const staff = await prisma.staff.findUnique({ where: { id: payload.sub } });
    if (!staff || staff.status !== "active") {
      throw new AppError(401, "บัญชีถูกระงับหรือไม่พบบัญชี", "account_suspended");
    }
    req.staff = { id: staff.id, role: staff.role };
    (req as Request & { staffRecord?: typeof staff }).staffRecord = staff;
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(new AppError(401, "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่", "session_expired"));
  }
}

// Blocks every staff route except the password-change endpoint itself while
// isTempPassword is true — enforces the "force change on first login" rule
// server-side, not just as a UI redirect.
export function blockIfTempPassword(req: Request, _res: Response, next: NextFunction) {
  const staff = (req as Request & { staffRecord?: { isTempPassword: boolean } }).staffRecord;
  if (staff?.isTempPassword) {
    return next(new AppError(403, "ต้องเปลี่ยนรหัสผ่านชั่วคราวก่อนใช้งานส่วนอื่น", "must_change_temp_password"));
  }
  next();
}

export function requireRole(role: "admin") {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (req.staff?.role !== role) {
      return next(new AppError(403, "ต้องเป็นผู้ดูแลระบบ (admin) เท่านั้น", "admin_only"));
    }
    next();
  };
}
