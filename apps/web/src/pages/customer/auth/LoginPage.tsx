import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { normalizePhone } from '@meili/shared'
import { AuthShell } from '../../../components/customer/AuthShell'
import { FormField } from '../../../components/customer/FormField'
import { apiErrorMessage } from '../../../lib/errorMessage'
import { customerAuthApi } from '../../../lib/customerApi'
import { useCustomerAuth } from '../../../store/customerAuth'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = (location.state as { from?: Location } | null)?.from?.pathname || '/app'
  const setAuth = useCustomerAuth((s) => s.setAuth)

  const [method, setMethod] = useState<'password' | 'otp'>('password')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
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
      await customerAuthApi.sendOtp(normalizePhone(phone), 'login')
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
    if (phone.trim() === '') return
    if (method === 'password' && password.trim() === '') return
    if (method === 'otp' && otp.trim() === '') return

    setSubmitting(true)
    try {
      const res =
        method === 'password'
          ? await customerAuthApi.loginPassword(normalizePhone(phone), password)
          : await customerAuthApi.loginOtp(normalizePhone(phone), otp)
      setAuth(res.token, res.user)
      navigate(redirectTo)
    } catch (err) {
      setError(apiErrorMessage(err, t))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title={t('app.auth.login.title')} subtitle={t('app.auth.login.sub')}>
      <div className="text-xl font-bold text-ink-900">{t('app.auth.login.title')}</div>

      <div className="mt-5 flex gap-1 rounded-full bg-ink-50 p-1">
        <button
          type="button"
          onClick={() => setMethod('password')}
          className={`flex-1 rounded-full py-2.5 text-[13px] font-semibold ${method === 'password' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-400'}`}
        >
          {t('app.auth.loginWithPassword')}
        </button>
        <button
          type="button"
          onClick={() => setMethod('otp')}
          className={`flex-1 rounded-full py-2.5 text-[13px] font-semibold ${method === 'otp' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-400'}`}
        >
          {t('app.auth.fields.otp')}
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        <FormField
          label={t('app.auth.fields.phone')}
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="020 ..."
          error={touched && phone.trim() === '' ? t('contact.form.required') : undefined}
        />
        {method === 'password' ? (
          <FormField
            label={t('app.auth.fields.pass')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={touched && password.trim() === '' ? t('contact.form.required') : undefined}
          />
        ) : (
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
        )}
      </div>

      {error && <div className="mt-4 rounded-2xl bg-error-bg px-4 py-3 text-[13px] text-error-text">{error}</div>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-6 w-full rounded-full bg-gradient-brand px-7 py-[17px] text-[15.5px] font-bold text-white shadow-brand-btn disabled:opacity-60"
      >
        {t('app.auth.login.submit')}
      </button>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-[13.5px] text-ink-500">
        {t('app.auth.noAccount')}
        <Link to="/app/register" className="font-bold text-brand-700">
          {t('app.auth.register.title')}
        </Link>
      </div>
      <Link to="/app/forgot-password" className="mt-2.5 block text-[13.5px] text-ink-500 hover:text-brand-700">
        {t('app.auth.forgotLink')}
      </Link>
    </AuthShell>
  )
}
