export function formatKip(amount: number | string): string {
  const n = typeof amount === 'string' ? Number(amount) : amount
  return `${n.toLocaleString('en-US')} ₭`
}

// Shipping rates (unlike bills/points, which are always LAK) can be priced
// in either LAK or CNY — formatKip alone would mislabel a yuan rate as kip.
export function formatMoney(amount: number | string, currency: string): string {
  const n = typeof amount === 'string' ? Number(amount) : amount
  const symbol = currency === 'LAK' ? '₭' : currency === 'CNY' ? '¥' : currency
  return `${n.toLocaleString('en-US')} ${symbol}`
}
