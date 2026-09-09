import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { normalizePhone } from '@meili/shared'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LangSwitcher } from '../../components/layout/LangSwitcher'
import { LogoMark } from '../../components/primitives/Logo'
import { adminAuthApi } from '../../lib/adminApi'
import { apiErrorMessage } from '../../lib/errorMessage'
import { useAdminAuth } from '../../store/adminAuth'

export default function AdminLoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = (location.state as { from?: Location } | null)?.from?.pathname || '/admin'
  const setAuth = useAdminAuth((s) => s.setAuth)

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setTouched(true)
    setError(null)
    if (phone.trim() === '' || password.trim() === '') return
    setSubmitting(true)
    try {
      const res = await adminAuthApi.login(normalizePhone(phone), password)
      setAuth(res.token, res.staff)
      navigate(res.staff.forcePasswordChange ? '/admin/account' : redirectTo)
    } catch (err) {
      setError(apiErrorMessage(err, t))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink-900">
      <div className="flex items-center justify-between px-5 py-5 sm:px-10">
        <Link to="/" className="flex items-center gap-[7px]">
          <LogoMark size={28} />
          <span className="text-[15px] font-bold tracking-[0.04em] text-white">MEILI EXPRESS</span>
        </Link>
        <LangSwitcher />
      </div>

      <div className="relative mx-auto flex max-w-[1100px] flex-col items-stretch gap-10 px-5 pb-20 pt-6 sm:px-10 lg:flex-row lg:items-start lg:gap-16">
        <div className="pointer-events-none absolute -top-10 right-0 h-[380px] w-[380px] rounded-full bg-brand-500/20 blur-[70px]" />

        <div className="relative min-w-0 flex-1">
          <div className="inline-flex items-center gap-[9px] rounded-full border border-white/18 bg-white/8 px-[18px] py-[9px] font-mono text-[11.5px] tracking-[0.12em] text-brand-300">
            <span className="h-[7px] w-[7px] rounded-full bg-brand-500" />
            {t('admin.login.badge')}
          </div>
          <h1 className="mt-[22px] max-w-[520px] text-[28px] font-bold leading-[1.3] tracking-tight text-pretty text-white sm:text-4xl lg:text-[46px]">
            {t('admin.login.title')}
          </h1>
          <p className="mt-4 max-w-[460px] text-[15.5px] leading-[1.85] text-white/65 text-pretty">{t('admin.login.sub')}</p>

          <div className="mt-8 flex flex-col gap-3.5 border-t border-white/12 pt-7">
            {(t('admin.login.notes', { returnObjects: true }) as string[]).map((note) => (
              <div key={note} className="flex items-start gap-3">
                <span className="mt-[9px] h-[5px] w-[5px] shrink-0 rounded-full bg-brand-500" />
                <div className="text-sm leading-[1.8] text-white/70">{note}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full shrink-0 rounded-[22px] bg-white p-6 shadow-[0_30px_60px_-24px_rgba(0,0,0,0.6)] sm:p-8 lg:w-[420px]">
          <div className="text-xl font-bold text-ink-900">{t('admin.login.cardTitle')}</div>
          <div className="mt-2 text-[13.5px] text-ink-400">{t('admin.login.cardSub')}</div>
          <div className="mt-6 flex flex-col gap-4">
            <div>
              <div className="text-[13px] font-semibold text-ink-700">{t('admin.fields.phone')}</div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="020 ..."
                className={`mt-2.5 w-full rounded-[14px] border px-5 py-[15px] text-[15px] outline-none ${
                  touched && phone.trim() === '' ? 'border-error-border bg-error-bg' : 'border-ink-100'
                }`}
              />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-ink-700">{t('admin.fields.pass')}</div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`mt-2.5 w-full rounded-[14px] border px-5 py-[15px] text-[15px] outline-none ${
                  touched && password.trim() === '' ? 'border-error-border bg-error-bg' : 'border-ink-100'
                }`}
              />
            </div>
          </div>

          {error && <div className="mt-4 rounded-2xl bg-error-bg px-4 py-3 text-[13px] text-error-text">{error}</div>}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-6 w-full rounded-full bg-ink-900 px-7 py-[17px] text-[15.5px] font-bold text-white disabled:opacity-60"
          >
            {t('admin.login.submit')}
          </button>
          <div className="mt-5 border-t border-ink-50 pt-5 text-[13px] leading-[1.8] text-ink-400">{t('admin.login.footerNote')}</div>
        </div>
      </div>
    </div>
  )
}
