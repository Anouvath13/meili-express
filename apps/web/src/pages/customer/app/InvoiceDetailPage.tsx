import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { AppHero } from '../../../components/customer/AppHero'
import { StatusBadge } from '../../../components/customer/StatusBadge'
import { Container } from '../../../components/primitives/Container'
import { apiErrorMessage } from '../../../lib/errorMessage'
import { customerApi } from '../../../lib/customerApi'
import { formatKip } from '../../../lib/format'
import { isPaid } from '../../../lib/shipmentStatus'

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [pointsToUse, setPointsToUse] = useState('')
  const [error, setError] = useState<string | null>(null)

  const invoice = useQuery({ queryKey: ['invoices', id], queryFn: () => customerApi.invoice(id!), enabled: !!id })

  const redeem = useMutation({
    mutationFn: (points: number) => customerApi.redeemPoints(id!, points),
    onSuccess: () => {
      setError(null)
      queryClient.invalidateQueries({ queryKey: ['invoices', id] })
      queryClient.invalidateQueries({ queryKey: ['points'] })
    },
    onError: (err) => setError(apiErrorMessage(err, t)),
  })

  if (!invoice.data) {
    return <Container className="py-24 text-center text-ink-400">{invoice.isLoading ? t('common.loading') : t('common.error')}</Container>
  }

  const inv = invoice.data
  const paid = isPaid(inv.status)
  const price = Number(inv.price ?? 0)
  const usedPoints = Math.max(0, Math.min(Number(pointsToUse) || 0, inv.maxRedeemablePoints))
  const discount = usedPoints * inv.pointValue
  const overCap = Number(pointsToUse) > inv.maxRedeemablePoints

  function handleApply() {
    if (usedPoints <= 0) return
    redeem.mutate(usedPoints)
  }

  return (
    <div>
      <AppHero title={t('app.invoiceDetail.title')} subtitle={t('app.invoiceDetail.sub')} compact />
      <Container className="py-10 sm:py-12">
        <Link to="/app/invoices" className="text-[13.5px] font-semibold text-brand-700">
          {t('app.invoiceDetail.backToBills')}
        </Link>

        <div className="mt-6 rounded-[22px] bg-white p-6 shadow-card sm:p-[30px]">
          <div className="flex flex-wrap items-center gap-4">
            <div className="font-mono text-lg font-medium text-ink-900">{inv.billNumber}</div>
            <StatusBadge label={t(paid ? 'app.dashboard.payPaid' : 'app.dashboard.payWait')} positive={paid} />
            <div className="ml-auto text-[13.5px] text-ink-400">
              {inv.receivedDate ? new Date(inv.receivedDate).toLocaleDateString(i18n.language) : '—'}
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-ink-50">
            <div className="hidden bg-[#FFF7F2] px-5 py-3.5 font-mono text-[10.5px] tracking-[0.14em] text-brand-900 sm:flex">
              <div className="flex-[2]">{t('app.invoiceDetail.itemsLabel')}</div>
              <div className="flex-1">{t('app.dashboard.colWeight')}</div>
              <div className="flex-[1.2] text-right">{t('app.dashboard.colAmount')}</div>
            </div>
            <div className="flex flex-col gap-1 border-t border-ink-50 px-5 py-4 sm:flex-row sm:items-center sm:gap-0">
              <div className="text-ink-900 sm:flex-[2]">{inv.productType ?? '—'}</div>
              <div className="text-ink-500 sm:flex-1">{inv.weightKg ? `${inv.weightKg} kg` : '—'}</div>
              <div className="font-semibold text-ink-900 sm:flex-[1.2] sm:text-right">{inv.price ? formatKip(inv.price) : t('app.invoiceDetail.noPrice')}</div>
            </div>
          </div>
        </div>

        {inv.price !== null && (
          <div className="mt-6 rounded-[22px] bg-white p-6 shadow-card sm:p-[30px]">
            <div className="text-lg font-bold text-ink-900">{t('app.invoiceDetail.useTitle')}</div>
            <div className="mt-2 text-sm text-ink-500">{t('app.invoiceDetail.useHint')}</div>

            {!inv.redeemable ? (
              <div className="mt-5 rounded-2xl bg-ink-50 px-5 py-4 text-sm text-ink-500">
                {inv.pointsRedeemed > 0 ? t('app.invoiceDetail.alreadyRedeemed') : t('app.errors.redeem_wrong_status')}
              </div>
            ) : (
              <>
                <div className="mt-6 flex flex-wrap gap-8">
                  <div className="min-w-[200px] flex-1">
                    <div className="text-[13px] font-semibold text-ink-700">{t('app.invoiceDetail.ptsUse')}</div>
                    <input
                      type="number"
                      value={pointsToUse}
                      onChange={(e) => setPointsToUse(e.target.value)}
                      className={`mt-2.5 w-full rounded-[14px] border px-5 py-[15px] text-[15px] outline-none ${overCap ? 'border-error-border bg-error-bg' : 'border-ink-100'}`}
                    />
                    <div className="mt-2 text-[12.5px] text-ink-400">
                      {t('app.invoiceDetail.maxPts')}: {inv.maxRedeemablePoints}
                    </div>
                  </div>
                  <div className="min-w-[180px] flex-1">
                    <div className="text-[13px] text-ink-500">{t('app.invoiceDetail.subtotal')}</div>
                    <div className="mt-1.5 text-[17px] font-semibold text-ink-900">{formatKip(price)}</div>
                    <div className="mt-4 text-[13px] text-ink-500">{t('app.invoiceDetail.discount')}</div>
                    <div className="mt-1.5 text-[17px] font-semibold text-success-text">− {formatKip(discount)}</div>
                    <div className="mt-4 text-[13px] text-ink-500">{t('app.invoiceDetail.total')}</div>
                    <div className="mt-1.5 text-2xl font-bold tracking-tight text-ink-900">{formatKip(price - discount)}</div>
                  </div>
                </div>

                {overCap && <div className="mt-4 rounded-2xl bg-error-bg px-5 py-3.5 text-[13px] text-error-text">{t('app.errors.redeem_over_cap')}</div>}
                {error && <div className="mt-4 rounded-2xl bg-error-bg px-5 py-3.5 text-[13px] text-error-text">{error}</div>}
                {redeem.isSuccess && (
                  <div className="mt-4 rounded-2xl bg-success-bg px-5 py-3.5 text-[13px] text-success-text">{t('app.invoiceDetail.applied')}</div>
                )}

                <button
                  type="button"
                  onClick={handleApply}
                  disabled={redeem.isPending || usedPoints <= 0}
                  className="mt-5 rounded-full bg-gradient-brand px-7 py-[17px] text-[15px] font-bold text-white shadow-brand-btn disabled:opacity-60"
                >
                  {t('app.invoiceDetail.apply')}
                </button>
              </>
            )}

            <div className="mt-6 rounded-2xl bg-brand-50 p-5">
              <div className="font-mono text-[10.5px] tracking-[0.14em] text-brand-900">{t('app.invoiceDetail.payChannels')}</div>
              <div className="mt-2.5 text-[14.5px] leading-[1.7] text-brand-800">{t('app.invoiceDetail.awaiting')}</div>
            </div>
          </div>
        )}
      </Container>
    </div>
  )
}
