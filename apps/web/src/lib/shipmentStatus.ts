import { SHIPMENT_STATUS, type ShipmentStatus } from '@meili/shared'

// Matches the `filter=paid` semantics in apps/api/src/routes/customer.ts —
// a bill counts as paid once payment has been recorded, delivered included.
export function isPaid(status: ShipmentStatus): boolean {
  return status === 'paid_awaiting_pickup' || status === 'delivered'
}

export function statusIndex(status: ShipmentStatus): number {
  return SHIPMENT_STATUS.indexOf(status)
}
