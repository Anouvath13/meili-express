import { useTranslation } from 'react-i18next'
import { Container } from '../../components/primitives/Container'
import { LogoMark } from '../../components/primitives/Logo'
import { OrangeIconBadge } from '../../components/primitives/OrangeIconBadge'
import { Hero } from '../../components/layout/Hero'

export default function AboutPage() {
  const { t } = useTranslation()
  const mission = t('about.mission', { returnObjects: true }) as string[]

  return (
    <div>
      <Hero kicker={t('about.kicker')} title={t('about.title')} subtitle={t('about.p1')} compact />

      <Container className="py-14 sm:py-[88px]">
        <div className="flex flex-wrap gap-[22px]">
          <div className="min-w-[240px] flex-1 rounded-[20px] bg-white p-8 shadow-card">
            <LogoMark size={22} />
            <p className="mt-6 text-[16.5px] leading-[1.9] text-ink-700 text-pretty">{t('about.intro')}</p>
          </div>
          <div className="min-w-[240px] flex-1 rounded-[20px] bg-white p-8 shadow-card">
            <OrangeIconBadge />
            <p className="mt-6 text-[16.5px] leading-[1.9] text-ink-700 text-pretty">{t('about.p2')}</p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-[22px]">
          <div className="min-w-[240px] flex-1 rounded-[20px] bg-white p-8 shadow-card">
            <div className="text-lg font-bold text-ink-900">{t('about.visionTitle')}</div>
            <p className="mt-3 text-[15px] leading-[1.8] text-ink-500">{t('about.vision')}</p>
          </div>
          <div className="min-w-[240px] flex-1 rounded-[20px] bg-white p-8 shadow-card">
            <div className="text-lg font-bold text-ink-900">{t('about.missionTitle')}</div>
            <ul className="mt-3 flex flex-col gap-2">
              {mission.map((m) => (
                <li key={m} className="flex items-start gap-2.5 text-[15px] leading-[1.8] text-ink-500">
                  <span className="mt-[9px] h-[5px] w-[5px] shrink-0 rounded-full bg-brand-500" />
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center rounded-[20px] bg-gradient-news py-16 font-mono text-[11px] tracking-[0.14em] text-[#C79A7A]">
          TEAM / FLEET PHOTO PLACEHOLDER
        </div>
      </Container>
    </div>
  )
}
