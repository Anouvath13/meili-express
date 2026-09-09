import { Router } from "express";
import { z } from "zod";
import { AppError } from "../lib/errors.js";
import { asyncHandler } from "../lib/http.js";
import { blockIfTempPassword, requireRole, requireStaffAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const adminCmsRouter = Router();

// STAFF_PAGES (Component Spec's admin preview) doesn't include news/faq/
// reviews/team — all of CMS is admin-only.
const adminOnly = [requireStaffAuth, blockIfTempPassword, requireRole("admin" as const)];

// -------------------------------------------------------------------- news
adminCmsRouter.get(
  "/news/categories",
  ...adminOnly,
  asyncHandler(async (_req, res) => {
    res.json({ categories: await prisma.newsCategory.findMany() });
  }),
);

adminCmsRouter.get(
  "/news",
  ...adminOnly,
  asyncHandler(async (_req, res) => {
    const items = await prisma.newsArticle.findMany({ where: { deletedAt: null }, include: { category: true }, orderBy: { createdAt: "desc" } });
    res.json({ items });
  }),
);

const newsBody = z.object({
  categoryId: z.string(),
  titleLo: z.string().min(1),
  titleZh: z.string().min(1),
  titleEn: z.string().min(1),
  bodyLo: z.string().min(1),
  bodyZh: z.string().min(1),
  bodyEn: z.string().min(1),
  coverImageUrl: z.string().url().nullable().optional(),
  isPublished: z.boolean().optional(),
});

adminCmsRouter.post(
  "/news",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const body = newsBody.parse(req.body);
    const article = await prisma.newsArticle.create({
      data: { ...body, isPublished: body.isPublished ?? true, publishedAt: new Date(), updatedById: req.staff!.id },
    });
    res.status(201).json({ article });
  }),
);

adminCmsRouter.put(
  "/news/:id",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const body = newsBody.partial().parse(req.body);
    const existing = await prisma.newsArticle.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) throw new AppError(404, "ไม่พบข่าวนี้", "news_not_found");
    const article = await prisma.newsArticle.update({ where: { id: req.params.id }, data: { ...body, updatedById: req.staff!.id } });
    res.json({ article });
  }),
);

adminCmsRouter.delete(
  "/news/:id",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const existing = await prisma.newsArticle.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) throw new AppError(404, "ไม่พบข่าวนี้", "news_not_found");
    await prisma.newsArticle.update({ where: { id: req.params.id }, data: { deletedAt: new Date(), updatedById: req.staff!.id } });
    res.json({ ok: true });
  }),
);

// -------------------------------------------------------------------- faq
adminCmsRouter.get(
  "/faqs/categories",
  ...adminOnly,
  asyncHandler(async (_req, res) => {
    res.json({ categories: await prisma.faqCategory.findMany({ orderBy: { sortOrder: "asc" } }) });
  }),
);

adminCmsRouter.get(
  "/faqs",
  ...adminOnly,
  asyncHandler(async (_req, res) => {
    const items = await prisma.faqItem.findMany({ where: { deletedAt: null }, orderBy: { sortOrder: "asc" } });
    res.json({ items });
  }),
);

const faqBody = z.object({
  categoryId: z.string(),
  questionLo: z.string().min(1),
  questionZh: z.string().min(1),
  questionEn: z.string().min(1),
  answerLo: z.string().min(1),
  answerZh: z.string().min(1),
  answerEn: z.string().min(1),
  isPublished: z.boolean().optional(),
  needsReview: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

adminCmsRouter.post(
  "/faqs",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const body = faqBody.parse(req.body);
    const item = await prisma.faqItem.create({ data: { ...body, isPublished: body.isPublished ?? true, updatedById: req.staff!.id } });
    res.status(201).json({ item });
  }),
);

adminCmsRouter.put(
  "/faqs/:id",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const body = faqBody.partial().parse(req.body);
    const existing = await prisma.faqItem.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) throw new AppError(404, "ไม่พบคำถามนี้", "faq_not_found");
    const item = await prisma.faqItem.update({ where: { id: req.params.id }, data: { ...body, updatedById: req.staff!.id } });
    res.json({ item });
  }),
);

