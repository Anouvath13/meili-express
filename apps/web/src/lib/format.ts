export function formatKip(amount: number | string): string {
  const n = typeof amount === 'string' ? Number(amount) : amount
  return `${n.toLocaleString('en-US')} ₭`
}
