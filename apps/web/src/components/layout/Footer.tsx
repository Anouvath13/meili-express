import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Container } from '../primitives/Container'

const NAV_ITEMS: { to: string; key: string }[] = [
  { to: '/', key: 'nav.home' },
  { to: '/about', key: 'nav.about' },
  { to: '/services', key: 'nav.services' },
  { to: '/tracking', key: 'nav.tracking' },
  { to: '/news', key: 'nav.news' },
  { to: '/faq', key: 'nav.faq' },
  { to: '/contact', key: 'nav.contact' },
]

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="bg-ink-900 py-14 px-5 sm:px-8 lg:px-10">
      <Container className="px-0!">
        <div className="flex flex-wrap items-start gap-10">
          <div className="min-w-[240px] flex-1">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
                <svg viewBox="0 0 24 24" width={19} height={19} aria-hidden="true">
                  <circle cx="12" cy="12" r="11" fill="none" stroke="#FF6A14" strokeWidth="2" />
                  <path d="M7 16V8l5 5 5-5v8" fill="none" stroke="#FF6A14" strokeWidth="2" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-[15px] font-bold tracking-[0.06em] text-white">MEILI EXPRESS</div>
            </div>
            <p className="mt-5 max-w-[320px] text-sm leading-[1.8] text-ink-300">{t('footer.tagline')}</p>
          </div>
          <div className="flex flex-wrap gap-[18px]">
            {NAV_ITEMS.map((item) => (
              <Link key={item.to} to={item.to} className="text-sm text-ink-300 hover:text-white">
                {t(item.key)}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-11 flex flex-wrap items-center gap-5 border-t border-white/10 pt-6">
          <div className="text-[12.5px] text-ink-500">{t('footer.copyright')}</div>
          <div className="ml-auto flex gap-[5px] -skew-x-[16deg]">
            <div className="h-5 w-[6px] bg-[#2c2e34]" />
            <div className="h-5 w-[6px] bg-brand-500" />
            <div className="h-5 w-[6px] bg-[#FF9A5C]" />
          </div>
        </div>
      </Container>
    </footer>
  )
}
