import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AdminBadge, AdminCell, AdminTable, AdminTableRow, ActionButton, FormCard, TextField, PrimaryButton, Notice } from '../../components/admin/ui'
import { PageHeader } from '../../components/admin/PageHeader'
import { adminNewsApi } from '../../lib/adminApi'
import { apiErrorMessage } from '../../lib/errorMessage'

const EMPTY = { categoryId: '', titleLo: '', titleZh: '', titleEn: '', bodyLo: '', bodyZh: '', bodyEn: '' }

export default function AdminNewsPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const categories = useQuery({ queryKey: ['admin', 'news', 'categories'], queryFn: adminNewsApi.categories })
  const news = useQuery({ queryKey: ['admin', 'news'], queryFn: adminNewsApi.list })

  const set = (k: keyof typeof EMPTY) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  function startNew() {
    setEditingId(null)
    setForm({ ...EMPTY, categoryId: categories.data?.categories[0]?.id ?? '' })
    setSaved(false)
    setError(null)
  }

  function startEdit(id: string) {
    const article = news.data?.items.find((n) => n.id === id)
    if (!article) return
    setEditingId(id)
    setForm({
      categoryId: article.categoryId,
      titleLo: article.titleLo,
      titleZh: article.titleZh,
      titleEn: article.titleEn,
      bodyLo: article.bodyLo,
      bodyZh: article.bodyZh,
      bodyEn: article.bodyEn,
    })
    setSaved(false)
    setError(null)
  }

  const save = useMutation({
    mutationFn: () => (editingId ? adminNewsApi.update(editingId, form) : adminNewsApi.create({ ...form, isPublished: true })),
    onSuccess: () => {
      setError(null)
      setSaved(true)
      queryClient.invalidateQueries({ queryKey: ['admin', 'news'] })
    },
    onError: (err) => setError(apiErrorMessage(err, t)),
  })

  const remove = useMutation({
    mutationFn: (id: string) => adminNewsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'news'] })
      if (editingId) startNew()
    },
  })

  return (
    <div>
      <PageHeader
        title={t('admin.pages.news.title')}
        subtitle={t('admin.pages.news.sub')}
        action={<PrimaryButton label={t('admin.actions.addNews')} onClick={startNew} />}
      />

      <AdminTable
        columns={[
          { label: t('admin.cols.title'), flex: 1.8 },
          { label: t('admin.cols.cat'), flex: 1 },
          { label: t('admin.cols.status'), flex: 0.8 },
          { label: t('admin.cols.action'), flex: 1 },
        ]}
      >
        {(news.data?.items ?? []).map((n) => (
          <AdminTableRow
            key={n.id}
            actions={
              <>
                <ActionButton label={t('admin.actions.edit')} kind={editingId === n.id ? 'primary' : 'default'} onClick={() => startEdit(n.id)} />
                <ActionButton label={t('admin.actions.del')} kind="danger" onClick={() => remove.mutate(n.id)} disabled={remove.isPending} />
              </>
            }
          >
            <AdminCell flex={1.8} strong>
              {lang === 'zh' ? n.titleZh : lang === 'en' ? n.titleEn : n.titleLo}
            </AdminCell>
            <AdminCell flex={1} dim>
              {n.category.key}
            </AdminCell>
            <AdminCell flex={0.8}>
              <AdminBadge label={t(n.isPublished ? 'admin.status.live' : 'admin.status.draft')} tone={n.isPublished ? 'ok' : 'warn'} />
            </AdminCell>
          </AdminTableRow>
        ))}
      </AdminTable>

      <div className="mt-6 max-w-[560px]">
        <FormCard title={t('admin.forms.news.title')} sub={t('admin.forms.news.sub')}>
          <div>
            <div className="text-[13px] font-semibold text-ink-700">{t('admin.cols.cat')}</div>
            <select
              value={form.categoryId}
              onChange={(e) => set('categoryId')(e.target.value)}
              className="mt-2.5 w-full rounded-[14px] border border-ink-100 px-4 py-3 text-[15px] outline-none"
            >
              {(categories.data?.categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameEn} / {c.nameLo}
                </option>
              ))}
            </select>
          </div>
          <TextField label={t('admin.f.titleLo')} value={form.titleLo} onChange={set('titleLo')} />
          <TextField label={t('admin.f.titleZh')} value={form.titleZh} onChange={set('titleZh')} />
          <TextField label={t('admin.f.titleEn')} value={form.titleEn} onChange={set('titleEn')} />
          <TextField label={t('admin.f.bodyLo')} value={form.bodyLo} onChange={set('bodyLo')} area />
          <TextField label={t('admin.f.bodyZh')} value={form.bodyZh} onChange={set('bodyZh')} area />
          <TextField label={t('admin.f.bodyEn')} value={form.bodyEn} onChange={set('bodyEn')} area />
          {error && <Notice tone="error">{error}</Notice>}
          {saved && <Notice>{t('admin.saved')}</Notice>}
          <PrimaryButton label={editingId ? t('admin.save') : t('admin.actions.addNews')} onClick={() => save.mutate()} disabled={save.isPending} />
        </FormCard>
      </div>
    </div>
  )
}
