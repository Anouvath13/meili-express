import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { normalizePhone } from '@meili/shared'
import { AuthShell } from '../../../components/customer/AuthShell'
import { FormField } from '../../../components/customer/FormField'
import { apiErrorMessage } from '../../../lib/errorMessage'
import { customerAuthApi } from '../../../lib/customerApi'

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const phone = params.get('phone') ?? ''

  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPassword2, setNewPassword2] = useState('')
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mismatch = touched && newPassword2 !== '' && newPassword !== newPassword2

  async function handleSubmit() {
    setTouched(true)
    setError(null)
    if (otp.trim() === '' || newPassword.trim() === '' || newPassword2.trim() === '' || newPassword !== newPassword2) return
    setSubmitting(true)
    try {
      await customerAuthApi.resetPassword({ phone: normalizePhone(phone), otp, newPassword })
      navigate('/app/login')
    } catch (err) {
      setError(apiErrorMessage(err, t))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title={t('app.auth.reset.title')} subtitle={t('app.auth.reset.sub')}>
      <div className="text-xl font-bold text-ink-900">{t('app.auth.reset.title')}</div>
      <div className="mt-6 flex flex-col gap-4">
        <FormField
          label={t('app.auth.fields.otp')}
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          error={touched && otp.trim() === '' ? t('contact.form.required') : undefined}
        />
        <FormField
          label={t('app.auth.fields.newPass')}
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={touched && newPassword.trim() === '' ? t('contact.form.required') : undefined}
        />
        <FormField
          label={t('app.auth.fields.newPass2')}
          type="password"
          value={newPassword2}
          onChange={(e) => setNewPassword2(e.target.value)}
          error={mismatch ? t('contact.form.required') : touched && newPassword2.trim() === '' ? t('contact.form.required') : undefined}
        />
      </div>
      {error && <div className="mt-4 rounded-2xl bg-error-bg px-4 py-3 text-[13px] text-error-text">{error}</div>}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-6 w-full rounded-full bg-gradient-brand px-7 py-[17px] text-[15.5px] font-bold text-white shadow-brand-btn disabled:opacity-60"
      >
        {t('app.auth.reset.submit')}
      </button>
    </AuthShell>
  )
}
