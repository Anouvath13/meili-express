import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SHIPMENT_STATUS } from '@meili/shared'
import { AppHero } from '../../../components/customer/AppHero'
import { Container } from '../../../components/primitives/Container'
import { customerApi } from '../../../lib/customerApi'

export default function TrackingPage() {
  const { t } = useTranslation()
  const [billNumber, setBillNumber] = useState<string | null>(null)
  const steps = t('tracking.steps', { returnObjects: true }) as string[]

  const parcels = useQuery({ queryKey: ['parcels'], queryFn: customerApi.parcels })
  useEffect(() => {
    if (!billNumber && parcels.data && parcels.data.items.length > 0) {
      setBillNumber(parcels.data.items[0].billNumber)
    }
  }, [parcels.data, billNumber])

  const status = useQuery({
    queryKey: ['parcels', billNumber],
    queryFn: () => customerApi.parcelStatus(billNumber!),
    enabled: !!billNumber,
  })

  const currentIndex = status.data ? SHIPMENT_STATUS.indexOf(status.data.status) : -1

  return (
    <div>
      <AppHero title={t('app.tracking.title')} subtitle={t('app.tracking.sub')} compact />
      <Container className="py-10 sm:py-12">
        {parcels.data && parcels.data.items.length === 0 ? (
          <div className="text-ink-400">{t('app.tracking.empty')}</div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {(parcels.data?.items ?? []).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setBillNumber(p.billNumber)}
                  className={`rounded-full px-5 py-2.5 font-mono text-[13px] font-semibold ${
                    billNumber === p.billNumber ? 'bg-gradient-brand text-white shadow-brand-btn' : 'border border-ink-100 bg-white text-ink-500'
                  }`}
                >
                  {p.billNumber}
                </button>
              ))}
            </div>

            {status.data && (
              <div className="mt-6 rounded-[22px] bg-white p-6 shadow-card sm:p-[30px]">
                <div className="font-mono text-lg font-medium text-ink-900">{status.data.billNumber}</div>
                <div className="mt-7 flex flex-col gap-5">
                  {steps.map((label, i) => {
                    const done = i <= currentIndex
                    return (
                      <div key={label} className="flex items-start gap-4">
                        <div
                          className={`mt-1 h-4 w-4 shrink-0 rounded-full ${
                            done ? 'bg-gradient-brand shadow-[0_4px_10px_-3px_rgba(255,106,20,0.7)]' : 'border-2 border-ink-100 bg-white'
                          }`}
                        />
                        <div className={`text-[15.5px] leading-[1.6] ${done ? 'font-semibold text-ink-900' : 'font-medium text-ink-400'}`}>{label}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  )
}
