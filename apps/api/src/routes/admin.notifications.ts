import { Router } from "express";
import { z } from "zod";
import { AppError } from "../lib/errors.js";
import { asyncHandler } from "../lib/http.js";
import { blockIfTempPassword, requireRole, requireStaffAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { sendSms } from "../lib/sms.js";

export const adminNotificationsRouter = Router();

// NotifPage isn't in STAFF_PAGES — admin-only, like the rest of CMS.
const adminOnly = [requireStaffAuth, blockIfTempPassword, requireRole("admin" as const)];

adminNotificationsRouter.get(
  "/notification-templates",
  ...adminOnly,
  asyncHandler(async (_req, res) => {
    const templates = await prisma.notificationTemplate.findMany({ orderBy: { templateKey: "asc" } });
    res.json({ templates });
  }),
);

adminNotificationsRouter.put(
  "/notification-templates/:id",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const body = z
      .object({ title: z.string().min(1), bodyWeb: z.string().min(1), bodyWhatsapp: z.string().min(1), isActive: z.boolean().optional() })
      .parse(req.body);
    const existing = await prisma.notificationTemplate.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError(404, "ไม่พบเทมเพลตนี้", "template_not_found");

    const template = await prisma.notificationTemplate.update({ where: { id: req.params.id }, data: { ...body, updatedById: req.staff!.id } });
    res.json({ template });
  }),
);

// Sends the WhatsApp copy to a phone number of the admin's choosing, via the
// same mock-first provider abstraction as the real notification dispatch —
// lets an admin proofread a template before it goes live.
adminNotificationsRouter.post(
  "/notifications/send-test/:id",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const body = z.object({ phone: z.string().min(8) }).parse(req.body);
    const template = await prisma.notificationTemplate.findUnique({ where: { id: req.params.id } });
    if (!template) throw new AppError(404, "ไม่พบเทมเพลตนี้", "template_not_found");

    await sendSms(body.phone, `[TEST] ${template.bodyWhatsapp}`);
    res.json({ ok: true });
  }),
);
