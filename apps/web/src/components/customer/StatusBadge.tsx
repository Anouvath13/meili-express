export function StatusBadge({ label, positive }: { label: string; positive: boolean }) {
  return (
    <span
      className="inline-flex whitespace-nowrap rounded-full px-3.5 py-[7px] text-[12.5px] font-bold"
      style={{ background: positive ? '#ECFDF3' : '#FFF3EB', color: positive ? '#027A48' : '#C2470A' }}
    >
      {label}
    </span>
  )
}
