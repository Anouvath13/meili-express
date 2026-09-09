import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { apiErrorMessage } from '../../lib/errorMessage'
import { customerAuthApi } from '../../lib/customerApi'
import { useCustomerAuth } from '../../store/customerAuth'

const dismissKey = (userId: string) => `meili.setPasswordDismissed.${userId}`

// Offered once after a customer's first OTP login/registration, per the
// confirmed rule: password is optional, OTP always still works. Dismissal
// is remembered per-account so it doesn't nag on every dashboard visit.
export function SetPasswordPrompt() {
  const { t } = useTranslation()
  const user = useCustomerAuth((s) => s.user)
  const updateUser = useCustomerAuth((s) => s.updateUser)
  const [dismissed, setDismissed] = useState(() => (user ? localStorage.getItem(dismissKey(user.id)) === '1' : true))
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user || user.hasPassword || dismissed) return null

  function dismiss() {
    if (user) localStorage.setItem(dismissKey(user.id), '1')
    setDismissed(true)
  }

  async function handleSet() {
    if (password.trim().length < 6) {
      setError(t('contact.form.required'))
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await customerAuthApi.setPassword(password)
      updateUser({ hasPassword: true })
      dismiss()
    } catch (err) {
      setError(apiErrorMessage(err, t))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mb-6 rounded-[20px] border border-brand-300 bg-[#FFF7F2] p-6">
      <div className="text-[17px] font-bold text-ink-900">{t('app.auth.setPasswordTitle')}</div>
      <p className="mt-2 text-[14px] leading-[1.7] text-ink-500">{t('app.auth.setPasswordBody')}</p>
      {open ? (
        <div className="mt-4 flex flex-wrap items-start gap-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="min-w-[200px] flex-1 rounded-[14px] border border-ink-100 px-4 py-3 text-[15px] outline-none"
          />
          <button
            type="button"
            onClick={handleSet}
            disabled={submitting}
            className="whitespace-nowrap rounded-full bg-gradient-brand px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {t('app.auth.setPasswordCta')}
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={() => setOpen(true)} className="rounded-full bg-gradient-brand px-6 py-3 text-sm font-bold text-white">
            {t('app.auth.setPasswordCta')}
          </button>
          <button type="button" onClick={dismiss} className="rounded-full border border-ink-100 px-6 py-3 text-sm font-semibold text-ink-500">
            {t('app.auth.skipForNow')}
          </button>
        </div>
      )}
      {error && <div className="mt-3 text-[13px] text-error-text">{error}</div>}
    </div>
  )
}
