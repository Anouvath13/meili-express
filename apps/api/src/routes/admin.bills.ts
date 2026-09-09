import { Router } from "express";
import { z } from "zod";
import { SHIPMENT_STATUS, type ShipmentStatus } from "@meili/shared";
import { AppError } from "../lib/errors.js";
import { asyncHandler } from "../lib/http.js";
import { blockIfTempPassword, requireStaffAuth } from "../middleware/auth.js";
import { awardPointsOnDelivery } from "../lib/points.js";
import { prisma } from "../lib/prisma.js";
import { notifyUser } from "../lib/notify.js";

export const adminBillsRouter = Router();

// "dash" and "bills" are both in STAFF_PAGES — staff process shipments day
// to day, so no requireRole('admin') gate here.
const staffOrAdmin = [requireStaffAuth, blockIfTempPassword];

const STATUS_NOTIF_KEY: Record<ShipmentStatus, string> = {
  received_from_china: "notif_picked_up",
  in_transit: "notif_in_transit_origin",
  arrived_lao_warehouse: "notif_arrived_lao_warehouse",
  arrived_branch: "notif_arrived_branch",
  priced_awaiting_payment: "notif_priced_awaiting_payment",
  paid_awaiting_pickup: "notif_paid_awaiting_pickup",
  delivered: "notif_delivered",
};

function billSummary(s: {
  id: string;
  billNumber: string;
  userId: string;
  productType: string | null;
  weightKg: unknown;
  price: unknown;
  status: string;
  receivedDate: Date | null;
  estimatedDelivery: Date | null;
  actualDelivery: Date | null;
  assignedStaffId: string | null;
  user?: { fullName: string | null; phone: string };
  assignedStaff?: { fullName: string } | null;
}) {
  return {
    id: s.id,
    billNumber: s.billNumber,
    customerName: s.user?.fullName ?? null,
    customerPhone: s.user?.phone ?? null,
    productType: s.productType,
    weightKg: s.weightKg,
    price: s.price,
    status: s.status,
    receivedDate: s.receivedDate,
    estimatedDelivery: s.estimatedDelivery,
    actualDelivery: s.actualDelivery,
    assignedStaffName: s.assignedStaff?.fullName ?? null,
  };
}

// ---------------------------------------------------------------- listing
adminBillsRouter.get(
  "/bills",
  ...staffOrAdmin,
  asyncHandler(async (req, res) => {
    const query = z
      .object({ limit: z.coerce.number().int().positive().max(200).optional(), status: z.enum(SHIPMENT_STATUS).optional(), q: z.string().optional() })
      .parse(req.query);

    const bills = await prisma.shipment.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.q
          ? { OR: [{ billNumber: { contains: query.q, mode: "insensitive" } }, { user: { phone: { contains: query.q } } }] }
          : {}),
      },
      include: { user: { select: { fullName: true, phone: true } }, assignedStaff: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
      take: query.limit ?? 100,
    });
    res.json({ items: bills.map(billSummary) });
  }),
);

adminBillsRouter.get(
  "/bills/:id",
  ...staffOrAdmin,
  asyncHandler(async (req, res) => {
    const bill = await prisma.shipment.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { fullName: true, phone: true } },
        assignedStaff: { select: { fullName: true } },
        trackingHistory: { orderBy: { changedAt: "asc" }, include: { changedBy: { select: { fullName: true } } } },
      },
    });
    if (!bill) throw new AppError(404, "ไม่พบบิลนี้", "invoice_not_found");
    res.json({
      ...billSummary(bill),
      origin: bill.origin,
      destination: bill.destination,
      history: bill.trackingHistory.map((h) => ({
        status: h.status,
        location: h.location,
        note: h.note,
        changedAt: h.changedAt,
        changedByName: h.changedBy?.fullName ?? null,
      })),
    });
  }),
);

// ---------------------------------------------------------------- create
// Not explicitly listed in Component Spec's Batch 3 API table, but a
// tracking system needs a way to originate a bill — added to cover that gap
// (triggers notif_pending_pickup, matching Backend Design Document §5 #1).
adminBillsRouter.post(
  "/bills",
  ...staffOrAdmin,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        billNumber: z.string().min(1),
        customerPhone: z.string().min(8),
        productType: z.string().optional(),
        weightKg: z.coerce.number().positive().optional(),
        origin: z.string().optional(),
        destination: z.string().optional(),
        receivedDate: z.coerce.date().optional(),
        estimatedDelivery: z.coerce.date().optional(),
      })
      .parse(req.body);

    const user = await prisma.user.findUnique({ where: { phone: body.customerPhone.replace(/\D/g, "") } });
    if (!user) throw new AppError(404, "ไม่พบลูกค้าที่ใช้เบอร์นี้", "customer_not_found");

    const existing = await prisma.shipment.findUnique({ where: { billNumber: body.billNumber } });
    if (existing) throw new AppError(409, "เลขบิลนี้มีอยู่แล้ว", "bill_number_taken");

    const bill = await prisma.shipment.create({
      data: {
        billNumber: body.billNumber.toUpperCase(),
        userId: user.id,
        productType: body.productType,
        weightKg: body.weightKg?.toString(),
        origin: body.origin,
        destination: body.destination,
        receivedDate: body.receivedDate,
        estimatedDelivery: body.estimatedDelivery,
        assignedStaffId: req.staff!.id,
        status: "received_from_china",
        trackingHistory: { create: { status: "received_from_china", changedById: req.staff!.id } },
      },
    });
    await notifyUser(user.id, "notif_pending_pickup", { billNumber: bill.billNumber });
    res.status(201).json({ id: bill.id, billNumber: bill.billNumber });
  }),
);

