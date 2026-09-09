import { Router } from "express";
import { z } from "zod";
import { AppError } from "../lib/errors.js";
import { asyncHandler } from "../lib/http.js";
import { blockIfTempPassword, requireRole, requireStaffAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const adminConfigRouter = Router();

const staffOrAdmin = [requireStaffAuth, blockIfTempPassword];
const adminOnly = [requireStaffAuth, blockIfTempPassword, requireRole("admin" as const)];

// ---------------------------------------------------------------- rates
// Component Spec's RatesPage — staff-accessible (STAFF_PAGES includes
// "rates"). Same shipping_rates table the public /api/rates reads from.
adminConfigRouter.get(
  "/rates",
  ...staffOrAdmin,
  asyncHandler(async (_req, res) => {
    const rates = await prisma.shippingRate.findMany({ orderBy: { sortOrder: "asc" } });
    res.json({ rates });
  }),
);

adminConfigRouter.put(
  "/rates/:key",
  ...staffOrAdmin,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        nameLo: z.string().min(1).optional(),
        nameZh: z.string().min(1).optional(),
        nameEn: z.string().min(1).optional(),
        price: z.coerce.number().positive().optional(),
        currency: z.string().optional(),
        unit: z.string().optional(),
      })
      .parse(req.body);

    const rate = await prisma.shippingRate.findUnique({ where: { key: req.params.key } });
    if (!rate) throw new AppError(404, "ไม่พบอัตราค่าขนส่งนี้", "rate_not_found");

    const updated = await prisma.shippingRate.update({
      where: { key: req.params.key },
      data: { ...body, price: body.price?.toString(), updatedById: req.staff!.id },
    });
    res.json({ rate: updated });
  }),
);

// ---------------------------------------------------------- points-config
// Admin-only (STAFF_PAGES excludes "points") — the 9 keys from Backend
// Design Document §2 that drive the loyalty-points engine.
const POINTS_CONFIG_KEYS = [
  "points_per_kg",
  "min_weight_kg",
  "discount_cap_pct",
  "point_value",
  "points_expiry_month",
  "points_expiry_day",
  "referral_bonus_referrer",
  "referral_bonus_referee",
  "referee_unlock_threshold_kg",
] as const;

adminConfigRouter.get(
  "/points-config",
  ...adminOnly,
  asyncHandler(async (_req, res) => {
    const rows = await prisma.systemConfig.findMany({ where: { configKey: { in: [...POINTS_CONFIG_KEYS] } } });
    res.json({ items: rows });
  }),
);

adminConfigRouter.put(
  "/points-config",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const body = z.record(z.string(), z.coerce.string()).parse(req.body);
    const entries = Object.entries(body).filter(([key]) => (POINTS_CONFIG_KEYS as readonly string[]).includes(key));
    if (entries.length === 0) throw new AppError(400, "ไม่มีค่าที่แก้ไข", "no_valid_keys");

    await prisma.$transaction(
      entries.map(([configKey, configValue]) =>
        prisma.systemConfig.update({ where: { configKey }, data: { configValue, updatedById: req.staff!.id } }),
      ),
    );
    const rows = await prisma.systemConfig.findMany({ where: { configKey: { in: [...POINTS_CONFIG_KEYS] } } });
    res.json({ items: rows });
  }),
);

// --------------------------------------------------------- generic config
// Backend Design Document §4 — full key/value access to system_config,
// admin-only since it also covers things like max_accounts_per_device.
adminConfigRouter.get(
  "/config",
  ...adminOnly,
  asyncHandler(async (_req, res) => {
    const rows = await prisma.systemConfig.findMany({ orderBy: { configKey: "asc" } });
    res.json({ items: rows });
  }),
);

adminConfigRouter.put(
  "/config/:key",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const body = z.object({ value: z.coerce.string() }).parse(req.body);
    const row = await prisma.systemConfig.findUnique({ where: { configKey: req.params.key } });
    if (!row) throw new AppError(404, "ไม่พบค่าคอนฟิกนี้", "config_key_not_found");

    const updated = await prisma.systemConfig.update({
      where: { configKey: req.params.key },
      data: { configValue: body.value, updatedById: req.staff!.id },
    });
    res.json(updated);
  }),
);

adminConfigRouter.post(
  "/config/bulk",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const body = z.array(z.object({ key: z.string(), value: z.coerce.string() })).parse(req.body);
    await prisma.$transaction(
      body.map(({ key, value }) => prisma.systemConfig.update({ where: { configKey: key }, data: { configValue: value, updatedById: req.staff!.id } })),
    );
    res.json({ ok: true });
  }),
);
