import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AdminBadge, AdminCell, AdminTable, AdminTableRow, ActionButton, FormCard, TextField, PrimaryButton, Notice } from '../../components/admin/ui'
import { PageHeader } from '../../components/admin/PageHeader'
import { adminReviewsApi } from '../../lib/adminApi'
import { apiErrorMessage } from '../../lib/errorMessage'

const EMPTY = { authorName: '', stars: '5', quoteLo: '', quoteZh: '', quoteEn: '' }

export default function AdminReviewsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const reviews = useQuery({ queryKey: ['admin', 'reviews'], queryFn: adminReviewsApi.list })
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] })

  const set = (k: keyof typeof EMPTY) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  function startNew() {
    setEditingId(null)
    setForm(EMPTY)
    setSaved(false)
    setError(null)
  }

  function startEdit(id: string) {
    const r = reviews.data?.reviews.find((x) => x.id === id)
    if (!r) return
    setEditingId(id)
    setForm({ authorName: r.authorName, stars: String(r.stars), quoteLo: r.quoteLo ?? '', quoteZh: r.quoteZh ?? '', quoteEn: r.quoteEn ?? '' })
    setSaved(false)
    setError(null)
  }

  const save = useMutation({
    mutationFn: () => {
      const data = { ...form, stars: Number(form.stars) }
      return editingId ? adminReviewsApi.update(editingId, data) : adminReviewsApi.create(data)
    },
    onSuccess: () => {
      setError(null)
      setSaved(true)
      invalidate()
    },
    onError: (err) => setError(apiErrorMessage(err, t)),
  })
  const remove = useMutation({
    mutationFn: (id: string) => adminReviewsApi.remove(id),
    onSuccess: () => {
      invalidate()
      if (editingId) startNew()
    },
  })
  const approve = useMutation({ mutationFn: (id: string) => adminReviewsApi.approve(id), onSuccess: invalidate })
  const hide = useMutation({ mutationFn: (id: string) => adminReviewsApi.hide(id), onSuccess: invalidate })

  return (
    <div>
      <PageHeader
        title={t('admin.pages.reviews.title')}
        subtitle={t('admin.pages.reviews.sub')}
        action={<PrimaryButton label={t('admin.actions.addReview')} onClick={startNew} />}
      />

      <AdminTable
        columns={[
          { label: t('admin.cols.who'), flex: 1 },
          { label: t('admin.cols.stars'), flex: 0.6 },
          { label: t('admin.cols.title'), flex: 2 },
          { label: t('admin.cols.status'), flex: 1 },
          { label: t('admin.cols.action'), flex: 1.6 },
        ]}
      >
        {(reviews.data?.reviews ?? []).map((r) => (
          <AdminTableRow
            key={r.id}
            actions={
              <>
                <ActionButton label={t('admin.actions.approve')} kind="primary" onClick={() => approve.mutate(r.id)} disabled={approve.isPending} />
                <ActionButton label={t('admin.actions.hide')} onClick={() => hide.mutate(r.id)} disabled={hide.isPending} />
                <ActionButton label={t('admin.actions.edit')} kind={editingId === r.id ? 'primary' : 'default'} onClick={() => startEdit(r.id)} />
                <ActionButton label={t('admin.actions.del')} kind="danger" onClick={() => remove.mutate(r.id)} disabled={remove.isPending} />
              </>
            }
          >
            <AdminCell flex={1} mono dim>
              {r.authorName}
            </AdminCell>
            <AdminCell flex={0.6} strong>
              {'★'.repeat(r.stars)}
            </AdminCell>
            <AdminCell flex={2} dim>
              {r.quoteEn ?? r.quoteLo ?? '—'}
            </AdminCell>
            <AdminCell flex={1}>
              <AdminBadge
                label={t(`admin.status.${r.status}`)}
                tone={r.status === 'approved' ? 'ok' : r.status === 'hidden' ? 'bad' : 'warn'}
              />
            </AdminCell>
          </AdminTableRow>
        ))}
      </AdminTable>

      <div className="mt-6 max-w-[520px]">
        <FormCard title={t('admin.forms.review.title')} sub={t('admin.forms.review.sub')}>
          <TextField label={t('admin.f.authorName')} value={form.authorName} onChange={set('authorName')} />
          <TextField label={t('admin.f.stars')} value={form.stars} onChange={set('stars')} type="number" />
          <TextField label={t('admin.f.quoteLo')} value={form.quoteLo} onChange={set('quoteLo')} area />
          <TextField label={t('admin.f.quoteZh')} value={form.quoteZh} onChange={set('quoteZh')} area />
          <TextField label={t('admin.f.quoteEn')} value={form.quoteEn} onChange={set('quoteEn')} area />
          {error && <Notice tone="error">{error}</Notice>}
          {saved && <Notice>{t('admin.saved')}</Notice>}
          <PrimaryButton label={editingId ? t('admin.save') : t('admin.actions.addReview')} onClick={() => save.mutate()} disabled={save.isPending} />
        </FormCard>
      </div>
    </div>
  )
}
