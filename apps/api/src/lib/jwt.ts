import jwt from "jsonwebtoken";

const CUSTOMER_SECRET = process.env.JWT_CUSTOMER_SECRET;
const ADMIN_SECRET = process.env.JWT_ADMIN_SECRET;

if (!CUSTOMER_SECRET || !ADMIN_SECRET) {
  throw new Error("JWT_CUSTOMER_SECRET and JWT_ADMIN_SECRET must be set in .env");
}

export type CustomerTokenPayload = { sub: string; type: "customer" };
export type StaffTokenPayload = { sub: string; role: "admin" | "staff"; type: "staff" };

// Customer sessions are long-lived (phone-based consumer app, no refresh
// flow yet); admin sessions are shorter since they gate write access to
// everything in the CMS/config.
export function signCustomerToken(userId: string): string {
  return jwt.sign({ sub: userId, type: "customer" } satisfies CustomerTokenPayload, CUSTOMER_SECRET!, {
    expiresIn: "30d",
  });
}

export function verifyCustomerToken(token: string): CustomerTokenPayload {
  return jwt.verify(token, CUSTOMER_SECRET!) as CustomerTokenPayload;
}

export function signStaffToken(staffId: string, role: "admin" | "staff"): string {
  return jwt.sign({ sub: staffId, role, type: "staff" } satisfies StaffTokenPayload, ADMIN_SECRET!, {
    expiresIn: "12h",
  });
}

export function verifyStaffToken(token: string): StaffTokenPayload {
  return jwt.verify(token, ADMIN_SECRET!) as StaffTokenPayload;
}