// ------------------------------------------------------------------ edit
adminBillsRouter.put(
  "/bills/:id",
  ...staffOrAdmin,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        productType: z.string().optional(),
        weightKg: z.coerce.number().positive().optional(),
        price: z.coerce.number().positive().optional(),
        origin: z.string().optional(),
        destination: z.string().optional(),
        estimatedDelivery: z.coerce.date().optional(),
        assignedStaffId: z.string().optional(),
      })
      .parse(req.body);

    const existing = await prisma.shipment.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError(404, "ไม่พบบิลนี้", "invoice_not_found");

    const bill = await prisma.shipment.update({
      where: { id: req.params.id },
      data: {
        ...body,
        weightKg: body.weightKg?.toString(),
        price: body.price?.toString(),
      },
    });
    res.json({ id: bill.id, billNumber: bill.billNumber });
  }),
);

// -------------------------------------------------------------- status
// The one place calculatePoints/checkRefereeUnlock get triggered — only on
// the transition INTO `delivered`, and only once (calculatePoints is itself
// idempotent as a second guard).
adminBillsRouter.patch(
  "/bills/:id/status",
  ...staffOrAdmin,
  asyncHandler(async (req, res) => {
    const body = z.object({ status: z.enum(SHIPMENT_STATUS), location: z.string().optional(), note: z.string().optional() }).parse(req.body);

    const bill = await prisma.shipment.findUnique({ where: { id: req.params.id } });
    if (!bill) throw new AppError(404, "ไม่พบบิลนี้", "invoice_not_found");
    if (bill.status === "delivered") throw new AppError(400, "บิลนี้ส่งมอบเรียบร้อยแล้ว ไม่สามารถแก้ไขสถานะได้อีก", "bill_already_delivered");

    await prisma.$transaction([
      prisma.shipment.update({ where: { id: bill.id }, data: { status: body.status, actualDelivery: body.status === "delivered" ? new Date() : undefined } }),
      prisma.shipmentTrackingHistory.create({
        data: { shipmentId: bill.id, status: body.status, location: body.location, note: body.note, changedById: req.staff!.id },
      }),
    ]);

    await notifyUser(bill.userId, STATUS_NOTIF_KEY[body.status], { billNumber: bill.billNumber });

    let pointsAwarded = 0;
    let refereeUnlocked = false;
    if (body.status === "delivered") {
      const result = await awardPointsOnDelivery(bill.id);
      pointsAwarded = result.pointsAwarded;
      refereeUnlocked = result.refereeUnlocked;
    }

    res.json({ ok: true, pointsAwarded, refereeUnlocked });
  }),
);

// ------------------------------------------------------------- dashboard
adminBillsRouter.get(
  "/dashboard/summary",
  ...staffOrAdmin,
  asyncHandler(async (_req, res) => {
    const [totalCustomers, totalBills, inTransit, awaitingPricing, awaitingPayment, revenueAgg, redeemedAgg, recentNews] = await Promise.all([
      prisma.user.count(),
      prisma.shipment.count(),
      prisma.shipment.count({ where: { status: { in: ["in_transit", "arrived_lao_warehouse", "arrived_branch"] } } }),
      prisma.shipment.count({ where: { status: { in: ["received_from_china", "in_transit", "arrived_lao_warehouse", "arrived_branch"] } } }),
      prisma.shipment.count({ where: { status: "priced_awaiting_payment" } }),
      prisma.shipment.aggregate({ where: { status: { in: ["paid_awaiting_pickup", "delivered"] } }, _sum: { price: true } }),
      prisma.pointsLedger.aggregate({ where: { source: "redemption" }, _sum: { delta: true } }),
      prisma.newsArticle.findFirst({ where: { deletedAt: null, isPublished: true }, orderBy: { publishedAt: "desc" }, select: { titleLo: true, publishedAt: true } }),
    ]);

    res.json({
      totalCustomers,
      totalBills,
      inTransit,
      awaitingPricing,
      awaitingPayment,
      totalRevenue: revenueAgg._sum.price ?? 0,
      totalPointsRedeemed: Math.abs(redeemedAgg._sum.delta ?? 0),
      latestNews: recentNews,
    });
  }),
);
