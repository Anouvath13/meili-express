import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { GradientButton } from '../primitives/GradientButton'
import { LogoMark } from '../primitives/Logo'
import { LangSwitcher } from './LangSwitcher'

const NAV_ITEMS: { to: string; key: string }[] = [
  { to: '/', key: 'nav.home' },
  { to: '/about', key: 'nav.about' },
  { to: '/services', key: 'nav.services' },
  { to: '/tracking', key: 'nav.tracking' },
  { to: '/news', key: 'nav.news' },
  { to: '/faq', key: 'nav.faq' },
  { to: '/contact', key: 'nav.contact' },
]

function isActive(pathname: string, to: string) {
  if (to === '/') return pathname === '/'
  if (to === '/news') return pathname.startsWith('/news')
  return pathname === to
}

export function Navbar() {
  const { t } = useTranslation()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="sticky top-0 z-20 border-b border-ink-50 bg-white/95 backdrop-blur-md">
      {/* Desktop */}
      <div className="mx-auto hidden max-w-[1280px] items-center gap-6 px-10 py-5 lg:flex">
        <Link to="/" className="flex shrink-0 items-center gap-[7px]">
          <LogoMark size={30} />
          <span className="text-base font-bold tracking-[0.04em] text-brand-700 whitespace-nowrap">MEILI EXPRESS</span>
        </Link>
        <nav className="flex flex-wrap gap-[18px] text-[13.5px] font-medium">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={`whitespace-nowrap border-b-2 py-1.5 ${
                isActive(location.pathname, item.to)
                  ? 'border-brand-500 font-semibold text-ink-900'
                  : 'border-transparent text-ink-500 hover:text-ink-900'
              }`}
            >
              {t(item.key)}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-3">
          <LangSwitcher />
          <GradientButton to="/contact" className="px-6 py-3.5 text-sm">
            {t('cta.primary')}
          </GradientButton>
        </div>
      </div>

      {/* Mobile / tablet */}
      <div className="lg:hidden">
        <div className="flex items-center gap-3 px-5 py-4">
          <Link to="/" className="flex shrink-0 items-center gap-[7px]">
            <LogoMark size={26} />
            <span className="text-sm font-bold tracking-[0.04em] text-brand-700 whitespace-nowrap">MEILI EXPRESS</span>
          </Link>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <LangSwitcher compact />
            <button
              type="button"
              aria-label="Menu"
              onClick={() => setDrawerOpen((v) => !v)}
              className="flex h-11 w-11 flex-col items-center justify-center gap-1 rounded-full bg-gradient-brand shadow-brand-btn"
            >
              <span className="h-0.5 w-[17px] rounded-full bg-white" />
              <span className="h-0.5 w-[17px] rounded-full bg-white" />
              <span className="h-0.5 w-[17px] rounded-full bg-white" />
            </button>
          </div>
        </div>
        {drawerOpen && (
          <div className="flex flex-col gap-0.5 border-t border-ink-50 px-5 pb-6 pt-2.5">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setDrawerOpen(false)}
                className={`border-b border-ink-50 py-4 text-base ${
                  isActive(location.pathname, item.to) ? 'font-bold text-brand-700' : 'font-medium text-ink-700'
                }`}
              >
                {t(item.key)}
              </NavLink>
            ))}
            <GradientButton to="/contact" className="mt-4 w-full py-4 text-[15.5px]">
              {t('cta.primary')}
            </GradientButton>
          </div>
        )}
      </div>
    </div>
  )
}
