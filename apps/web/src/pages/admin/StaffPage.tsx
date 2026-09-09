import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AdminBadge, AdminCell, AdminTable, AdminTableRow, ActionButton, FormCard, TextField, PrimaryButton, Notice } from '../../components/admin/ui'
import { PageHeader, BlockedBanner } from '../../components/admin/PageHeader'
import { adminStaffApi } from '../../lib/adminApi'
import { apiErrorMessage } from '../../lib/errorMessage'
import { useAdminAuth } from '../../store/adminAuth'

export default function AdminStaffPage() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const me = useAdminAuth((s) => s.staff)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'staff' | 'admin'>('staff')
  const [error, setError] = useState<string | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [resetPhoneTarget, setResetPhoneTarget] = useState<string | null>(null)
  const [resetPhoneValue, setResetPhoneValue] = useState('')

  const staff = useQuery({ queryKey: ['admin', 'staff'], queryFn: adminStaffApi.list })
  const log = useQuery({ queryKey: ['admin', 'staff', 'reset-log'], queryFn: adminStaffApi.resetLog })
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] })
  }

  const create = useMutation({
    mutationFn: () => adminStaffApi.create({ fullName: name, phone, role }),
    onSuccess: (res) => {
      setError(null)
      setTempPassword(res.tempPassword)
      setName('')
      setPhone('')
      invalidate()
    },
    onError: (err) => setError(apiErrorMessage(err, t)),
  })

  const resetPassword = useMutation({
    mutationFn: (id: string) => adminStaffApi.resetPassword(id),
    onSuccess: (res) => {
      setTempPassword(res.tempPassword)
      invalidate()
    },
  })
  const resetPhone = useMutation({
    mutationFn: () => adminStaffApi.resetPhone(resetPhoneTarget!, resetPhoneValue),
    onSuccess: () => {
      setResetPhoneTarget(null)
      setResetPhoneValue('')
      invalidate()
    },
    onError: (err) => setError(apiErrorMessage(err, t)),
  })
  const suspend = useMutation({ mutationFn: (id: string) => adminStaffApi.suspend(id), onSuccess: invalidate })

  return (
    <div>
      <PageHeader title={t('admin.pages.staff.title')} subtitle={t('admin.pages.staff.sub')} />
      <BlockedBanner message={t('admin.notes.staff')} />

      <AdminTable
        columns={[
          { label: t('admin.cols.name'), flex: 1.4 },
          { label: t('admin.cols.phone'), flex: 1 },
          { label: t('admin.cols.role'), flex: 0.8 },
          { label: t('admin.cols.status'), flex: 0.8 },
          { label: t('admin.cols.action'), flex: 1.8 },
        ]}
      >
        {(staff.data?.items ?? []).map((s) => (
          <AdminTableRow
            key={s.id}
            actions={
              <>
                <ActionButton
                  label={t('admin.actions.resetPhone')}
                  onClick={() => {
                    setResetPhoneTarget(s.id)
                    setResetPhoneValue('')
                  }}
                />
                <ActionButton label={t('admin.actions.resetPass')} kind="primary" onClick={() => resetPassword.mutate(s.id)} disabled={resetPassword.isPending} />
                {s.id !== me?.id && (
                  <ActionButton
                    label={t(s.status === 'active' ? 'admin.actions.suspend' : 'admin.actions.unsuspend')}
                    kind="danger"
                    onClick={() => suspend.mutate(s.id)}
                    disabled={suspend.isPending}
                  />
                )}
              </>
            }
          >
            <AdminCell flex={1.4} strong>
              {s.fullName}
            </AdminCell>
            <AdminCell flex={1} mono dim>
              {s.phone}
            </AdminCell>
            <AdminCell flex={0.8}>
              <AdminBadge label={t(s.role === 'admin' ? 'admin.roleAdmin' : 'admin.roleStaff')} tone={s.role === 'admin' ? 'warn' : 'ok'} />
            </AdminCell>
            <AdminCell flex={0.8}>
              <AdminBadge label={t(s.status === 'active' ? 'admin.status.active' : 'admin.status.suspended')} tone={s.status === 'active' ? 'ok' : 'bad'} />
            </AdminCell>
          </AdminTableRow>
        ))}
      </AdminTable>

      {resetPhoneTarget && (
        <div className="mt-6 max-w-[420px]">
          <FormCard title={t('admin.actions.resetPhone')}>
            <TextField label={t('admin.fields.newPhone')} value={resetPhoneValue} onChange={setResetPhoneValue} type="tel" />
            {error && <Notice tone="error">{error}</Notice>}
            <PrimaryButton label={t('admin.save')} onClick={() => resetPhone.mutate()} disabled={resetPhone.isPending || !resetPhoneValue} />
          </FormCard>
        </div>
      )}

      {tempPassword && (
        <div className="mt-6 max-w-[420px]">
          <Notice tone="info">
            {t('admin.messages.tempPasswordNote')}: <span className="font-mono font-bold">{tempPassword}</span>
          </Notice>
        </div>
      )}

      <div className="mt-6 max-w-[420px]">
        <FormCard title={t('admin.forms.staff.title')} sub={t('admin.forms.staff.sub')}>
          <TextField label={t('admin.fields.name')} value={name} onChange={setName} />
          <TextField label={t('admin.fields.phone')} value={phone} onChange={setPhone} type="tel" />
          <div>
            <div className="text-[13px] font-semibold text-ink-700">{t('admin.role')}</div>
            <div className="mt-2.5 flex gap-2">
              {(['staff', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-full px-5 py-2.5 text-[13px] font-semibold ${role === r ? 'bg-ink-900 text-white' : 'border border-ink-100 bg-white text-ink-500'}`}
                >
                  {t(r === 'admin' ? 'admin.roleAdmin' : 'admin.roleStaff')}
                </button>
              ))}
            </div>
          </div>
          {error && !resetPhoneTarget && <Notice tone="error">{error}</Notice>}
          <PrimaryButton label={t('admin.actions.addStaff')} onClick={() => create.mutate()} disabled={create.isPending || !name || !phone} />
        </FormCard>
      </div>

      <div className="mt-6">
        <FormCard title={t('admin.resetLog.title')} sub={t('admin.resetLog.sub')}>
          {(log.data?.items ?? []).map((l) => (
            <div key={l.id} className="border-t border-ink-50 pt-3 first:border-t-0 first:pt-0">
              <div className="text-[13px] text-ink-400">{new Date(l.createdAt).toLocaleString(i18n.language)}</div>
              <div className="mt-1 text-[14px] text-ink-900">
                {t(`admin.resetLog.${l.action}`, { defaultValue: l.action })} — {l.staffName} ({l.staffPhone})
              </div>
              <div className="mt-0.5 text-[12.5px] text-ink-400">
                {t('admin.resetLog.by')} {l.performedByName}
              </div>
            </div>
          ))}
          {log.data && log.data.items.length === 0 && <div className="text-ink-400">{t('common.empty')}</div>}
        </FormCard>
      </div>
    </div>
  )
}