adminCmsRouter.delete(
  "/faqs/:id",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const existing = await prisma.faqItem.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) throw new AppError(404, "ไม่พบคำถามนี้", "faq_not_found");
    await prisma.faqItem.update({ where: { id: req.params.id }, data: { deletedAt: new Date(), updatedById: req.staff!.id } });
    res.json({ ok: true });
  }),
);

// --------------------------------------------------------------- reviews
// §QA note in Backend Design Document: admin needs full CRUD, not just
// approve/hide.
adminCmsRouter.get(
  "/reviews",
  ...adminOnly,
  asyncHandler(async (_req, res) => {
    const reviews = await prisma.review.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" } });
    res.json({ reviews });
  }),
);

const reviewBody = z.object({
  authorName: z.string().min(1),
  stars: z.number().int().min(1).max(5),
  quoteLo: z.string().optional(),
  quoteZh: z.string().optional(),
  quoteEn: z.string().optional(),
  status: z.enum(["pending", "approved", "hidden"]).optional(),
});

adminCmsRouter.post(
  "/reviews",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const body = reviewBody.parse(req.body);
    const review = await prisma.review.create({ data: { ...body, status: body.status ?? "approved", updatedById: req.staff!.id } });
    res.status(201).json({ review });
  }),
);

adminCmsRouter.put(
  "/reviews/:id",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const body = reviewBody.partial().parse(req.body);
    const existing = await prisma.review.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) throw new AppError(404, "ไม่พบรีวิวนี้", "review_not_found");
    const review = await prisma.review.update({ where: { id: req.params.id }, data: { ...body, updatedById: req.staff!.id } });
    res.json({ review });
  }),
);

adminCmsRouter.delete(
  "/reviews/:id",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const existing = await prisma.review.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) throw new AppError(404, "ไม่พบรีวิวนี้", "review_not_found");
    await prisma.review.update({ where: { id: req.params.id }, data: { deletedAt: new Date(), updatedById: req.staff!.id } });
    res.json({ ok: true });
  }),
);

adminCmsRouter.patch(
  "/reviews/:id/approve",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const review = await prisma.review.update({ where: { id: req.params.id }, data: { status: "approved", updatedById: req.staff!.id } });
    res.json({ review });
  }),
);

adminCmsRouter.patch(
  "/reviews/:id/hide",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const review = await prisma.review.update({ where: { id: req.params.id }, data: { status: "hidden", updatedById: req.staff!.id } });
    res.json({ review });
  }),
);

// ------------------------------------------------------------------ team
adminCmsRouter.get(
  "/team",
  ...adminOnly,
  asyncHandler(async (_req, res) => {
    const members = await prisma.teamMember.findMany({ where: { deletedAt: null }, orderBy: { sortOrder: "asc" } });
    res.json({ members });
  }),
);

const teamBody = z.object({
  nameLo: z.string().min(1),
  nameZh: z.string().min(1),
  nameEn: z.string().min(1),
  roleLo: z.string().min(1),
  roleZh: z.string().min(1),
  roleEn: z.string().min(1),
  photoUrl: z.string().url().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

adminCmsRouter.post(
  "/team",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const body = teamBody.parse(req.body);
    const member = await prisma.teamMember.create({ data: { ...body, updatedById: req.staff!.id } });
    res.status(201).json({ member });
  }),
);

adminCmsRouter.put(
  "/team/:id",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const body = teamBody.partial().parse(req.body);
    const existing = await prisma.teamMember.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) throw new AppError(404, "ไม่พบทีมงานนี้", "team_member_not_found");
    const member = await prisma.teamMember.update({ where: { id: req.params.id }, data: { ...body, updatedById: req.staff!.id } });
    res.json({ member });
  }),
);

adminCmsRouter.delete(
  "/team/:id",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const existing = await prisma.teamMember.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) throw new AppError(404, "ไม่พบทีมงานนี้", "team_member_not_found");
    await prisma.teamMember.update({ where: { id: req.params.id }, data: { deletedAt: new Date(), updatedById: req.staff!.id } });
    res.json({ ok: true });
  }),
);
