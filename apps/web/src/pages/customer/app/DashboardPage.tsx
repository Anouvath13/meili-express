import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { AppHero } from '../../../components/customer/AppHero'
import { KpiCard } from '../../../components/customer/KpiCard'
import { SetPasswordPrompt } from '../../../components/customer/SetPasswordPrompt'
import { StatusBadge } from '../../../components/customer/StatusBadge'
import { Container } from '../../../components/primitives/Container'
import { customerApi, type InvoiceSummary } from '../../../lib/customerApi'
import { formatKip } from '../../../lib/format'
import { isPaid } from '../../../lib/shipmentStatus'

export default function DashboardPage() {
  const { t } = useTranslation()

  const balance = useQuery({ queryKey: ['points', 'balance'], queryFn: customerApi.pointsBalance })
  const invoices = useQuery({ queryKey: ['invoices', { limit: 3 }], queryFn: () => customerApi.invoices({ limit: 3 }) })
  const active = useQuery({ queryKey: ['parcels', 'active'], queryFn: customerApi.activeParcel })

  const unpaidCount = invoices.data?.items.filter((i) => !isPaid(i.status)).length ?? 0

  return (
    <div>
      <AppHero title={t('app.dashboard.title')} subtitle={t('app.dashboard.sub')} />
      <Container className="py-10 sm:py-12">
        <SetPasswordPrompt />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard kicker={t('app.dashboard.kPtsAvail')} value={String(balance.data?.unlocked ?? 0)} note={t('app.dashboard.ptsAvailNote')} />
          <KpiCard kicker={t('app.dashboard.kPtsLocked')} value={String(balance.data?.locked ?? 0)} note={t('app.dashboard.ptsLockedNote')} />
          <KpiCard kicker={t('app.dashboard.kPtsValue')} value={formatKip((balance.data?.unlocked ?? 0) * 100)} note={t('app.dashboard.ptsValueNote')} />
        </div>

        <div className="mt-12">
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-xl font-bold text-ink-900 sm:text-2xl">{t('app.dashboard.recentBills')}</div>
            <Link to="/app/invoices" className="ml-auto text-[13.5px] font-bold text-brand-700">
              {t('app.dashboard.viewAll')}
            </Link>
          </div>
          <div className="mt-5 overflow-hidden rounded-[20px] bg-white shadow-card">
            <div className="hidden bg-[#FFF7F2] px-6 py-4 font-mono text-[10.5px] tracking-[0.14em] text-brand-900 sm:flex">
              <div className="flex-[1.4]">{t('app.dashboard.colBill')}</div>
              <div className="flex-1">{t('app.dashboard.colDate')}</div>
              <div className="flex-1">{t('app.dashboard.colWeight')}</div>
              <div className="flex-[1.2]">{t('app.dashboard.colAmount')}</div>
              <div className="flex-[1.1]">{t('app.dashboard.colPay')}</div>
            </div>
            {(invoices.data?.items ?? []).map((inv) => (
              <InvoiceRow key={inv.id} invoice={inv} />
            ))}
            {invoices.data && invoices.data.items.length === 0 && <div className="p-6 text-ink-400">{t('common.empty')}</div>}
          </div>
        </div>

        {unpaidCount > 0 && (
          <div className="mt-3 text-[13px] text-ink-400">
            {unpaidCount} {t('app.dashboard.payWait').toLowerCase()}
          </div>
        )}

        <div className="mt-12">
          <div className="text-xl font-bold text-ink-900 sm:text-2xl">{t('app.dashboard.inTransit')}</div>
          <div className="mt-5 rounded-[22px] bg-white p-6 shadow-card sm:p-[30px]">
            {active.data ? (
              <div className="flex flex-wrap items-center gap-4">
                <div className="font-mono text-[15px] font-medium text-ink-900">{active.data.billNumber}</div>
                <Link
                  to="/app/tracking"
                  className="ml-auto rounded-full bg-gradient-brand px-6 py-3 text-[13.5px] font-semibold text-white shadow-brand-btn"
                >
                  {t('app.dashboard.trackCta')}
                </Link>
              </div>
            ) : (
              <div className="text-ink-400">{t('app.dashboard.noActiveParcel')}</div>
            )}
          </div>
        </div>
      </Container>
    </div>
  )
}

function InvoiceRow({ invoice }: { invoice: InvoiceSummary }) {
  const { t, i18n } = useTranslation()
  const paid = isPaid(invoice.status)
  return (
    <Link
      to={`/app/invoices/${invoice.id}`}
      className="flex flex-col gap-1.5 border-t border-[#f6f6f7] px-6 py-4 first:border-t-0 sm:flex-row sm:items-center sm:gap-0 sm:py-5"
    >
      <div className="font-mono font-medium text-ink-900 sm:flex-[1.4]">{invoice.billNumber}</div>
      <div className="text-ink-500 sm:flex-1">{invoice.receivedDate ? new Date(invoice.receivedDate).toLocaleDateString(i18n.language) : '—'}</div>
      <div className="text-ink-500 sm:flex-1">{invoice.weightKg ? `${invoice.weightKg} kg` : '—'}</div>
      <div className="font-semibold text-ink-900 sm:flex-[1.2]">{invoice.price ? formatKip(invoice.price) : '—'}</div>
      <div className="sm:flex-[1.1]">
        <StatusBadge label={t(paid ? 'app.dashboard.payPaid' : 'app.dashboard.payWait')} positive={paid} />
      </div>
    </Link>
  )
}
