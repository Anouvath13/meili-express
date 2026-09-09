import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { AppHero } from '../../../components/customer/AppHero'
import { StatusBadge } from '../../../components/customer/StatusBadge'
import { Container } from '../../../components/primitives/Container'
import { customerApi } from '../../../lib/customerApi'
import { formatKip } from '../../../lib/format'
import { isPaid } from '../../../lib/shipmentStatus'

const FILTERS: { key: 'all' | 'unpaid' | 'paid'; labelKey: number }[] = [
  { key: 'all', labelKey: 0 },
  { key: 'unpaid', labelKey: 1 },
  { key: 'paid', labelKey: 2 },
]

export default function InvoicesPage() {
  const { t, i18n } = useTranslation()
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('all')
  const filterLabels = t('app.invoices.filters', { returnObjects: true }) as string[]

  const all = useQuery({ queryKey: ['invoices', { filter: 'all' }], queryFn: () => customerApi.invoices({ filter: 'all' }) })
  const invoices = useQuery({ queryKey: ['invoices', { filter }], queryFn: () => customerApi.invoices({ filter }) })

  const unpaidCount = all.data?.items.filter((i) => !isPaid(i.status)).length ?? 0
  const paidCount = all.data?.items.filter((i) => isPaid(i.status)).length ?? 0

  return (
    <div>
      <AppHero
        title={t('app.invoices.title')}
        subtitle={t('app.invoices.sub')}
        stats={[
          { value: formatKip(all.data?.items.filter((i) => !isPaid(i.status)).reduce((s, i) => s + Number(i.price ?? 0), 0) ?? 0), label: t('app.dashboard.payWait') },
          { value: String(unpaidCount), label: t('app.dashboard.colBill') },
          { value: String(paidCount), label: t('app.dashboard.payPaid') },
        ]}
      />
      <Container className="py-10 sm:py-12">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-[22px] py-[11px] text-[13.5px] font-semibold ${
                filter === f.key ? 'bg-gradient-brand text-white shadow-brand-btn' : 'border border-ink-100 bg-white font-medium text-ink-500'
              }`}
            >
              {filterLabels[f.labelKey]}
            </button>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-[20px] bg-white shadow-card">
          <div className="hidden bg-[#FFF7F2] px-6 py-4 font-mono text-[10.5px] tracking-[0.14em] text-brand-900 sm:flex">
            <div className="flex-[1.4]">{t('app.dashboard.colBill')}</div>
            <div className="flex-1">{t('app.dashboard.colDate')}</div>
            <div className="flex-1">{t('app.dashboard.colWeight')}</div>
            <div className="flex-[1.2]">{t('app.dashboard.colAmount')}</div>
            <div className="flex-[1.1]">{t('app.dashboard.colPay')}</div>
          </div>
          {(invoices.data?.items ?? []).map((inv) => {
            const paid = isPaid(inv.status)
            return (
              <Link
                key={inv.id}
                to={`/app/invoices/${inv.id}`}
                className="flex flex-col gap-1.5 border-t border-[#f6f6f7] px-6 py-4 first:border-t-0 sm:flex-row sm:items-center sm:gap-0 sm:py-5"
              >
                <div className="font-mono font-medium text-ink-900 sm:flex-[1.4]">{inv.billNumber}</div>
                <div className="text-ink-500 sm:flex-1">{inv.receivedDate ? new Date(inv.receivedDate).toLocaleDateString(i18n.language) : '—'}</div>
                <div className="text-ink-500 sm:flex-1">{inv.weightKg ? `${inv.weightKg} kg` : '—'}</div>
                <div className="font-semibold text-ink-900 sm:flex-[1.2]">{inv.price ? formatKip(inv.price) : '—'}</div>
                <div className="sm:flex-[1.1]">
                  <StatusBadge label={t(paid ? 'app.dashboard.payPaid' : 'app.dashboard.payWait')} positive={paid} />
                </div>
              </Link>
            )
          })}
          {invoices.data && invoices.data.items.length === 0 && <div className="p-6 text-ink-400">{t('common.empty')}</div>}
        </div>
      </Container>
    </div>
  )
}
