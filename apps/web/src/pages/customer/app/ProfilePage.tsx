import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { normalizePhone } from '@meili/shared'
import { useNavigate } from 'react-router-dom'
import { AppHero } from '../../../components/customer/AppHero'
import { FormField } from '../../../components/customer/FormField'
import { Container } from '../../../components/primitives/Container'
import { apiErrorMessage } from '../../../lib/errorMessage'
import { customerAuthApi, customerApi } from '../../../lib/customerApi'
import { useCustomerAuth } from '../../../store/customerAuth'

export default function ProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useCustomerAuth((s) => s.user)
  const updateUser = useCustomerAuth((s) => s.updateUser)
  const clear = useCustomerAuth((s) => s.clear)

  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [newPhone, setNewPhone] = useState('')
  const [phoneOtp, setPhoneOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPassword2, setNewPassword2] = useState('')
  const [savingPass, setSavingPass] = useState(false)
  const [passSaved, setPassSaved] = useState(false)
  const [passError, setPassError] = useState<string | null>(null)
  const [passTouched, setPassTouched] = useState(false)

  async function handleSendPhoneOtp() {
    if (newPhone.trim() === '') return
    setSendingOtp(true)
    setProfileError(null)
    try {
      await customerAuthApi.sendOtp(normalizePhone(newPhone), 'change_phone')
      setOtpSent(true)
    } catch (err) {
      setProfileError(apiErrorMessage(err, t))
    } finally {
      setSendingOtp(false)
    }
  }

  async function handleSaveProfile() {
    setProfileError(null)
    setSavingProfile(true)
    try {
      if (fullName.trim() !== '' && fullName !== user?.fullName) {
        await customerApi.updateProfile({ fullName })
        updateUser({ fullName })
      }
      if (newPhone.trim() !== '' && phoneOtp.trim() !== '') {
        const res = await customerApi.changePhone(normalizePhone(newPhone), phoneOtp)
        updateUser({ phone: res.phone })
        setNewPhone('')
        setPhoneOtp('')
        setOtpSent(false)
      }
      setProfileSaved(true)
    } catch (err) {
      setProfileError(apiErrorMessage(err, t))
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleSavePassword() {
    setPassTouched(true)
    setPassError(null)
    if (newPassword.trim() === '' || newPassword !== newPassword2) return
    if (user?.hasPassword && oldPassword.trim() === '') return

    setSavingPass(true)
    try {
      if (user?.hasPassword) {
        await customerAuthApi.changePassword(oldPassword, newPassword)
      } else {
        await customerAuthApi.setPassword(newPassword)
        updateUser({ hasPassword: true })
      }
      setOldPassword('')
      setNewPassword('')
      setNewPassword2('')
      setPassTouched(false)
      setPassSaved(true)
    } catch (err) {
      setPassError(apiErrorMessage(err, t))
    } finally {
      setSavingPass(false)
    }
  }

  async function handleLogout() {
    try {
      await customerAuthApi.logout()
    } catch {
      // stateless token — proceed with client-side logout regardless
    }
    clear()
    navigate('/app/login')
  }

  return (
    <div>
      <AppHero title={t('app.profile.title')} subtitle={t('app.profile.sub')} compact />
      <Container className="py-10 sm:py-12">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <div className="rounded-[22px] bg-white p-6 shadow-card sm:p-[30px]">
            <div className="text-lg font-bold text-ink-900">{t('app.profile.personal')}</div>
            <div className="mt-5 flex flex-col gap-4">
              <FormField label={t('app.auth.fields.name')} value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <FormField label={t('app.auth.fields.phone')} value={user?.phone ?? ''} onChange={() => {}} />
              <FormField
                label={t('app.auth.fields.newPhone')}
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                actionLabel={t('app.auth.sendOtp')}
                onAction={handleSendPhoneOtp}
                actionDisabled={sendingOtp || newPhone.trim() === ''}
                hint={otpSent ? t('app.auth.otpSentMsg') : t('app.profile.newPhoneHint')}
              />
              {otpSent && (
                <FormField label={t('app.auth.fields.otp')} value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value)} />
              )}
            </div>
            {profileError && <div className="mt-4 rounded-2xl bg-error-bg px-4 py-3 text-[13px] text-error-text">{profileError}</div>}
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="mt-6 rounded-full bg-gradient-brand px-7 py-[17px] text-[15px] font-bold text-white shadow-brand-btn disabled:opacity-60"
            >
              {t('app.profile.save')}
            </button>
            {profileSaved && <div className="mt-4 rounded-2xl bg-success-bg px-4 py-3 text-[13px] text-success-text">{t('app.profile.saved')}</div>}
          </div>

          <div className="rounded-[22px] bg-white p-6 shadow-card sm:p-[30px]">
            <div className="text-lg font-bold text-ink-900">{t('app.profile.changePass')}</div>
            {!user?.hasPassword && <div className="mt-2 text-[13px] text-ink-400">{t('app.profile.notSetYet')}</div>}
            <div className="mt-5 flex flex-col gap-4">
              {user?.hasPassword && (
                <FormField
                  label={t('app.auth.fields.oldPass')}
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  error={passTouched && oldPassword.trim() === '' ? t('contact.form.required') : undefined}
                />
              )}
              <FormField
                label={t('app.auth.fields.newPass')}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={passTouched && newPassword.trim() === '' ? t('contact.form.required') : undefined}
              />
              <FormField
                label={t('app.auth.fields.newPass2')}
                type="password"
                value={newPassword2}
                onChange={(e) => setNewPassword2(e.target.value)}
                error={passTouched && newPassword2 !== newPassword ? t('contact.form.required') : undefined}
              />
            </div>
            {passError && <div className="mt-4 rounded-2xl bg-error-bg px-4 py-3 text-[13px] text-error-text">{passError}</div>}
            <button
              type="button"
              onClick={handleSavePassword}
              disabled={savingPass}
              className="mt-6 rounded-full bg-gradient-brand px-7 py-[17px] text-[15px] font-bold text-white shadow-brand-btn disabled:opacity-60"
            >
              {t('app.profile.savePass')}
            </button>
            {passSaved && <div className="mt-4 rounded-2xl bg-success-bg px-4 py-3 text-[13px] text-success-text">{t('app.profile.saved')}</div>}

            <button
              type="button"
              onClick={handleLogout}
              className="mt-6 w-full rounded-full border border-ink-100 py-[15px] text-[14.5px] font-semibold text-ink-500 hover:text-ink-900"
            >
              {t('app.profile.logout')}
            </button>
          </div>
        </div>
      </Container>
    </div>
  )
}
