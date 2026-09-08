import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Container } from '../../components/primitives/Container'
import { OrangeIconBadge } from '../../components/primitives/OrangeIconBadge'
import { Hero } from '../../components/layout/Hero'
import { publicApi } from '../../lib/publicApi'

const GOOGLE_MAPS_URL = 'https://maps.app.goo.gl/RgHmUPnR1LMhz2K86'

export default function ContactPage() {
  const { t } = useTranslation()
  const rows = t('contact.rows', { returnObjects: true }) as { label: string; value: string }[]

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [touched, setTouched] = useState(false)

  const submit = useMutation({
    mutationFn: () => publicApi.contact({ name, phone, message }),
  })

  const nameError = touched && name.trim() === ''
  const phoneError = touched && phone.trim() === ''
  const messageError = touched && message.trim() === ''

  function handleSend() {
    setTouched(true)
    if (name.trim() === '' || phone.trim() === '' || message.trim() === '') return
    submit.mutate()
  }

  return (
    <div>
      <Hero kicker={t('contact.kicker')} title={t('contact.title')} compact />
      <Container className="py-14 sm:py-[88px]">
        <div className="flex flex-wrap items-start gap-[26px]">
          <div className="flex min-w-[240px] flex-1 flex-col gap-3.5">
            {rows.map((row) => (
              <div key={row.label} className="flex items-start gap-[18px] rounded-[18px] bg-white p-6 shadow-card">
                <OrangeIconBadge size={44} />
                <div>
                  <div className="font-mono text-[10.5px] tracking-[0.14em] text-brand-900">{row.label}</div>
                  <div className="mt-2 text-[15.5px] font-medium leading-[1.7] text-ink-900">{row.value}</div>
                </div>
              </div>
            ))}
            <a
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noreferrer"
              className="flex h-[200px] flex-col items-center justify-center gap-3.5 rounded-[18px] bg-gradient-news"
            >
              <div className="font-mono text-[10.5px] tracking-[0.14em] text-[#C79A7A]">MAP PLACEHOLDER</div>
              <div className="rounded-full bg-white px-6 py-3 text-sm font-bold text-brand-700 shadow-[0_10px_24px_-12px_rgba(120,40,0,0.35)]">
                {t('contact.mapLabel')}
              </div>
            </a>
          </div>

          <div className="min-w-[240px] flex-1 rounded-[22px] bg-white p-7 shadow-card-lg sm:p-9">
            <div className="text-xl font-bold text-ink-900">{t('contact.form.title')}</div>
            <div className="mt-[26px] flex flex-col gap-5">
              <div>
                <div className="text-[13px] font-semibold text-ink-700">{t('contact.form.name')}</div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`mt-2.5 w-full rounded-[14px] border px-[18px] py-[15px] text-[15px] outline-none ${
                    nameError ? 'border-error-border bg-error-bg' : 'border-ink-100'
                  }`}
                />
                {nameError && <div className="mt-2 text-[12.5px] text-error-text">{t('contact.form.required')}</div>}
              </div>
              <div>
                <div className="text-[13px] font-semibold text-ink-700">{t('contact.form.phone')}</div>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`mt-2.5 w-full rounded-[14px] border px-[18px] py-[15px] text-[15px] outline-none ${
                    phoneError ? 'border-error-border bg-error-bg' : 'border-ink-100'
                  }`}
                />
                {phoneError && <div className="mt-2 text-[12.5px] text-error-text">{t('contact.form.required')}</div>}
              </div>
              <div>
                <div className="text-[13px] font-semibold text-ink-700">{t('contact.form.message')}</div>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={`mt-2.5 w-full resize-y rounded-[14px] border px-[18px] py-[15px] text-[15px] outline-none ${
                    messageError ? 'border-error-border bg-error-bg' : 'border-ink-100'
                  }`}
                />
                {messageError && <div className="mt-2 text-[12.5px] text-error-text">{t('contact.form.required')}</div>}
              </div>
              <button
                type="button"
                onClick={handleSend}
                disabled={submit.isPending}
                className="mt-1 rounded-full bg-gradient-brand px-[30px] py-[18px] text-base font-semibold text-white shadow-brand-btn disabled:opacity-60"
              >
                {t('contact.form.send')}
              </button>
              {submit.isSuccess && (
                <div className="rounded-[14px] bg-success-bg px-5 py-[15px] text-sm leading-[1.6] text-success-text">
                  {t('contact.form.sent')}
                </div>
              )}
              {submit.isError && <div className="text-sm text-error-text">{t('common.error')}</div>}
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
