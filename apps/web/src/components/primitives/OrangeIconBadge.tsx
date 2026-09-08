// The skewed-bars mark used as a generic "feature/service" icon throughout
// the mockup — a lightweight stand-in for real per-feature icons.
export function OrangeIconBadge({ size = 52 }: { size?: number }) {
  const barHeight = Math.round(size * 0.37)
  return (
    <div
      className="flex items-center justify-center rounded-full bg-brand-100 shrink-0"
      style={{ width: size, height: size }}
    >
      <div className="flex gap-[3px] -skew-x-[16deg]">
        <div className="w-[5px] rounded-[1px] bg-brand-500" style={{ height: barHeight }} />
        <div className="w-[5px] rounded-[1px] bg-brand-300" style={{ height: barHeight }} />
      </div>
    </div>
  )
}
