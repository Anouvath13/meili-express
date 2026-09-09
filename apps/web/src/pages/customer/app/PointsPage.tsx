import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AppHero } from '../../../components/customer/AppHero'
import { KpiCard } from '../../../components/customer/KpiCard'
import { Container } from '../../../components/primitives/Container'
import { customerApi } from '../../../lib/customerApi'
import { formatKip } from '../../../lib/format'

export default function PointsPage() {
  const { t, i18n } = useTranslation()
  const balance = useQuery({ queryKey: ['points', 'balance'], queryFn: customerApi.pointsBalance })
  const history = useQuery({ queryKey: ['points', 'history'], queryFn: customerApi.pointsHistory })

  return (
    <div>
      <AppHero
        title={t('app.points.title')}
        subtitle={t('app.points.sub')}
        stats={[
          { value: String(balance.data?.unlocked ?? 0), label: t('app.dashboard.kPtsAvail') },
          { value: String(balance.data?.locked ?? 0), label: t('app.dashboard.kPtsLocked') },
          {
            value: balance.data?.expiresAt ? new Date(balance.data.expiresAt).toLocaleDateString(i18n.language) : '—',
            label: t('app.points.expiresLabel'),
          },
        ]}
      />
      <Container className="py-10 sm:py-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard kicker={t('app.dashboard.kPtsAvail')} value={String(balance.data?.unlocked ?? 0)} note={t('app.dashboard.ptsAvailNote')} />
          <KpiCard kicker={t('app.dashboard.kPtsLocked')} value={String(balance.data?.locked ?? 0)} note={t('app.dashboard.ptsLockedNote')} />
          <KpiCard kicker={t('app.dashboard.kPtsValue')} value={formatKip((balance.data?.unlocked ?? 0) * 100)} note={t('app.dashboard.ptsValueNote')} />
        </div>

        <div className="mt-10 rounded-2xl border border-brand-300 bg-[#FFF7F2] p-6 text-[14.5px] leading-[1.85] text-brand-800">
          {t('app.points.rules')}
        </div>

        <div className="mt-12">
          <div className="text-xl font-bold text-ink-900 sm:text-2xl">{t('app.points.history')}</div>
          <div className="mt-5 overflow-hidden rounded-[20px] bg-white shadow-card">
            <div className="hidden bg-[#FFF7F2] px-6 py-4 font-mono text-[10.5px] tracking-[0.14em] text-brand-900 sm:flex">
              <div className="flex-1">{t('app.dashboard.colDate')}</div>
              <div className="flex-[2.4]">{t('app.points.colDetail')}</div>
              <div className="flex-1 text-right">{t('app.points.colPts')}</div>
            </div>
            {(history.data?.items ?? []).map((h) => (
              <div key={h.id} className="flex flex-col gap-1 border-t border-[#f6f6f7] px-6 py-4 first:border-t-0 sm:flex-row sm:items-center sm:gap-0 sm:py-4">
                <div className="text-ink-500 sm:flex-1">{new Date(h.date).toLocaleDateString(i18n.language)}</div>
                <div className="text-ink-900 sm:flex-[2.4]">
                  {h.billNumber ? `${h.billNumber} · ` : ''}
                  {t(`app.points.source.${h.source}`, { defaultValue: h.source })}
                </div>
                <div className={`font-bold sm:flex-1 sm:text-right ${h.delta > 0 ? 'text-success-text' : 'text-error-text'}`}>
                  {h.delta > 0 ? '+' : ''}
                  {h.delta}
                </div>
              </div>
            ))}
            {history.data && history.data.items.length === 0 && <div className="p-6 text-ink-400">{t('common.empty')}</div>}
          </div>
        </div>
      </Container>
    </div>
  )
}
