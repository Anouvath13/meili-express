import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormCard, TextField, PrimaryButton, Notice } from '../../components/admin/ui'
import { PageHeader } from '../../components/admin/PageHeader'
import { adminConfigApi } from '../../lib/adminApi'
import { apiErrorMessage } from '../../lib/errorMessage'

const KEYS = [
  'points_per_kg',
  'min_weight_kg',
  'discount_cap_pct',
  'point_value',
  'points_expiry_month',
  'points_expiry_day',
  'referral_bonus_referrer',
  'referral_bonus_referee',
  'referee_unlock_threshold_kg',
] as const;

export default function AdminPointsConfigPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [values, setValues] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const config = useQuery({ queryKey: ['admin', 'points-config'], queryFn: adminConfigApi.pointsConfig })

  useEffect(() => {
    if (config.data) {
      setValues(Object.fromEntries(config.data.items.map((c) => [c.configKey, c.configValue])))
    }
  }, [config.data])

  const save = useMutation({
    mutationFn: () => adminConfigApi.updatePointsConfig(values),
    onSuccess: () => {
      setError(null)
      setSaved(true)
      queryClient.invalidateQueries({ queryKey: ['admin', 'points-config'] })
    },
    onError: (err) => setError(apiErrorMessage(err, t)),
  })

  return (
    <div>
      <PageHeader title={t('admin.pages.points.title')} subtitle={t('admin.pages.points.sub')} />
      <div className="mt-7 max-w-[520px]">
        <FormCard title={t('admin.forms.points.title')} sub={t('admin.forms.points.sub')}>
          {KEYS.map((key) => (
            <TextField
              key={key}
              label={t(`admin.pointsFields.${key}`)}
              value={values[key] ?? ''}
              onChange={(v) => setValues((prev) => ({ ...prev, [key]: v }))}
            />
          ))}
          {error && <Notice tone="error">{error}</Notice>}
          {saved && <Notice>{t('admin.saved')}</Notice>}
          <PrimaryButton label={t('admin.save')} onClick={() => save.mutate()} disabled={save.isPending} />
        </FormCard>
      </div>
    </div>
  )
}
