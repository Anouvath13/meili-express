import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SHIPMENT_STATUS } from '@meili/shared'
import { Container } from '../../components/primitives/Container'
import { Hero } from '../../components/layout/Hero'
import { ApiError } from '../../lib/api'
import { publicApi } from '../../lib/publicApi'

const CHINA_CARRIER_URL = 'https://wx.gaobat.com/ppp/app/exp_search.do'

export default function TrackingPage() {
  const { t, i18n } = useTranslation()
  const [input, setInput] = useState('')
  const [searchedBill, setSearchedBill] = useState<string | null>(null)

  const result = useQuery({
    queryKey: ['tracking', searchedBill],
    queryFn: () => publicApi.tracking(searchedBill!),
    enabled: searchedBill !== null,
    retry: false,
  })

  const steps = t('tracking.steps', { returnObjects: true }) as string[]
  const currentIndex = result.data ? SHIPMENT_STATUS.indexOf(result.data.status) : -1
  const notFound = result.isError && result.error instanceof ApiError && result.error.status === 404

  return (
    <div>
      <Hero kicker={t('tracking.kicker')} title={t('tracking.title')} subtitle={t('tracking.subtitle')}>
        <div className="mt-[30px] flex max-w-[620px] flex-wrap gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setSearchedBill(input.trim())}
            placeholder={t('tracking.placeholder')}
            className="min-w-[220px] flex-1 rounded-full border border-white/50 bg-white/96 px-6 py-[17px] text-[15px] text-ink-900 outline-none focus:border-white"
          />
          <button
            type="button"
            onClick={() => setSearchedBill(input.trim())}
            className="rounded-full bg-ink-900 px-9 py-[17px] text-[15.5px] font-bold text-white"
          >
            {t('tracking.button')}
          </button>
        </div>
        <div className="mt-3.5">
          <a
            href={CHINA_CARRIER_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-block rounded-full border border-white/45 bg-white/14 px-6 py-[13px] text-sm font-semibold text-white"
          >
            {t('tracking.connect')}
          </a>
        </div>
        {notFound && (
          <div className="mt-4 max-w-[560px] rounded-2xl bg-white/95 px-5 py-[15px] text-[14px] leading-[1.6] text-error-text">
            {t('tracking.errorMsg')}
          </div>
        )}
      </Hero>

      {result.data && (
        <Container className="py-14 sm:py-[88px]">
          <div className="rounded-[22px] bg-white p-6 shadow-card-lg sm:p-8">
            <div className="flex flex-wrap items-center gap-3.5">
              <div className="font-mono text-base font-medium text-ink-900 sm:text-[17px]">{result.data.billNumber}</div>
              <div className="rounded-full bg-brand-100 px-3.5 py-[7px] text-[12.5px] font-semibold text-brand-900">
                {t('tracking.statusLabel')}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-sm text-ink-500">
              {result.data.weightKg && (
                <div>
                  {t('tracking.weight')}: <span className="font-semibold text-ink-900">{result.data.weightKg} kg</span>
                </div>
              )}
              {result.data.price && (
                <div>
                  {t('tracking.price')}: <span className="font-semibold text-ink-900">{Number(result.data.price).toLocaleString()} ₭</span>
                </div>
              )}
              {result.data.estimatedDelivery && (
                <div>
                  {t('tracking.estDelivery')}:{' '}
                  <span className="font-semibold text-ink-900">{new Date(result.data.estimatedDelivery).toLocaleDateString(i18n.language)}</span>
                </div>
              )}
            </div>

            <div className="mt-[30px] flex flex-col">
              {steps.map((label, i) => {
                const done = i <= currentIndex
                return (
                  <div key={label} className="flex items-start gap-[18px]">
                    <div className="flex flex-col items-center self-stretch">
                      <div
                        className={`mt-1 h-3.5 w-3.5 shrink-0 rounded-full ${
                          done ? 'bg-gradient-brand shadow-[0_4px_10px_-3px_rgba(255,106,20,0.7)]' : 'border-2 border-ink-100 bg-white'
                        }`}
                      />
                      {i < steps.length - 1 && <div className="min-h-[26px] w-0.5 flex-1 bg-ink-50" />}
                    </div>
                    <div className="pb-[22px]">
                      <div className={`text-[15.5px] leading-[1.6] ${done ? 'font-semibold text-ink-900' : 'font-medium text-ink-400'}`}>{label}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Container>
      )}
    </div>
  )
}
