import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

const TEMP_PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

// Human-typeable temp password for the seeded first-admin / staff resets —
// avoids ambiguous characters (0/O, 1/l/I) since it's read off a terminal.
export function generateTempPassword(length = 10): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += TEMP_PASSWORD_CHARS[Math.floor(Math.random() * TEMP_PASSWORD_CHARS.length)];
  }
  return out;
}
