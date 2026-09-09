import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdminAuth } from '../../store/adminAuth'
import { BlockedBanner } from './PageHeader'
import { isStaffAllowed } from './AdminShell'

// Client-side courtesy only — the server's requireRole('admin') is the real
// enforcement. This just avoids a staff account seeing a broken/empty page
// (or a raw 403) before the request round-trips.
export function AdminOnlyGuard({ page, children }: { page: string; children: ReactNode }) {
  const { t } = useTranslation()
  const role = useAdminAuth((s) => s.staff?.role)

  if (!isStaffAllowed(role, page)) {
    return <BlockedBanner message={t('admin.blockedMsg')} />
  }
  return <>{children}</>
}
