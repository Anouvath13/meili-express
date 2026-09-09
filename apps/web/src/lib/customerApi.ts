import { useCustomerAuth, type CustomerUser } from '../store/customerAuth'
import { apiFetch } from './api'

function authHeaders(): Record<string, string> {
  const token = useCustomerAuth.getState().token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function authFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return apiFetch<T>(path, { ...init, headers: { ...authHeaders(), ...init?.headers } })
}

type AuthResponse = { token: string; user: CustomerUser }
type OtpPurpose = 'register' | 'login' | 'reset_password' | 'change_phone'

export const customerAuthApi = {
  sendOtp: (phone: string, purpose: OtpPurpose) =>
    apiFetch<{ ok: true; devCode?: string }>('/api/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone, purpose }) }),
  register: (data: { phone: string; otp: string; fullName: string; referralCode?: string }) =>
    apiFetch<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  loginOtp: (phone: string, otp: string) =>
    apiFetch<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify({ phone, otp }) }),
  loginPassword: (phone: string, password: string) =>
    apiFetch<AuthResponse>('/api/auth/login-password', { method: 'POST', body: JSON.stringify({ phone, password }) }),
  forgotPassword: (phone: string) =>
    apiFetch<{ ok: true; devCode?: string }>('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ phone }) }),
  resetPassword: (data: { phone: string; otp: string; newPassword: string }) =>
    apiFetch<{ ok: true }>('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  setPassword: (password: string) => authFetch<{ ok: true }>('/api/auth/set-password', { method: 'POST', body: JSON.stringify({ password }) }),
  changePassword: (oldPassword: string, newPassword: string) =>
    authFetch<{ ok: true }>('/api/auth/change-password', { method: 'POST', body: JSON.stringify({ oldPassword, newPassword }) }),
  logout: () => authFetch<{ ok: true }>('/api/auth/logout', { method: 'POST' }),
  me: () => authFetch<{ user: CustomerUser; points: { unlocked: number; locked: number } }>('/api/auth/me'),
}

export type PointsBalance = { unlocked: number; locked: number; expiresAt: string | null }
export type PointsHistoryItem = { id: string; date: string; delta: number; source: string; status: string; note: string | null; billNumber: string | null }
export type ReferralFriend = { id: string; name: string | null; phone: string; linkedAt: string; status: string; cumulativeKg: string; pointsEarned: number }
export type ShipmentStatus =
  | 'received_from_china'
  | 'in_transit'
  | 'arrived_lao_warehouse'
  | 'arrived_branch'
  | 'priced_awaiting_payment'
  | 'paid_awaiting_pickup'
  | 'delivered'
export type InvoiceSummary = {
  id: string
  billNumber: string
  productType: string | null
  weightKg: string | null
  price: string | null
  status: ShipmentStatus
  receivedDate: string | null
  estimatedDelivery: string | null
  actualDelivery: string | null
}
export type InvoiceDetail = InvoiceSummary & {
  origin: string | null
  destination: string | null
  pointsRedeemed: number
  redeemable: boolean
  pointValue: number
  maxRedeemablePoints: number
  availablePoints: number
}
export type ParcelStatus = InvoiceSummary & { history: { status: ShipmentStatus; location: string | null; note: string | null; changedAt: string }[] }

export const customerApi = {
  pointsBalance: () => authFetch<PointsBalance>('/api/points/balance'),
  pointsHistory: () => authFetch<{ items: PointsHistoryItem[] }>('/api/points/history'),
  referralCode: () => authFetch<{ accountId: string; referralUrl: string }>('/api/referral/code'),
  referralFriends: () => authFetch<{ items: ReferralFriend[] }>('/api/referral/friends'),
  invoices: (opts?: { filter?: 'all' | 'unpaid' | 'paid'; limit?: number }) => {
    const qs = new URLSearchParams()
    if (opts?.filter && opts.filter !== 'all') qs.set('filter', opts.filter)
    if (opts?.limit) qs.set('limit', String(opts.limit))
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return authFetch<{ items: InvoiceSummary[] }>(`/api/invoices${suffix}`)
  },
  invoice: (id: string) => authFetch<InvoiceDetail>(`/api/invoices/${id}`),
  redeemPoints: (id: string, points: number) =>
    authFetch<{ pointsUsed: number; discount: number; total: number }>(`/api/invoices/${id}/redeem-points`, {
      method: 'POST',
      body: JSON.stringify({ points }),
    }),
  parcels: () => authFetch<{ items: { id: string; billNumber: string; status: ShipmentStatus }[] }>('/api/parcels'),
  activeParcel: () => authFetch<InvoiceSummary | null>('/api/parcels/active'),
  parcelStatus: (billNumber: string) => authFetch<ParcelStatus>(`/api/parcels/${encodeURIComponent(billNumber)}/status`),
  profile: () => authFetch<CustomerUser & { id: string }>('/api/profile'),
  updateProfile: (data: { fullName?: string; email?: string | null }) =>
    authFetch<CustomerUser>('/api/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  changePhone: (newPhone: string, otp: string) =>
    authFetch<{ id: string; phone: string }>('/api/profile/change-phone', { method: 'POST', body: JSON.stringify({ newPhone, otp }) }),
}
