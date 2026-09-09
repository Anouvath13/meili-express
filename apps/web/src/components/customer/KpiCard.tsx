export function KpiCard({ kicker, value, note }: { kicker: string; value: string; note: string }) {
  return (
    <div className="rounded-[22px] bg-white p-6 shadow-card sm:p-[30px]">
      <div className="font-mono text-[10.5px] tracking-[0.14em] text-brand-900">{kicker}</div>
      <div className="mt-2.5 text-[30px] font-bold tracking-tight text-ink-900">{value}</div>
      <div className="mt-2.5 text-sm leading-[1.7] text-ink-500">{note}</div>
    </div>
  )
}
