import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AdminBadge, AdminCell, AdminTable, AdminTableRow, ActionButton, FilterPills } from '../../components/admin/ui'
import { PageHeader } from '../../components/admin/PageHeader'
import { adminReferralsApi } from '../../lib/adminApi'

const STATUS_FILTER = [undefined, 'pending', 'flagged'] as const;

export default function AdminReferralPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState(0)

  const referrals = useQuery({ queryKey: ['admin', 'referrals', filter], queryFn: () => adminReferralsApi.list(STATUS_FILTER[filter]) })

  const approve = useMutation({
    mutationFn: (id: string) => adminReferralsApi.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'referrals'] }),
  })
  const suspend = useMutation({
    mutationFn: (id: string) => adminReferralsApi.suspend(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'referrals'] }),
  })

  return (
    <div>
      <PageHeader title={t('admin.pages.referral.title')} subtitle={t('admin.pages.referral.sub')} />
      <div className="mt-7">
        <FilterPills options={t('admin.filters.referral', { returnObjects: true }) as string[]} active={filter} onChange={setFilter} />
      </div>

      <AdminTable
        columns={[
          { label: t('admin.cols.code'), flex: 1 },
          { label: t('admin.cols.owner'), flex: 1 },
          { label: t('admin.cols.invited'), flex: 1 },
          { label: t('admin.cols.kg'), flex: 0.7 },
          { label: t('admin.cols.status'), flex: 1 },
          { label: t('admin.cols.action'), flex: 1.2 },
        ]}
      >
        {(referrals.data?.items ?? []).map((r) => (
          <AdminTableRow
            key={r.id}
            actions={
              <>
                <ActionButton label={t('admin.actions.approve')} kind="primary" onClick={() => approve.mutate(r.id)} disabled={approve.isPending} />
                <ActionButton label={t('admin.actions.suspend')} kind="danger" onClick={() => suspend.mutate(r.id)} disabled={suspend.isPending} />
              </>
            }
          >
            <AdminCell flex={1} mono strong>
              {r.referralCode}
            </AdminCell>
            <AdminCell flex={1} mono dim>
              {r.referrerPhone}
            </AdminCell>
            <AdminCell flex={1} mono dim>
              {r.refereePhone}
            </AdminCell>
            <AdminCell flex={0.7}>{Number(r.cumulativeKg).toFixed(1)} kg</AdminCell>
            <AdminCell flex={1}>
              <AdminBadge
                label={t(`admin.status.${r.status === 'unlocked' ? 'unlocked' : r.status === 'flagged' ? 'flagged' : 'locked'}`)}
                tone={r.status === 'unlocked' ? 'ok' : r.status === 'flagged' ? 'bad' : 'warn'}
              />
            </AdminCell>
          </AdminTableRow>
        ))}
        {referrals.data && referrals.data.items.length === 0 && <div className="px-6 py-8 text-center text-ink-400">{t('common.empty')}</div>}
      </AdminTable>
    </div>
  )
}
