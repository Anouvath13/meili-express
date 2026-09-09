import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { normalizePhone } from '@meili/shared'
import { AuthShell } from '../../../components/customer/AuthShell'
import { FormField } from '../../../components/customer/FormField'
import { apiErrorMessage } from '../../../lib/errorMessage'
import { customerAuthApi } from '../../../lib/customerApi'
import { useCustomerAuth } from '../../../store/customerAuth'

export default function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setAuth = useCustomerAuth((s) => s.setAuth)

  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [fullName, setFullName] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [touched, setTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSendOtp() {
    if (phone.trim() === '') return
    setSending(true)
    setError(null)
    try {
      await customerAuthApi.sendOtp(normalizePhone(phone), 'register')
      setOtpSent(true)
    } catch (err) {
      setError(apiErrorMessage(err, t))
    } finally {
      setSending(false)
    }
  }

  async function handleSubmit() {
    setTouched(true)
    setError(null)
    if (phone.trim() === '' || otp.trim() === '' || fullName.trim() === '') return
    setSubmitting(true)
    try {
      const res = await customerAuthApi.register({
        phone: normalizePhone(phone),
        otp,
        fullName,
        referralCode: referralCode.trim() || undefined,
      })
      setAuth(res.token, res.user)
      navigate('/app')
    } catch (err) {
      setError(apiErrorMessage(err, t))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title={t('app.auth.register.title')} subtitle={t('app.auth.register.sub')}>
      <div className="text-xl font-bold text-ink-900">{t('app.auth.register.title')}</div>
      <div className="mt-6 flex flex-col gap-4">
        <FormField
          label={t('app.auth.fields.name')}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={touched && fullName.trim() === '' ? t('contact.form.required') : undefined}
        />
        <FormField
          label={t('app.auth.fields.phone')}
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="020 ..."
          error={touched && phone.trim() === '' ? t('contact.form.required') : undefined}
        />
        <FormField
          label={t('app.auth.fields.otp')}
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          actionLabel={t('app.auth.sendOtp')}
          onAction={handleSendOtp}
          actionDisabled={sending || phone.trim() === ''}
          error={touched && otp.trim() === '' ? t('contact.form.required') : undefined}
          hint={otpSent ? t('app.auth.otpSentMsg') : undefined}
        />
        <FormField label={t('app.auth.fields.ref')} value={referralCode} onChange={(e) => setReferralCode(e.target.value)} />
      </div>

      {error && <div className="mt-4 rounded-2xl bg-error-bg px-4 py-3 text-[13px] text-error-text">{error}</div>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-6 w-full rounded-full bg-gradient-brand px-7 py-[17px] text-[15.5px] font-bold text-white shadow-brand-btn disabled:opacity-60"
      >
        {t('app.auth.register.submit')}
      </button>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-[13.5px] text-ink-500">
        {t('app.auth.haveAccount')}
        <Link to="/app/login" className="font-bold text-brand-700">
          {t('app.auth.login.title')}
        </Link>
      </div>
    </AuthShell>
  )
}
