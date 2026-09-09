import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SHIPMENT_STATUS } from '@meili/shared'
import { AdminBadge, AdminCell, AdminTable, AdminTableRow, ActionButton, FilterPills, FormCard, TextField, PrimaryButton, Notice } from '../../components/admin/ui'
import { PageHeader } from '../../components/admin/PageHeader'
import { adminBillsApi, type ShipmentStatus } from '../../lib/adminApi'
import { apiErrorMessage } from '../../lib/errorMessage'
import { formatKip } from '../../lib/format'
import { isPaid } from '../../lib/shipmentStatus'

export default function AdminBillsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [weight, setWeight] = useState('')
  const [price, setPrice] = useState('')
  const [status, setStatus] = useState<ShipmentStatus>('received_from_china')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [newBillNo, setNewBillNo] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [createdMsg, setCreatedMsg] = useState<string | null>(null)

  const bills = useQuery({ queryKey: ['admin', 'bills'], queryFn: () => adminBillsApi.list() })
  const filtered = (bills.data?.items ?? []).filter((b) => filter === 0 || (filter === 1 ? !isPaid(b.status) : isPaid(b.status)))

  const create = useMutation({
    mutationFn: () => adminBillsApi.create({ billNumber: newBillNo, customerPhone: newPhone }),
    onSuccess: (res) => {
      setCreateError(null)
      setCreatedMsg(res.billNumber)
      setNewBillNo('')
      setNewPhone('')
      queryClient.invalidateQueries({ queryKey: ['admin', 'bills'] })
    },
    onError: (err) => setCreateError(apiErrorMessage(err, t)),
  })

  const save = useMutation({
    mutationFn: async () => {
      if (!editingId) return
      if (weight || price) {
        await adminBillsApi.update(editingId, { ...(weight ? { weightKg: Number(weight) } : {}), ...(price ? { price: Number(price) } : {}) })
      }
      return adminBillsApi.setStatus(editingId, status)
    },
    onSuccess: (res) => {
      setError(null)
      if (res?.pointsAwarded) setNotice(`+${res.pointsAwarded} points awarded`)
      else setNotice(t('admin.saved'))
      queryClient.invalidateQueries({ queryKey: ['admin', 'bills'] })
    },
    onError: (err) => setError(apiErrorMessage(err, t)),
  })

  function startEdit(id: string, currentStatus: ShipmentStatus) {
    setEditingId(id)
    setStatus(currentStatus)
    setWeight('')
    setPrice('')
    setNotice(null)
    setError(null)
  }

  return (
    <div>
      <PageHeader title={t('admin.pages.bills.title')} subtitle={t('admin.pages.bills.sub')} />

      <div className="mt-7">
        <FilterPills options={t('admin.filters.bill', { returnObjects: true }) as string[]} active={filter} onChange={setFilter} />
      </div>

      <AdminTable
        columns={[
          { label: t('admin.cols.no'), flex: 1.2 },
          { label: t('admin.cols.cust'), flex: 1 },
          { label: t('admin.cols.weight'), flex: 0.8 },
          { label: t('admin.cols.amount'), flex: 1 },
          { label: t('admin.cols.status'), flex: 1 },
          { label: t('admin.cols.action'), flex: 1.2 },
        ]}
      >
        {filtered.map((b) => {
          const paid = isPaid(b.status)
          return (
            <AdminTableRow key={b.id} actions={<ActionButton label={t('admin.actions.edit')} kind={editingId === b.id ? 'primary' : 'default'} onClick={() => startEdit(b.id, b.status)} />}>
              <AdminCell flex={1.2} mono strong>
                {b.billNumber}
              </AdminCell>
              <AdminCell flex={1} mono dim>
                {b.customerPhone ?? '—'}
              </AdminCell>
              <AdminCell flex={0.8}>{b.weightKg ? `${b.weightKg} kg` : '—'}</AdminCell>
              <AdminCell flex={1}>{b.price ? formatKip(b.price) : '—'}</AdminCell>
              <AdminCell flex={1}>
                <AdminBadge label={t(`admin.status.${paid ? 'payPaid' : 'payWait'}`)} tone={paid ? 'ok' : 'warn'} />
                <span className="ml-2 text-[11px] text-ink-300">({b.status})</span>
              </AdminCell>
            </AdminTableRow>
          )
        })}
      </AdminTable>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <FormCard title={t('admin.forms.bill.title')} sub={t('admin.forms.bill.sub')}>
          <TextField label={t('admin.f.billNumber')} value={newBillNo} onChange={setNewBillNo} />
          <TextField label={t('admin.f.customerPhone')} value={newPhone} onChange={setNewPhone} />
          {createError && <Notice tone="error">{createError}</Notice>}
          {createdMsg && <Notice>{createdMsg}</Notice>}
          <PrimaryButton label={t('admin.add')} onClick={() => create.mutate()} disabled={create.isPending || !newBillNo || !newPhone} />
        </FormCard>

        {editingId && (
          <FormCard title={editingId} sub={t('admin.pages.bills.sub')}>
            <TextField label={t('admin.f.weightKg')} value={weight} onChange={setWeight} type="number" />
            <TextField label={t('admin.f.ratePrice')} value={price} onChange={setPrice} type="number" />
            <div>
              <div className="text-[13px] font-semibold text-ink-700">{t('admin.cols.status')}</div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ShipmentStatus)}
                className="mt-2.5 w-full rounded-[14px] border border-ink-100 px-4 py-3 text-[15px] outline-none"
              >
                {SHIPMENT_STATUS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            {error && <Notice tone="error">{error}</Notice>}
            {notice && <Notice>{notice}</Notice>}
            <PrimaryButton label={t('admin.save')} onClick={() => save.mutate()} disabled={save.isPending} />
          </FormCard>
        )}
      </div>
    </div>
  )
}
