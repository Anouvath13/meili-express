import { Router } from "express";
import { z } from "zod";
import { normalizePhone } from "@meili/shared";
import type { ShipmentStatus } from "../generated/prisma/enums.js";
import { getConfigNumber } from "../lib/config.js";
import { AppError } from "../lib/errors.js";
import { asyncHandler } from "../lib/http.js";
import { requireCustomerAuth } from "../middleware/auth.js";
import { verifyOtp } from "../lib/otp.js";
import { pointsBalance, redeemPointsForShipment } from "../lib/points.js";
import { prisma } from "../lib/prisma.js";

export const customerRouter = Router();
customerRouter.use(requireCustomerAuth);

function shipmentSummary(s: {
  id: string;
  billNumber: string;
  productType: string | null;
  weightKg: unknown;
  price: unknown;
  status: string;
  receivedDate: Date | null;
  estimatedDelivery: Date | null;
  actualDelivery: Date | null;
}) {
  return {
    id: s.id,
    billNumber: s.billNumber,
    productType: s.productType,
    weightKg: s.weightKg,
    price: s.price,
    status: s.status,
    receivedDate: s.receivedDate,
    estimatedDelivery: s.estimatedDelivery,
    actualDelivery: s.actualDelivery,
  };
}

// ================================================================ points
customerRouter.get(
  "/points/balance",
  asyncHandler(async (req, res) => {
    res.json(await pointsBalance(req.userId!));
  }),
);

customerRouter.get(
  "/points/history",
  asyncHandler(async (req, res) => {
    const query = z.object({ limit: z.coerce.number().int().positive().max(100).optional() }).parse(req.query);
    const entries = await prisma.pointsLedger.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: "desc" },
      take: query.limit ?? 50,
      include: { shipment: { select: { billNumber: true } } },
    });
    res.json({
      items: entries.map((e) => ({
        id: e.id,
        date: e.createdAt,
        delta: e.delta,
        source: e.source,
        status: e.status,
        note: e.note,
        billNumber: e.shipment?.billNumber ?? null,
      })),
    });
  }),
);

// ============================================================== referral
customerRouter.get(
  "/referral/code",
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
    res.json({ accountId: user.accountId, referralUrl: `/ref/${user.accountId}` });
  }),
);

customerRouter.get(
  "/referral/friends",
  asyncHandler(async (req, res) => {
    const referrals = await prisma.referral.findMany({
      where: { referrerId: req.userId! },
      orderBy: { linkedAt: "desc" },
      include: {
        referee: { select: { fullName: true, phone: true } },
        pointsLedgerEntries: { where: { source: "referral" } },
      },
    });
    res.json({
      items: referrals.map((r) => ({
        id: r.id,
        name: r.referee.fullName,
        phone: r.referee.phone,
        linkedAt: r.linkedAt,
        status: r.status,
        cumulativeKg: r.cumulativeKg,
        pointsEarned: r.pointsLedgerEntries.filter((p) => p.userId === req.userId).reduce((sum, p) => sum + p.delta, 0),
      })),
    });
  }),
);

// ============================================================== invoices
// "Invoice" in the Component Spec is the shipment/bill itself — there's no
// separate invoice entity in the schema (§ Backend Design Document §1).
customerRouter.get(
  "/invoices",
  asyncHandler(async (req, res) => {
    const query = z
      .object({ limit: z.coerce.number().int().positive().max(100).optional(), filter: z.enum(["all", "unpaid", "paid"]).optional() })
      .parse(req.query);

    const statusFilter =
      query.filter === "unpaid"
        ? { in: ["priced_awaiting_payment"] satisfies ShipmentStatus[] }
        : query.filter === "paid"
          ? { in: ["paid_awaiting_pickup", "delivered"] satisfies ShipmentStatus[] }
          : undefined;

    const shipments = await prisma.shipment.findMany({
      where: { userId: req.userId!, ...(statusFilter ? { status: statusFilter } : {}) },
      orderBy: { createdAt: "desc" },
      take: query.limit ?? 50,
    });
    res.json({ items: shipments.map(shipmentSummary) });
  }),
);

