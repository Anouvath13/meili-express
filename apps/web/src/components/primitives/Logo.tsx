// Brand mark: 3 forward-leaning bars (dark, orange, orange) — see
// logo-lockup-1600x560.png / logo-icon-800x800.png in the project root.
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg viewBox="0 0 46 40" width={size} height={(size * 40) / 46} className="block" aria-hidden="true">
      <polygon points="2,40 10,40 20,0 12,0" fill="#101114" />
      <polygon points="14,40 22,40 32,0 24,0" fill="#FF6A14" />
      <polygon points="26,40 34,40 44,0 36,0" fill="#FF6A14" />
    </svg>
  )
}

