import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { customerAuthApi } from '../../lib/customerApi'
import { useCustomerAuth } from '../../store/customerAuth'
import { Container } from '../primitives/Container'
import { LogoMark } from '../primitives/Logo'
import { LangSwitcher } from '../layout/LangSwitcher'

const NAV_ITEMS: { to: string; key: string }[] = [
  { to: '/app', key: 'app.nav.dashboard' },
  { to: '/app/points', key: 'app.nav.points' },
  { to: '/app/referral', key: 'app.nav.referral' },
  { to: '/app/invoices', key: 'app.nav.invoices' },
  { to: '/app/tracking', key: 'app.nav.tracking' },
  { to: '/app/profile', key: 'app.nav.profile' },
]

function isActive(pathname: string, to: string) {
  if (to === '/app') return pathname === '/app'
  if (to === '/app/invoices') return pathname.startsWith('/app/invoices')
  return pathname === to
}

export function CustomerShell() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const clear = useCustomerAuth((s) => s.clear)

  async function handleLogout() {
    try {
      await customerAuthApi.logout()
    } catch {
      // stateless token — logging out client-side still succeeds even if the network call fails
    }
    clear()
    navigate('/app/login')
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="sticky top-0 z-20 border-b border-ink-50 bg-white/95 backdrop-blur-md">
        {/* Desktop */}
        <div className="mx-auto hidden max-w-[1280px] items-center gap-6 px-10 py-5 lg:flex">
          <Link to="/app" className="flex shrink-0 items-center gap-[7px]">
            <LogoMark size={30} />
            <span className="text-base font-bold tracking-[0.04em] text-brand-700 whitespace-nowrap">MEILI EXPRESS</span>
          </Link>
          <nav className="flex flex-wrap gap-4 text-[13.5px] font-medium">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={`whitespace-nowrap border-b-2 py-1.5 ${
                  isActive(location.pathname, item.to) ? 'border-brand-500 font-semibold text-ink-900' : 'border-transparent text-ink-500 hover:text-ink-900'
                }`}
              >
                {t(item.key)}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-3">
            <LangSwitcher />
            <Link to="/app/profile" className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-white">
              M
            </Link>
          </div>
        </div>

        {/* Mobile / tablet */}
        <div className="lg:hidden">
          <div className="flex items-center gap-3 px-5 py-4">
            <Link to="/app" className="flex shrink-0 items-center gap-[7px]">
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
              <button
                type="button"
                onClick={handleLogout}
                className="mt-4 rounded-full border border-ink-100 py-4 text-[15px] font-semibold text-ink-500"
              >
                {t('app.profile.logout')}
              </button>
            </div>
          )}
        </div>
      </div>

      <Outlet />

      <footer className="bg-ink-900 py-14 px-5 sm:px-8 lg:px-10">
        <Container className="px-0!">
          <div className="flex flex-wrap items-start gap-10">
            <div className="min-w-[240px] flex-1">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
                  <LogoMark size={19} />
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
          <div className="mt-11 flex items-center gap-5 border-t border-white/10 pt-6">
            <div className="text-[12.5px] text-ink-500">{t('footer.copyright')}</div>
          </div>
        </Container>
      </footer>
    </div>
  )
}
