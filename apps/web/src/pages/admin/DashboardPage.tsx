import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AdminBadge, AdminCell, AdminKpiCard, AdminTable, AdminTableRow } from '../../components/admin/ui'
import { PageHeader } from '../../components/admin/PageHeader'
import { adminBillsApi, adminDashboardApi } from '../../lib/adminApi'
import { formatKip } from '../../lib/format'
import { isPaid } from '../../lib/shipmentStatus'

export default function AdminDashboardPage() {
  const { t, i18n } = useTranslation()
  const summary = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: adminDashboardApi.summary })
  const bills = useQuery({ queryKey: ['admin', 'bills', { limit: 4 }], queryFn: () => adminBillsApi.list() })

  return (
    <div>
      <PageHeader title={t('admin.pages.dash.title')} subtitle={t('admin.pages.dash.sub')} />

      <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminKpiCard kicker={t('admin.kpi.all')} value={String(summary.data?.totalBills ?? 0)} note={t('admin.kpi.allNote')} />
        <AdminKpiCard kicker={t('admin.kpi.wait')} value={String(summary.data?.awaitingPayment ?? 0)} note={t('admin.kpi.waitNote')} />
        <AdminKpiCard kicker={t('admin.kpi.cust')} value={String(summary.data?.totalCustomers ?? 0)} note={t('admin.kpi.custNote')} />
        <AdminKpiCard kicker={t('admin.kpi.rev')} value={formatKip(summary.data?.totalRevenue ?? 0)} note={t('admin.kpi.revNote')} />
      </div>

      <AdminTable
        columns={[
          { label: t('admin.cols.no'), flex: 1.2 },
          { label: t('admin.cols.cust'), flex: 1 },
          { label: t('admin.cols.weight'), flex: 0.8 },
          { label: t('admin.cols.amount'), flex: 1 },
          { label: t('admin.cols.status'), flex: 1 },
        ]}
      >
        {(bills.data?.items ?? []).slice(0, 4).map((b) => {
          const paid = isPaid(b.status)
          return (
            <AdminTableRow key={b.id}>
              <AdminCell flex={1.2} mono strong>
                {b.billNumber}
              </AdminCell>
              <AdminCell flex={1} mono dim>
                {b.customerPhone ?? '—'}
              </AdminCell>
              <AdminCell flex={0.8}>{b.weightKg ? `${b.weightKg} kg` : '—'}</AdminCell>
              <AdminCell flex={1}>{b.price ? formatKip(b.price) : '—'}</AdminCell>
              <AdminCell flex={1}>
                <AdminBadge label={t(paid ? 'admin.status.payPaid' : 'admin.status.payWait')} tone={paid ? 'ok' : 'warn'} />
              </AdminCell>
            </AdminTableRow>
          )
        })}
      </AdminTable>

      {summary.data?.latestNews && (
        <div className="mt-6 text-[13px] text-ink-400">
          {summary.data.latestNews.titleLo} —{' '}
          {summary.data.latestNews.publishedAt ? new Date(summary.data.latestNews.publishedAt).toLocaleDateString(i18n.language) : ''}
        </div>
      )}
    </div>
  )
}
