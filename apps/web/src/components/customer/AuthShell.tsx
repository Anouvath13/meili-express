import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { LogoMark } from '../primitives/Logo'
import { LangSwitcher } from '../layout/LangSwitcher'

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const { t } = useTranslation()

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-hero">
      <div className="pointer-events-none absolute -top-40 -right-24 h-[460px] w-[460px] rounded-full bg-white/16 blur-[50px]" />
      <div className="pointer-events-none absolute -bottom-44 -left-16 h-[340px] w-[340px] rounded-full bg-white/10 blur-[56px]" />

      <div className="relative flex items-center justify-between px-5 py-5 sm:px-10">
        <Link to="/" className="flex items-center gap-[7px]">
          <LogoMark size={28} />
          <span className="text-[15px] font-bold tracking-[0.04em] text-white">MEILI EXPRESS</span>
        </Link>
        <LangSwitcher />
      </div>

      <div className="relative mx-auto flex max-w-[1280px] flex-col items-stretch gap-8 px-5 pb-16 sm:px-10 lg:flex-row lg:items-start lg:gap-14">
        <div className="min-w-0 flex-1 pt-4 lg:pt-10">
          <div className="inline-flex items-center gap-[9px] rounded-full border border-white/32 bg-white/18 px-[18px] py-[9px] text-[13px] font-medium text-white">
            <span className="h-[7px] w-[7px] rounded-full bg-white" />
            {t('app.zoneBadge')}
          </div>
          <h1 className="mt-[22px] max-w-[600px] text-[27px] font-bold leading-[1.3] tracking-tight text-pretty text-white sm:text-4xl lg:text-[42px]">{title}</h1>
          <p className="mt-5 max-w-[460px] text-[15.5px] leading-[1.85] text-white/90 text-pretty">{subtitle}</p>
        </div>

        <div className="w-full shrink-0 rounded-[22px] bg-white p-6 shadow-[0_30px_60px_-24px_rgba(120,40,0,0.45)] sm:p-8 lg:w-[420px]">
          {children}
        </div>
      </div>
    </div>
  )
}
