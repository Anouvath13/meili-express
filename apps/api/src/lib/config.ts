import { AppError } from "./errors.js";
import { prisma } from "./prisma.js";

// Every magic number is read from system_config at call time (no cache) so
// an admin's edit in /admin/config takes effect on the very next request —
// see Backend Design Document §6 "Config-driven everything".
export async function getConfigNumber(key: string): Promise<number> {
  const row = await prisma.systemConfig.findUnique({ where: { configKey: key } });
  if (!row) throw new AppError(500, `Missing system_config key: ${key}`);
  const n = Number(row.configValue);
  if (Number.isNaN(n)) throw new AppError(500, `system_config.${key} is not numeric: ${row.configValue}`);
  return n;
}

export async function getConfigString(key: string): Promise<string> {
  const row = await prisma.systemConfig.findUnique({ where: { configKey: key } });
  if (!row) throw new AppError(500, `Missing system_config key: ${key}`);
  return row.configValue;
}