customerRouter.get(
  "/invoices/:id",
  asyncHandler(async (req, res) => {
    const shipment = await prisma.shipment.findUnique({ where: { id: req.params.id } });
    if (!shipment || shipment.userId !== req.userId) throw new AppError(404, "ไม่พบบิลนี้", "invoice_not_found");

    const redemption = await prisma.pointsLedger.findFirst({ where: { shipmentId: shipment.id, source: "redemption" } });
    const [discountCapPct, pointValue, balance] = await Promise.all([
      getConfigNumber("discount_cap_pct"),
      getConfigNumber("point_value"),
      pointsBalance(req.userId!),
    ]);
    const maxByCap = shipment.price !== null ? Math.floor((Number(shipment.price) * discountCapPct) / pointValue) : 0;

    res.json({
      ...shipmentSummary(shipment),
      origin: shipment.origin,
      destination: shipment.destination,
      pointsRedeemed: redemption ? -redemption.delta : 0,
      redeemable: !redemption && shipment.status === "priced_awaiting_payment",
      pointValue,
      maxRedeemablePoints: Math.min(maxByCap, balance.unlocked),
      availablePoints: balance.unlocked,
    });
  }),
);

customerRouter.post(
  "/invoices/:id/redeem-points",
  asyncHandler(async (req, res) => {
    const body = z.object({ points: z.coerce.number().int().positive() }).parse(req.body);
    const result = await redeemPointsForShipment(req.userId!, req.params.id, body.points);
    res.json(result);
  }),
);

// =============================================================== parcels
// Same underlying data as /invoices, framed for the tracking-focused UI
// (ParcelPicker / ActiveParcelCard / TrackingCard in Component Spec Batch 2).
customerRouter.get(
  "/parcels",
  asyncHandler(async (req, res) => {
    const shipments = await prisma.shipment.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: "desc" },
      select: { id: true, billNumber: true, status: true },
    });
    res.json({ items: shipments });
  }),
);

customerRouter.get(
  "/parcels/active",
  asyncHandler(async (req, res) => {
    const shipment = await prisma.shipment.findFirst({
      where: { userId: req.userId!, status: { not: "delivered" } },
      orderBy: { createdAt: "desc" },
    });
    res.json(shipment ? shipmentSummary(shipment) : null);
  }),
);

customerRouter.get(
  "/parcels/:billNumber/status",
  asyncHandler(async (req, res) => {
    const shipment = await prisma.shipment.findUnique({
      where: { billNumber: req.params.billNumber.trim().toUpperCase() },
      include: { trackingHistory: { orderBy: { changedAt: "asc" } } },
    });
    if (!shipment || shipment.userId !== req.userId) throw new AppError(404, "ไม่พบพัสดุนี้", "parcel_not_found");

    res.json({
      ...shipmentSummary(shipment),
      history: shipment.trackingHistory.map((h) => ({ status: h.status, location: h.location, note: h.note, changedAt: h.changedAt })),
    });
  }),
);

// =============================================================== profile
customerRouter.get(
  "/profile",
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
    res.json({ id: user.id, accountId: user.accountId, phone: user.phone, fullName: user.fullName, email: user.email });
  }),
);

customerRouter.patch(
  "/profile",
  asyncHandler(async (req, res) => {
    const body = z.object({ fullName: z.string().min(1).optional(), email: z.string().email().nullable().optional() }).parse(req.body);
    const user = await prisma.user.update({ where: { id: req.userId! }, data: body });
    res.json({ id: user.id, accountId: user.accountId, phone: user.phone, fullName: user.fullName, email: user.email });
  }),
);

customerRouter.post(
  "/profile/change-phone",
  asyncHandler(async (req, res) => {
    const body = z.object({ newPhone: z.string().min(8).transform(normalizePhone), otp: z.string().length(6) }).parse(req.body);

    const existing = await prisma.user.findUnique({ where: { phone: body.newPhone } });
    if (existing) throw new AppError(409, "เบอร์นี้มีบัญชีอยู่แล้ว", "phone_taken");

    await verifyOtp(body.newPhone, body.otp, "change_phone", { consume: true });

    const user = await prisma.user.update({ where: { id: req.userId! }, data: { phone: body.newPhone } });
    res.json({ id: user.id, phone: user.phone });
  }),
);
