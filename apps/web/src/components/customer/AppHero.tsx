import type { ReactNode } from 'react'
import { Container } from '../primitives/Container'

export function AppHero({
  title,
  subtitle,
  compact = false,
  stats,
}: {
  title: string
  subtitle: string
  compact?: boolean
  stats?: { value: string; label: string }[]
}) {
  return (
    <div className={`relative overflow-hidden bg-gradient-hero ${compact ? 'py-9 sm:py-11' : 'py-11 sm:py-14 lg:py-[76px]'}`}>
      <div className="pointer-events-none absolute -top-[130px] -right-20 h-96 w-96 rounded-full bg-white/16 blur-[46px]" />
      <Container className="relative">
        <h1 className={`max-w-[780px] font-bold tracking-tight text-pretty text-white ${compact ? 'text-2xl sm:text-3xl lg:text-[34px]' : 'text-[27px] leading-[1.3] sm:text-4xl lg:text-[46px]'}`}>
          {title}
        </h1>
        <p className="mt-5 max-w-[560px] text-[15.5px] leading-[1.85] text-white/90 text-pretty sm:text-lg">{subtitle}</p>
        {stats && stats.length > 0 && (
          <div className="mt-9 flex flex-col flex-wrap gap-[18px] sm:flex-row sm:gap-12">
            {stats.map((s) => (
              <StatBlock key={s.label} {...s} />
            ))}
          </div>
        )}
      </Container>
    </div>
  )
}

function StatBlock({ value, label }: { value: string; label: string }): ReactNode {
  return (
    <div>
      <div className="text-2xl font-bold tracking-tight text-white sm:text-[32px]">{value}</div>
      <div className="mt-2 text-[13px] text-white/85">{label}</div>
    </div>
  )
}
