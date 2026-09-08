import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Container } from '../../components/primitives/Container'
import { GradientButton } from '../../components/primitives/GradientButton'
import { OrangeIconBadge } from '../../components/primitives/OrangeIconBadge'
import { SectionHeading, SectionKicker } from '../../components/primitives/SectionHeading'
import { Hero } from '../../components/layout/Hero'
import { pickLang } from '../../lib/localize'
import { publicApi } from '../../lib/publicApi'
import { NewsCard } from './news/NewsCard'

export default function HomePage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language

  const rates = useQuery({ queryKey: ['rates'], queryFn: publicApi.rates })
  const reviews = useQuery({ queryKey: ['reviews'], queryFn: publicApi.reviews })
  const news = useQuery({ queryKey: ['news', { limit: 3 }], queryFn: () => publicApi.news({ limit: 3 }) })

  const features = t('features.items', { returnObjects: true }) as { title: string; body: string }[]

  return (
    <div>
      <Hero kicker={t('hero.badge')} title={t('hero.title')} subtitle={t('hero.subtitle')}>
        <div className="mt-14 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <GradientButton to="/contact" className="px-10 py-[19px] text-base">
            {t('cta.primary')}
          </GradientButton>
          <GradientButton to="/services" variant="secondary" className="px-8 py-[18px] text-base">
            {t('cta.secondary')}
          </GradientButton>
        </div>
      </Hero>

      {/* Points banner — overlaps the hero bottom edge */}
      <Container className="-mt-9 relative">
        <div className="flex flex-col items-start gap-5 rounded-[22px] bg-white p-6 shadow-card-lg sm:flex-row sm:items-center sm:gap-[30px] sm:p-9">
          <div className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full bg-brand-100">
            <div className="flex gap-[3px] -skew-x-[16deg]">
              <div className="h-5 w-[5px] rounded-[1px] bg-brand-500" />
              <div className="h-5 w-[5px] rounded-[1px] bg-brand-300" />
            </div>
          </div>
          <div className="min-w-[240px] flex-1">
            <div className="mt-1 text-[19px] font-bold leading-[1.55] tracking-tight text-ink-900 sm:text-[21px]">{t('points.title')}</div>
            <div className="mt-2 text-[14.5px] leading-[1.75] text-ink-500">{t('points.body')}</div>
          </div>
          <GradientButton to="/tracking" className="w-full whitespace-nowrap px-7 py-4 text-[15px] sm:w-auto">
            {t('points.cta')}
          </GradientButton>
        </div>
      </Container>

      {/* Features */}
      <Container className="pt-16 sm:pt-[88px]">
        <SectionHeading>{t('features.title')}</SectionHeading>
        <div className="mt-11 flex flex-wrap gap-[22px]">
          {features.map((f) => (
            <div key={f.title} className="min-w-[240px] flex-1 rounded-[20px] bg-white p-8 shadow-card">
              <OrangeIconBadge />
              <div className="mt-6 text-lg font-semibold leading-[1.5] text-ink-900">{f.title}</div>
              <div className="mt-3 text-[14.5px] leading-[1.8] text-ink-500">{f.body}</div>
            </div>
          ))}
        </div>
      </Container>

      {/* Rates */}
      <Container className="pt-16 sm:pt-[88px]">
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <SectionKicker>{t('rates.kicker')}</SectionKicker>
            <SectionHeading>{t('rates.title')}</SectionHeading>
          </div>
          <div className="ml-auto max-w-[320px] text-[13.5px] leading-[1.7] text-ink-400">{t('rates.note')}</div>
        </div>
        <div className="mt-8 overflow-hidden rounded-[20px] bg-white shadow-card">
          <div className="hidden bg-[#FFF7F2] px-[30px] py-5 font-mono text-[10.5px] tracking-[0.14em] text-brand-900 sm:flex">
            <div className="flex-[2.2]">{t('rates.colService')}</div>
            <div className="flex-[1.6]">{t('rates.colUnit')}</div>
            <div className="flex-[1.1]">{t('rates.colPrice')}</div>
          </div>
          {rates.data?.rates.map((r) => (
            <div key={r.id} className="flex flex-col gap-1.5 border-t border-[#f6f6f7] px-5 py-4.5 sm:flex-row sm:items-baseline sm:gap-0 sm:px-[30px] sm:py-[22px]">
              <div className="font-semibold text-ink-900 sm:flex-[2.2]">{pickLang(lang, { lo: r.nameLo, zh: r.nameZh, en: r.nameEn })}</div>
              <div className="text-ink-500 sm:flex-[1.6]">{r.unit === 'per_kg' ? '/kg' : r.unit === 'per_ton' ? '/ton' : '/m³'}</div>
              <div className="font-bold tracking-tight text-brand-700 sm:flex-[1.1]">
                {Number(r.price).toLocaleString()} {r.currency === 'LAK' ? '₭' : '¥'}
              </div>
            </div>
          ))}
        </div>
      </Container>

      {/* Reviews */}
      <Container className="pt-16 sm:pt-[88px]">
        <SectionKicker>{t('reviews.kicker')}</SectionKicker>
        <SectionHeading>{t('reviews.title')}</SectionHeading>
        <div className="mt-11 flex flex-wrap gap-[22px]">
          {(reviews.data?.reviews ?? []).map((rv) => (
            <div key={rv.id} className="min-w-[240px] flex-1 rounded-[20px] bg-white p-8 shadow-card">
              <div className="text-[15.5px] italic leading-[1.9] text-ink-400">
                {pickLang(lang, { lo: rv.quoteLo ?? '', zh: rv.quoteZh ?? '', en: rv.quoteEn ?? '' })}
              </div>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                  {rv.authorName.slice(0, 1)}
                </div>
                <div className="text-sm font-semibold text-ink-900">{rv.authorName}</div>
              </div>
            </div>
          ))}
        </div>
      </Container>

      {/* News */}
      <Container className="py-16 sm:py-[88px]">
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <SectionKicker>{t('news.kicker')}</SectionKicker>
            <SectionHeading>{t('news.title')}</SectionHeading>
          </div>
          <GradientButton to="/news" variant="ghost" className="ml-auto px-[26px] py-[13px] text-[14.5px]">
            {t('news.all')}
          </GradientButton>
        </div>
        <div className="mt-[42px] flex flex-wrap gap-[22px]">
          {(news.data?.items ?? []).map((n) => (
            <NewsCard key={n.id} item={n} />
          ))}
        </div>
      </Container>
    </div>
  )
}
