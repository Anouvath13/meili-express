export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="block" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#FF6A14" />
      <path d="M7 16V8l5 5 5-5v8" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

export function LogoOutline({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="block" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="none" stroke="#FF6A14" strokeWidth="2" />
      <path d="M7 16V8l5 5 5-5v8" fill="none" stroke="#FF6A14" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}
