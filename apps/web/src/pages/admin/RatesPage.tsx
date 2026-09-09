import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AdminCell, AdminTable, AdminTableRow, ActionButton, FormCard, TextField, PrimaryButton, Notice } from '../../components/admin/ui'
import { PageHeader, BlockedBanner } from '../../components/admin/PageHeader'
import { adminRatesApi } from '../../lib/adminApi'
import { apiErrorMessage } from '../../lib/errorMessage'
import { pickLang } from '../../lib/localize'
import { formatMoney } from '../../lib/format'

export default function AdminRatesPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const queryClient = useQueryClient()
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [price, setPrice] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const rates = useQuery({ queryKey: ['admin', 'rates'], queryFn: adminRatesApi.list })

  const save = useMutation({
    mutationFn: () => adminRatesApi.update(editingKey!, { price }),
    onSuccess: () => {
      setError(null)
      setSaved(true)
      queryClient.invalidateQueries({ queryKey: ['admin', 'rates'] })
    },
    onError: (err) => setError(apiErrorMessage(err, t)),
  })

  const editing = rates.data?.rates.find((r) => r.key === editingKey)

  return (
    <div>
      <PageHeader title={t('admin.pages.rates.title')} subtitle={t('admin.pages.rates.sub')} />
      <BlockedBanner message={t('admin.notes.rates')} />

      <AdminTable
        columns={[
          { label: t('admin.cols.kind'), flex: 1.6 },
          { label: t('admin.cols.unit'), flex: 0.7 },
          { label: t('admin.cols.price'), flex: 1 },
          { label: t('admin.cols.action'), flex: 0.8 },
        ]}
      >
        {(rates.data?.rates ?? []).map((r) => (
          <AdminTableRow
            key={r.key}
            actions={
              <ActionButton
                label={t('admin.actions.edit')}
                kind={editingKey === r.key ? 'primary' : 'default'}
                onClick={() => {
                  setEditingKey(r.key)
                  setPrice(r.price)
                  setSaved(false)
                }}
              />
            }
          >
            <AdminCell flex={1.6} strong>
              {pickLang(lang, { lo: r.nameLo, zh: r.nameZh, en: r.nameEn })}
            </AdminCell>
            <AdminCell flex={0.7} dim mono>
              {r.unit}
            </AdminCell>
            <AdminCell flex={1}>{formatMoney(r.price, r.currency)}</AdminCell>
          </AdminTableRow>
        ))}
      </AdminTable>

      {editing && (
        <div className="mt-6 max-w-[420px]">
          <FormCard title={t('admin.forms.rate.title')} sub={t('admin.forms.rate.sub')}>
            <TextField label={pickLang(lang, { lo: editing.nameLo, zh: editing.nameZh, en: editing.nameEn })} value={price} onChange={setPrice} type="number" />
            {error && <Notice tone="error">{error}</Notice>}
            {saved && <Notice>{t('admin.saved')}</Notice>}
            <PrimaryButton label={t('admin.save')} onClick={() => save.mutate()} disabled={save.isPending} />
          </FormCard>
        </div>
      )}
    </div>
  )
}
