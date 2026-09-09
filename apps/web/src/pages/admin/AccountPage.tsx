import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { normalizePhone } from '@meili/shared'
import { ActionButton, FormCard, TextField, PrimaryButton, Notice } from '../../components/admin/ui'
import { PageHeader } from '../../components/admin/PageHeader'
import { adminAuthApi, adminPhoneRequestsApi } from '../../lib/adminApi'
import { apiErrorMessage } from '../../lib/errorMessage'
import { useAdminAuth } from '../../store/adminAuth'

export default function AdminAccountPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const staff = useAdminAuth((s) => s.staff)
  const updateStaff = useAdminAuth((s) => s.updateStaff)

  const [name, setName] = useState(staff?.fullName ?? '')
  const [nameError, setNameError] = useState<string | null>(null)
  const [nameSaved, setNameSaved] = useState(false)

  const [newPhone, setNewPhone] = useState('')
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [phoneSent, setPhoneSent] = useState(false)

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPassword2, setNewPassword2] = useState('')
  const [passError, setPassError] = useState<string | null>(null)
  const [passSaved, setPassSaved] = useState(false)
  const [passTouched, setPassTouched] = useState(false)

  const myRequests = useQuery({
    queryKey: ['admin', 'me', 'phone-requests'],
    queryFn: adminAuthApi.myPhoneRequests,
    enabled: !staff?.forcePasswordChange,
  })
  const pendingReview = useQuery({
    queryKey: ['admin', 'phone-requests'],
    queryFn: adminPhoneRequestsApi.list,
    enabled: staff?.role === 'admin',
  })

  const saveName = useMutation({
    mutationFn: () => adminAuthApi.changeName(name),
    onSuccess: () => {
      setNameError(null)
      setNameSaved(true)
      updateStaff({ fullName: name })
    },
    onError: (err) => setNameError(apiErrorMessage(err, t)),
  })

  const requestPhone = useMutation({
    mutationFn: () => adminAuthApi.requestPhoneChange(normalizePhone(newPhone)),
    onSuccess: () => {
      setPhoneError(null)
      setPhoneSent(true)
      setNewPhone('')
      queryClient.invalidateQueries({ queryKey: ['admin', 'me', 'phone-requests'] })
    },
    onError: (err) => setPhoneError(apiErrorMessage(err, t)),
  })

  const savePassword = useMutation({
    mutationFn: () => adminAuthApi.changePassword(oldPassword, newPassword),
    onSuccess: () => {
      setPassError(null)
      setPassSaved(true)
      setPassTouched(false)
      setOldPassword('')
      setNewPassword('')
      setNewPassword2('')
      updateStaff({ forcePasswordChange: false })
    },
    onError: (err) => setPassError(apiErrorMessage(err, t)),
  })

  const approve = useMutation({
    mutationFn: (id: string) => adminPhoneRequestsApi.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'phone-requests'] }),
  })
  const reject = useMutation({
    mutationFn: (id: string) => adminPhoneRequestsApi.reject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'phone-requests'] }),
  })

  function handleSavePassword() {
    setPassTouched(true)
    if (!oldPassword || newPassword.length < 8 || newPassword !== newPassword2) return
    savePassword.mutate()
  }

  return (
    <div>
      <PageHeader title={t('admin.pages.account.title')} subtitle={t('admin.pages.account.sub')} />

      {staff?.forcePasswordChange && <Notice tone="info">{t('admin.forcePasswordNotice')}</Notice>}

      <div className="mt-7 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <FormCard title={t('admin.forms.name.title')} sub={t('admin.forms.name.sub')}>
          <TextField label={t('admin.fields.name')} value={name} onChange={setName} />
          {nameError && <Notice tone="error">{nameError}</Notice>}
          {nameSaved && <Notice>{t('admin.saved')}</Notice>}
          <PrimaryButton label={t('admin.save')} onClick={() => saveName.mutate()} disabled={saveName.isPending} />
        </FormCard>

        <FormCard title={t('admin.forms.phone.title')} sub={t('admin.forms.phone.sub')}>
          <TextField label={t('admin.fields.phone')} value={staff?.phone ?? ''} onChange={() => {}} />
          <TextField label={t('admin.fields.newPhone')} value={newPhone} onChange={setNewPhone} type="tel" />
          {phoneError && <Notice tone="error">{phoneError}</Notice>}
          {phoneSent && <Notice>{t('admin.messages.phoneRequestSent')}</Notice>}
          <PrimaryButton label={t('admin.actions.request')} onClick={() => requestPhone.mutate()} disabled={requestPhone.isPending || !newPhone} />

          {(myRequests.data?.items ?? []).filter((r) => r.status === 'pending').length > 0 && (
            <div className="mt-2 border-t border-ink-50 pt-4 text-[13px] text-ink-500">
              {myRequests.data!.items
                .filter((r) => r.status === 'pending')
                .map((r) => (
                  <div key={r.id}>→ {r.newPhone} ({t('admin.status.pending')})</div>
                ))}
            </div>
          )}
        </FormCard>

        <FormCard title={t('admin.forms.pass.title')} sub={t('admin.forms.pass.sub')}>
          <TextField
            label={t('admin.fields.oldPass')}
            type="password"
            value={oldPassword}
            onChange={setOldPassword}
            error={passTouched && !oldPassword ? t('contact.form.required') : undefined}
          />
          <TextField
            label={t('admin.fields.newPass')}
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            error={passTouched && newPassword.length < 8 ? t('contact.form.required') : undefined}
          />
          <TextField
            label={t('admin.fields.newPass2')}
            type="password"
            value={newPassword2}
            onChange={setNewPassword2}
            error={passTouched && newPassword2 !== newPassword ? t('contact.form.required') : undefined}
          />
          {passError && <Notice tone="error">{passError}</Notice>}
          {passSaved && <Notice>{t('admin.saved')}</Notice>}
          <PrimaryButton label={t('admin.save')} onClick={handleSavePassword} disabled={savePassword.isPending} />
        </FormCard>
      </div>

      {staff?.role === 'admin' && (
        <div className="mt-6">
          <FormCard title={t('admin.messages.pendingRequests')}>
            {(pendingReview.data?.items ?? []).map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-3 border-t border-ink-50 pt-3 first:border-t-0 first:pt-0">
                <div className="text-[14px] text-ink-900">
                  {r.staff?.fullName} ({r.staff?.phone}) → <span className="font-mono">{r.newPhone}</span>
                </div>
                <div className="ml-auto flex gap-2">
                  <ActionButton label={t('admin.actions.approve')} kind="primary" onClick={() => approve.mutate(r.id)} disabled={approve.isPending} />
                  <ActionButton label={t('admin.actions.reject')} kind="danger" onClick={() => reject.mutate(r.id)} disabled={reject.isPending} />
                </div>
              </div>
            ))}
            {pendingReview.data && pendingReview.data.items.length === 0 && <div className="text-ink-400">{t('common.empty')}</div>}
          </FormCard>
        </div>
      )}
    </div>
  )
}
