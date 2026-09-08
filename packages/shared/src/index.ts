// Types and constants shared between apps/web and apps/api.
// Grows as each build phase adds real request/response contracts.

export const SUPPORTED_LANGUAGES = ["lo", "zh", "en"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

// Confirmed 7-step flow (Component Spec + Backend Design Document QA note) —
// supersedes the older enum still shown in Content Brief section 5.
export const SHIPMENT_STATUS = [
  "received_from_china",
  "in_transit",
  "arrived_lao_warehouse",
  "arrived_branch",
  "priced_awaiting_payment",
  "paid_awaiting_pickup",
  "delivered",
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUS)[number];

// Strips everything but digits so "020 5469 9236" and "02054699236" look up
// the same row — used by seed, register, and login alike so the stored
// phone and the lookup phone never silently diverge.
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}
