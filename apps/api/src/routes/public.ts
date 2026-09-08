import { Router } from "express";
import { z } from "zod";
import { AppError } from "../lib/errors.js";
import { asyncHandler } from "../lib/http.js";
import { prisma } from "../lib/prisma.js";

export const publicRouter = Router();

// ------------------------------------------------------------------ rates
// Component Spec's RatesTable has no API row of its own, but the values
// are business-critical (Content Brief §0.7 "ห้ามฝังค่าตายตัวในโค้ด") and
// already live in shipping_rates for /admin/rates (Step 7) to edit — so the
// public table reads from the same source instead of a second hardcoded copy.
publicRouter.get(
  "/rates",
  asyncHandler(async (_req, res) => {
    const rates = await prisma.shippingRate.findMany({ orderBy: { sortOrder: "asc" } });
    res.json({ rates });
  }),
);

// ---------------------------------------------------------------- tracking
// Public — matches Component Spec's `GET /api/tracking?waybill=` (aliased
// here as a path param; Backend Design Document calls the same thing
// `GET /shipments/:bill_number`).
publicRouter.get(
  "/tracking/:billNumber",
  asyncHandler(async (req, res) => {
    const shipment = await prisma.shipment.findUnique({
      where: { billNumber: req.params.billNumber.trim().toUpperCase() },
      include: { trackingHistory: { orderBy: { changedAt: "asc" } } },
    });
    if (!shipment) throw new AppError(404, "ไม่พบเลขบิลลาวนี้ กรุณาตรวจสอบอีกครั้ง");

    res.json({
      billNumber: shipment.billNumber,
      origin: shipment.origin,
      destination: shipment.destination,
      weightKg: shipment.weightKg,
      productType: shipment.productType,
      price: shipment.price,
      status: shipment.status,
      receivedDate: shipment.receivedDate,
      estimatedDelivery: shipment.estimatedDelivery,
      actualDelivery: shipment.actualDelivery,
      history: shipment.trackingHistory.map((h) => ({
        status: h.status,
        location: h.location,
        note: h.note,
        changedAt: h.changedAt,
      })),
    });
  }),
);

// -------------------------------------------------------------------- news
publicRouter.get(
  "/news",
  asyncHandler(async (req, res) => {
    const query = z
      .object({ limit: z.coerce.number().int().positive().max(50).optional(), category: z.string().optional() })
      .parse(req.query);

    const items = await prisma.newsArticle.findMany({
      where: {
        isPublished: true,
        deletedAt: null,
        ...(query.category ? { category: { key: query.category } } : {}),
      },
      include: { category: true },
      orderBy: { publishedAt: "desc" },
      take: query.limit ?? 20,
    });

    res.json({
      items: items.map((n) => ({
        id: n.id,
        category: n.category.key,
        titleLo: n.titleLo,
        titleZh: n.titleZh,
        titleEn: n.titleEn,
        coverImageUrl: n.coverImageUrl,
        publishedAt: n.publishedAt,
      })),
    });
  }),
);

publicRouter.get(
  "/news/categories",
  asyncHandler(async (_req, res) => {
    const categories = await prisma.newsCategory.findMany();
    res.json({ categories });
  }),
);

publicRouter.get(
  "/news/:id",
  asyncHandler(async (req, res) => {
    const article = await prisma.newsArticle.findFirst({
      where: { id: req.params.id, isPublished: true, deletedAt: null },
      include: { category: true },
    });
    if (!article) throw new AppError(404, "ไม่พบข่าวนี้");
    res.json({ article });
  }),
);

// -------------------------------------------------------------------- faq
publicRouter.get(
  "/faq",
  asyncHandler(async (_req, res) => {
    const [categories, items] = await Promise.all([
      prisma.faqCategory.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.faqItem.findMany({ where: { isPublished: true, deletedAt: null }, orderBy: { sortOrder: "asc" } }),
    ]);
    res.json({ categories, items });
  }),
);

// ---------------------------------------------------------------- reviews
publicRouter.get(
  "/reviews",
  asyncHandler(async (_req, res) => {
    const reviews = await prisma.review.findMany({
      where: { status: "approved", deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 12,
    });
    res.json({ reviews });
  }),
);

// --------------------------------------------------------------- contact
publicRouter.post(
  "/contact",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        name: z.string().min(1),
        phone: z.string().min(4),
        subject: z.string().optional(),
        message: z.string().min(1),
      })
      .parse(req.body);

    await prisma.contactMessage.create({ data: body });
    res.status(201).json({ ok: true });
  }),
);
