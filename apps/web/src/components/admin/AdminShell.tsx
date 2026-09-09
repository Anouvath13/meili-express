import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { adminAuthApi } from '../../lib/adminApi'
import { useAdminAuth } from '../../store/adminAuth'
import { LogoMark } from '../primitives/Logo'
import { LangSwitcher } from '../layout/LangSwitcher'

// Mirrors the mockup's own STAFF_PAGES list exactly — everything else is
// admin-only, matching the server-side requireRole('admin') gates.
export const STAFF_PAGES = ['dash', 'bills', 'rates', 'account'] as const;

const NAV: { to: string; page: string; key: string }[] = [
  { to: '/admin', page: 'dash', key: 'dash' },
  { to: '/admin/bills', page: 'bills', key: 'bills' },
  { to: '/admin/rates', page: 'rates', key: 'rates' },
  { to: '/admin/points', page: 'points', key: 'points' },
  { to: '/admin/referral', page: 'referral', key: 'referral' },
  { to: '/admin/news', page: 'news', key: 'news' },
  { to: '/admin/faq', page: 'faq', key: 'faq' },
  { to: '/admin/reviews', page: 'reviews', key: 'reviews' },
  { to: '/admin/notifications', page: 'notif', key: 'notif' },
  { to: '/admin/staff', page: 'staff', key: 'staff' },
  { to: '/admin/account', page: 'account', key: 'account' },
]

export function isStaffAllowed(role: 'admin' | 'staff' | undefined, page: string): boolean {
  return role === 'admin' || (STAFF_PAGES as readonly string[]).includes(page)
}

export function AdminShell() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const staff = useAdminAuth((s) => s.staff)
  const clear = useAdminAuth((s) => s.clear)
  const [drawerOpen, setDrawerOpen] = useState(false)

  async function handleLogout() {
    try {
      await adminAuthApi.logout()
    } catch {
      // stateless token — proceed with client-side logout regardless
    }
    clear()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-[#fafafb]">
      <div className="sticky top-0 z-20 border-b border-ink-50 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center gap-5 px-5 py-4 sm:px-10">
          <Link to="/admin" className="flex shrink-0 items-center gap-[7px]">
            <LogoMark size={28} />
            <span className="hidden text-base font-bold tracking-[0.04em] text-brand-700 sm:inline whitespace-nowrap">MEILI EXPRESS</span>
          </Link>
          <div className="hidden shrink-0 rounded-lg bg-ink-900 px-3 py-1.5 font-mono text-[10.5px] tracking-[0.14em] text-white sm:block">
            {t('admin.consoleTag')}
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-3">
            <LangSwitcher compact />
            {staff && (
              <span
                className="hidden whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-bold sm:inline-block"
                style={staff.role === 'admin' ? { background: '#FFF1E8', color: '#C2470A' } : { background: '#f4f4f6', color: '#3a3c42' }}
              >
                {t(staff.role === 'admin' ? 'admin.roleAdmin' : 'admin.roleStaff')}
              </span>
            )}
            <button
              type="button"
              onClick={() => setDrawerOpen((v) => !v)}
              className="flex h-10 w-10 flex-col items-center justify-center gap-1 rounded-full bg-ink-900 lg:hidden"
              aria-label="Menu"
            >
              <span className="h-0.5 w-[16px] rounded-full bg-white" />
              <span className="h-0.5 w-[16px] rounded-full bg-white" />
              <span className="h-0.5 w-[16px] rounded-full bg-white" />
            </button>
          </div>
        </div>
        {drawerOpen && (
          <div className="flex flex-col gap-0.5 border-t border-ink-50 px-5 pb-5 lg:hidden">
            {NAV.map((item) => {
              const allowed = isStaffAllowed(staff?.role, item.page)
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setDrawerOpen(false)}
                  className={`flex items-center justify-between gap-2 border-b border-ink-50 py-3.5 text-[15px] ${
                    location.pathname === item.to ? 'font-bold text-brand-700' : 'font-medium text-ink-700'
                  } ${allowed ? '' : 'opacity-40'}`}
                >
                  <span>{t(`admin.nav.${item.key}`)}</span>
                  {!(STAFF_PAGES as readonly string[]).includes(item.page) && staff?.role === 'admin' && (
                    <span className="rounded bg-brand-100 px-1.5 py-0.5 font-mono text-[9px] tracking-wide text-brand-800">ADMIN</span>
                  )}
                </NavLink>
              )
            })}
            <button type="button" onClick={handleLogout} className="mt-3 rounded-full border border-ink-100 py-3.5 text-sm font-semibold text-ink-500">
              {t('admin.logout')}
            </button>
          </div>
        )}
      </div>

      <div className="mx-auto flex max-w-[1400px] items-start">
        <aside className="sticky top-[65px] hidden w-[248px] shrink-0 flex-col gap-1 border-r border-ink-50 bg-white p-4 lg:flex">
          <div className="px-2.5 pb-3 font-mono text-[10px] tracking-[0.16em] text-ink-300">{t('admin.navKicker')}</div>
          {NAV.map((item) => {
            const allowed = isStaffAllowed(staff?.role, item.page)
            const active = location.pathname === item.to
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center justify-between gap-2 rounded-xl px-3.5 py-3 text-[13.5px] ${
                  active ? 'bg-brand-100 font-bold text-brand-800' : 'font-medium text-ink-700'
                } ${allowed ? '' : 'opacity-40'}`}
              >
                <span>{t(`admin.nav.${item.key}`)}</span>
                {!(STAFF_PAGES as readonly string[]).includes(item.page) && staff?.role === 'admin' && (
                  <span className="rounded bg-brand-50 px-1.5 py-0.5 font-mono text-[9px] tracking-wide text-brand-800">ADMIN</span>
                )}
              </NavLink>
            )
          })}
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 rounded-xl border border-ink-100 py-3 text-[13.5px] font-semibold text-ink-500 hover:text-ink-900"
          >
            {t('admin.logout')}
          </button>
        </aside>

        <main className="min-w-0 flex-1 px-5 py-9 sm:px-8 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
