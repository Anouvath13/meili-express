import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Container } from '../../components/primitives/Container'
import { OrangeIconBadge } from '../../components/primitives/OrangeIconBadge'
import { SectionHeading } from '../../components/primitives/SectionHeading'
import { Hero } from '../../components/layout/Hero'
import { pickLang } from '../../lib/localize'
import { publicApi } from '../../lib/publicApi'

const UNIT_LABEL: Record<string, string> = { per_kg: '/kg', per_ton: '/ton', per_cbm: '/m³' }

export default function ServicesPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const rates = useQuery({ queryKey: ['rates'], queryFn: publicApi.rates })

  return (
    <div>
      <Hero kicker={t('services.kicker')} title={t('services.title')} subtitle={t('services.desc')} compact />

      <Container className="py-14 sm:py-[88px]">
        <div className="flex flex-wrap gap-[22px]">
          {(rates.data?.rates ?? []).map((r) => (
            <div key={r.id} className="min-w-[240px] flex-1 rounded-[20px] bg-white p-8 shadow-card">
              <OrangeIconBadge />
              <div className="mt-[22px] text-lg font-semibold leading-[1.5] text-ink-900">
                {pickLang(lang, { lo: r.nameLo, zh: r.nameZh, en: r.nameEn })}
              </div>
              <div className="mt-2.5 text-sm text-ink-500">{UNIT_LABEL[r.unit] ?? r.unit}</div>
              <div className="mt-5 inline-block rounded-full bg-brand-50 px-4.5 py-2.5 text-[15px] font-bold text-brand-700">
                {Number(r.price).toLocaleString()} {r.currency === 'LAK' ? '₭' : '¥'}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 flex flex-wrap items-end gap-6">
          <SectionHeading>{t('rates.title')}</SectionHeading>
          <div className="ml-auto max-w-[340px] text-[13.5px] leading-[1.7] text-ink-400">{t('rates.note')}</div>
        </div>
        <div className="mt-7 overflow-hidden rounded-[20px] bg-white shadow-card">
          <div className="hidden bg-[#FFF7F2] px-[30px] py-5 font-mono text-[10.5px] tracking-[0.14em] text-brand-900 sm:flex">
            <div className="flex-[2.2]">{t('rates.colService')}</div>
            <div className="flex-[1.6]">{t('rates.colUnit')}</div>
            <div className="flex-[1.1]">{t('rates.colPrice')}</div>
          </div>
          {(rates.data?.rates ?? []).map((r) => (
            <div key={r.id} className="flex flex-col gap-1.5 border-t border-[#f6f6f7] px-5 py-4.5 sm:flex-row sm:items-baseline sm:gap-0 sm:px-[30px] sm:py-[22px]">
              <div className="font-semibold text-ink-900 sm:flex-[2.2]">{pickLang(lang, { lo: r.nameLo, zh: r.nameZh, en: r.nameEn })}</div>
              <div className="text-ink-500 sm:flex-[1.6]">{UNIT_LABEL[r.unit] ?? r.unit}</div>
              <div className="font-bold text-brand-700 sm:flex-[1.1]">
                {Number(r.price).toLocaleString()} {r.currency === 'LAK' ? '₭' : '¥'}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  )
}
