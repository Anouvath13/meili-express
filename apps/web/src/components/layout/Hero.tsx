import type { ReactNode } from 'react'
import { Container } from '../primitives/Container'

export function Hero({
  kicker,
  title,
  subtitle,
  compact = false,
  children,
}: {
  kicker: string
  title: string
  subtitle?: string
  compact?: boolean
  children?: ReactNode
}) {
  return (
    <div className={`relative overflow-hidden bg-gradient-hero ${compact ? 'py-9 sm:py-11' : 'py-11 sm:py-16 lg:py-[92px]'}`}>
      <div className="pointer-events-none absolute -top-[140px] -right-[90px] h-[420px] w-[420px] rounded-full bg-white/16 blur-[46px]" />
      <div className="pointer-events-none absolute -bottom-[170px] right-[130px] h-[320px] w-[320px] rounded-full bg-white/10 blur-[52px]" />
      <Container className="relative">
        <div className="inline-flex items-center gap-[9px] rounded-full border border-white/32 bg-white/18 px-[18px] py-[9px] text-[13px] font-medium text-white backdrop-blur-sm">
          <span className="h-[7px] w-[7px] rounded-full bg-white" />
          {kicker}
        </div>
        <h1
          className={`mt-4 max-w-[780px] font-bold tracking-tight text-pretty text-white ${
            compact ? 'text-2xl sm:text-3xl lg:text-[38px]' : 'text-[27px] leading-[1.3] sm:text-4xl lg:text-[50px]'
          }`}
        >
          {title}
        </h1>
        {subtitle && <p className="mt-[22px] max-w-[560px] text-[15.5px] leading-[1.85] text-white/90 text-pretty sm:text-lg">{subtitle}</p>}
        {children}
      </Container>
    </div>
  )
}
