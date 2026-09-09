import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AdminCell, AdminTable, AdminTableRow, ActionButton, FormCard, TextField, PrimaryButton, Notice } from '../../components/admin/ui'
import { PageHeader } from '../../components/admin/PageHeader'
import { adminNotificationsApi } from '../../lib/adminApi'
import { apiErrorMessage } from '../../lib/errorMessage'

export default function AdminNotifPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [bodyWeb, setBodyWeb] = useState('')
  const [bodyWhatsapp, setBodyWhatsapp] = useState('')
  const [testPhone, setTestPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [testSent, setTestSent] = useState(false)

  const templates = useQuery({ queryKey: ['admin', 'notification-templates'], queryFn: adminNotificationsApi.list })

  function startEdit(id: string) {
    const tpl = templates.data?.templates.find((x) => x.id === id)
    if (!tpl) return
    setEditingId(id)
    setTitle(tpl.title)
    setBodyWeb(tpl.bodyWeb)
    setBodyWhatsapp(tpl.bodyWhatsapp)
    setSaved(false)
    setTestSent(false)
    setError(null)
  }

  const save = useMutation({
    mutationFn: () => adminNotificationsApi.update(editingId!, { title, bodyWeb, bodyWhatsapp }),
    onSuccess: () => {
      setError(null)
      setSaved(true)
      queryClient.invalidateQueries({ queryKey: ['admin', 'notification-templates'] })
    },
    onError: (err) => setError(apiErrorMessage(err, t)),
  })

  const sendTest = useMutation({
    mutationFn: () => adminNotificationsApi.sendTest(editingId!, testPhone),
    onSuccess: () => setTestSent(true),
    onError: (err) => setError(apiErrorMessage(err, t)),
  })

  return (
    <div>
      <PageHeader title={t('admin.pages.notif.title')} subtitle={t('admin.pages.notif.sub')} />

      <AdminTable columns={[{ label: 'KEY', flex: 1 }, { label: t('admin.cols.title'), flex: 1.8 }, { label: t('admin.cols.action'), flex: 0.8 }]}>
        {(templates.data?.templates ?? []).map((n) => (
          <AdminTableRow key={n.id} actions={<ActionButton label={t('admin.actions.edit')} kind={editingId === n.id ? 'primary' : 'default'} onClick={() => startEdit(n.id)} />}>
            <AdminCell flex={1} mono strong>
              {n.templateKey}
            </AdminCell>
            <AdminCell flex={1.8} dim>
              {n.title}
            </AdminCell>
          </AdminTableRow>
        ))}
      </AdminTable>

      {editingId && (
        <div className="mt-6 max-w-[520px]">
          <FormCard title={t('admin.forms.notif.title')} sub={t('admin.forms.notif.sub')}>
            <TextField label={t('admin.cols.title')} value={title} onChange={setTitle} />
            <TextField label="Web" value={bodyWeb} onChange={setBodyWeb} area />
            <TextField label="WhatsApp" value={bodyWhatsapp} onChange={setBodyWhatsapp} area />
            {error && <Notice tone="error">{error}</Notice>}
            {saved && <Notice>{t('admin.saved')}</Notice>}
            <PrimaryButton label={t('admin.save')} onClick={() => save.mutate()} disabled={save.isPending} />

            <div className="mt-2 flex items-end gap-3 border-t border-ink-50 pt-5">
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-ink-700">{t('admin.fields.phone')}</div>
                <input
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="mt-2.5 w-full rounded-[14px] border border-ink-100 px-4 py-3 text-[15px] outline-none"
                />
              </div>
              <ActionButton label={t('admin.actions.sendTest')} onClick={() => sendTest.mutate()} disabled={sendTest.isPending || !testPhone} />
            </div>
            {testSent && <Notice>{t('admin.saved')}</Notice>}
          </FormCard>
        </div>
      )}
    </div>
  )
}
