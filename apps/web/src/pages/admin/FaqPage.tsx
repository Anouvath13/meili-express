import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AdminBadge, AdminCell, AdminTable, AdminTableRow, ActionButton, FormCard, TextField, PrimaryButton, Notice } from '../../components/admin/ui'
import { PageHeader } from '../../components/admin/PageHeader'
import { adminFaqApi } from '../../lib/adminApi'
import { apiErrorMessage } from '../../lib/errorMessage'
import { pickLang } from '../../lib/localize'

const EMPTY = { categoryId: '', questionLo: '', questionZh: '', questionEn: '', answerLo: '', answerZh: '', answerEn: '' }

export default function AdminFaqPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const categories = useQuery({ queryKey: ['admin', 'faq', 'categories'], queryFn: adminFaqApi.categories })
  const faqs = useQuery({ queryKey: ['admin', 'faqs'], queryFn: adminFaqApi.list })

  const set = (k: keyof typeof EMPTY) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  const categoryName = (categoryId: string) => {
    const c = categories.data?.categories.find((cat) => cat.id === categoryId)
    return c ? pickLang(lang, { lo: c.nameLo, zh: c.nameZh, en: c.nameEn }) : '—'
  }

  function startNew() {
    setEditingId(null)
    setForm({ ...EMPTY, categoryId: categories.data?.categories[0]?.id ?? '' })
    setSaved(false)
    setError(null)
  }

  function startEdit(id: string) {
    const item = faqs.data?.items.find((f) => f.id === id)
    if (!item) return
    setEditingId(id)
    setForm({
      categoryId: item.categoryId,
      questionLo: item.questionLo,
      questionZh: item.questionZh,
      questionEn: item.questionEn,
      answerLo: item.answerLo,
      answerZh: item.answerZh,
      answerEn: item.answerEn,
    })
    setSaved(false)
    setError(null)
  }

  const save = useMutation({
    mutationFn: () => (editingId ? adminFaqApi.update(editingId, form) : adminFaqApi.create({ ...form, isPublished: true, needsReview: false })),
    onSuccess: () => {
      setError(null)
      setSaved(true)
      queryClient.invalidateQueries({ queryKey: ['admin', 'faqs'] })
    },
    onError: (err) => setError(apiErrorMessage(err, t)),
  })

  const remove = useMutation({
    mutationFn: (id: string) => adminFaqApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'faqs'] })
      if (editingId) startNew()
    },
  })

  return (
    <div>
      <PageHeader
        title={t('admin.pages.faq.title')}
        subtitle={t('admin.pages.faq.sub')}
        action={<PrimaryButton label={t('admin.actions.addFaq')} onClick={startNew} />}
      />

      <AdminTable
        columns={[
          { label: t('admin.cols.question'), flex: 2 },
          { label: t('admin.cols.cat'), flex: 1 },
          { label: t('admin.cols.status'), flex: 0.8 },
          { label: t('admin.cols.action'), flex: 1 },
        ]}
      >
        {(faqs.data?.items ?? []).map((f) => (
          <AdminTableRow
            key={f.id}
            actions={
              <>
                <ActionButton label={t('admin.actions.edit')} kind={editingId === f.id ? 'primary' : 'default'} onClick={() => startEdit(f.id)} />
                <ActionButton label={t('admin.actions.del')} kind="danger" onClick={() => remove.mutate(f.id)} disabled={remove.isPending} />
              </>
            }
          >
            <AdminCell flex={2} strong>
              {lang === 'zh' ? f.questionZh : lang === 'en' ? f.questionEn : f.questionLo}
              {f.needsReview && <span className="ml-2 text-[11px] text-brand-800">(needs review)</span>}
            </AdminCell>
            <AdminCell flex={1} dim>
              {categoryName(f.categoryId)}
            </AdminCell>
            <AdminCell flex={0.8}>
              <AdminBadge label={t(f.isPublished ? 'admin.status.live' : 'admin.status.draft')} tone={f.isPublished ? 'ok' : 'warn'} />
            </AdminCell>
          </AdminTableRow>
        ))}
      </AdminTable>

      <div className="mt-6 max-w-[560px]">
        <FormCard title={t('admin.forms.faq.title')} sub={t('admin.forms.faq.sub')}>
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
          <TextField label={t('admin.f.questionLo')} value={form.questionLo} onChange={set('questionLo')} />
          <TextField label={t('admin.f.questionZh')} value={form.questionZh} onChange={set('questionZh')} />
          <TextField label={t('admin.f.questionEn')} value={form.questionEn} onChange={set('questionEn')} />
          <TextField label={t('admin.f.answerLo')} value={form.answerLo} onChange={set('answerLo')} area />
          <TextField label={t('admin.f.answerZh')} value={form.answerZh} onChange={set('answerZh')} area />
          <TextField label={t('admin.f.answerEn')} value={form.answerEn} onChange={set('answerEn')} area />
          {error && <Notice tone="error">{error}</Notice>}
          {saved && <Notice>{t('admin.saved')}</Notice>}
          <PrimaryButton label={editingId ? t('admin.save') : t('admin.actions.addFaq')} onClick={() => save.mutate()} disabled={save.isPending} />
        </FormCard>
      </div>
    </div>
  )
}
