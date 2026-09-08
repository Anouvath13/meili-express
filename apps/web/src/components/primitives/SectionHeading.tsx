import type { ReactNode } from 'react'

export function SectionKicker({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-[11px] tracking-[0.16em] text-brand-800">{children}</div>
  )
}

export function SectionHeading({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`mt-2 max-w-[720px] text-[23px] font-bold tracking-tight text-ink-900 text-pretty leading-[1.35] sm:text-[30px] lg:text-[36px] ${className}`}>
      {children}
    </h2>
  )
}
