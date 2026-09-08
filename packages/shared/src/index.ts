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
