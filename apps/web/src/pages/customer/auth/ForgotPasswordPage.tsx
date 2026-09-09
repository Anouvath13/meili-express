import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { normalizePhone } from '@meili/shared'
import { AuthShell } from '../../../components/customer/AuthShell'
import { FormField } from '../../../components/customer/FormField'
import { apiErrorMessage } from '../../../lib/errorMessage'
import { customerAuthApi } from '../../../lib/customerApi'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [phone, setPhone] = useState('')
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setTouched(true)
    setError(null)
    if (phone.trim() === '') return
    setSubmitting(true)
    try {
      await customerAuthApi.forgotPassword(normalizePhone(phone))
      navigate(`/app/reset-password?phone=${encodeURIComponent(normalizePhone(phone))}`)
    } catch (err) {
      setError(apiErrorMessage(err, t))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title={t('app.auth.forgot.title')} subtitle={t('app.auth.forgot.sub')}>
      <div className="text-xl font-bold text-ink-900">{t('app.auth.forgot.title')}</div>
      <div className="mt-6 flex flex-col gap-4">
        <FormField
          label={t('app.auth.fields.phone')}
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="020 ..."
          error={touched && phone.trim() === '' ? t('contact.form.required') : undefined}
        />
      </div>
      {error && <div className="mt-4 rounded-2xl bg-error-bg px-4 py-3 text-[13px] text-error-text">{error}</div>}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-6 w-full rounded-full bg-gradient-brand px-7 py-[17px] text-[15.5px] font-bold text-white shadow-brand-btn disabled:opacity-60"
      >
        {t('app.auth.forgot.submit')}
      </button>
    </AuthShell>
  )
}
