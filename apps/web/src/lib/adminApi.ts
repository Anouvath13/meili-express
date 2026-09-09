import { useAdminAuth, type AdminStaff } from '../store/adminAuth'
import { apiFetch } from './api'

function authHeaders(): Record<string, string> {
  const token = useAdminAuth.getState().token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return apiFetch<T>(path, { ...init, headers: { ...authHeaders(), ...init?.headers } })
}

// ==================================================================== auth
export const adminAuthApi = {
  login: (phone: string, password: string) =>
    apiFetch<{ token: string; staff: AdminStaff }>('/api/admin/auth/login', { method: 'POST', body: JSON.stringify({ phone, password }) }),
  me: () => adminFetch<{ staff: AdminStaff }>('/api/admin/me'),
  changePassword: (oldPassword: string, newPassword: string) =>
    adminFetch<{ ok: true }>('/api/admin/me/password', { method: 'PUT', body: JSON.stringify({ oldPassword, newPassword }) }),
  logout: () => adminFetch<{ ok: true }>('/api/admin/auth/logout', { method: 'POST' }),
  changeName: (fullName: string) => adminFetch<{ id: string; fullName: string }>('/api/admin/me/name', { method: 'PUT', body: JSON.stringify({ fullName }) }),
  requestPhoneChange: (newPhone: string) =>
    adminFetch<{ id: string; newPhone: string; status: string }>('/api/admin/me/phone/request', { method: 'POST', body: JSON.stringify({ newPhone }) }),
  myPhoneRequests: () => adminFetch<{ items: PhoneChangeRequest[] }>('/api/admin/me/phone/requests'),
}

export type PhoneChangeRequest = {
  id: string
  newPhone: string
  status: 'pending' | 'approved' | 'rejected'
  requestedAt: string
  staff?: { fullName: string; phone: string }
}

export const adminPhoneRequestsApi = {
  list: () => adminFetch<{ items: PhoneChangeRequest[] }>('/api/admin/phone-requests'),
  approve: (id: string) => adminFetch<{ ok: true }>(`/api/admin/phone-requests/${id}/approve`, { method: 'PATCH' }),
  reject: (id: string) => adminFetch<{ ok: true }>(`/api/admin/phone-requests/${id}/reject`, { method: 'PATCH' }),
}

// ================================================================ dashboard
export type DashboardSummary = {
  totalCustomers: number
  totalBills: number
  inTransit: number
  awaitingPricing: number
  awaitingPayment: number
  totalRevenue: string | number
  totalPointsRedeemed: number
  latestNews: { titleLo: string; publishedAt: string | null } | null
}

export const adminDashboardApi = {
  summary: () => adminFetch<DashboardSummary>('/api/admin/dashboard/summary'),
}

// ==================================================================== bills
export type ShipmentStatus =
  | 'received_from_china'
  | 'in_transit'
  | 'arrived_lao_warehouse'
  | 'arrived_branch'
  | 'priced_awaiting_payment'
  | 'paid_awaiting_pickup'
  | 'delivered'

export type Bill = {
  id: string
  billNumber: string
  customerName: string | null
  customerPhone: string | null
  productType: string | null
  weightKg: string | null
  price: string | null
  status: ShipmentStatus
  receivedDate: string | null
  estimatedDelivery: string | null
  actualDelivery: string | null
  assignedStaffName: string | null
}

export const adminBillsApi = {
  list: (params?: { status?: ShipmentStatus; q?: string }) => {
    const qs = new URLSearchParams()
    if (params?.status) qs.set('status', params.status)
    if (params?.q) qs.set('q', params.q)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return adminFetch<{ items: Bill[] }>(`/api/admin/bills${suffix}`)
  },
  get: (id: string) => adminFetch<Bill & { origin: string | null; destination: string | null; history: unknown[] }>(`/api/admin/bills/${id}`),
  create: (data: { billNumber: string; customerPhone: string; productType?: string; weightKg?: number }) =>
    adminFetch<{ id: string; billNumber: string }>('/api/admin/bills', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<{ productType: string; weightKg: number; price: number; origin: string; destination: string }>) =>
    adminFetch<{ id: string; billNumber: string }>(`/api/admin/bills/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  setStatus: (id: string, status: ShipmentStatus) =>
    adminFetch<{ ok: true; pointsAwarded: number; refereeUnlocked: boolean }>(`/api/admin/bills/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
}

// ==================================================================== rates
export type Rate = {
  id: string
  key: string
  nameLo: string
  nameZh: string
  nameEn: string
  price: string
  currency: string
  unit: string
}

export const adminRatesApi = {
  list: () => adminFetch<{ rates: Rate[] }>('/api/admin/rates'),
  update: (key: string, data: Partial<Pick<Rate, 'nameLo' | 'nameZh' | 'nameEn' | 'price' | 'currency' | 'unit'>>) =>
    adminFetch<{ rate: Rate }>(`/api/admin/rates/${key}`, { method: 'PUT', body: JSON.stringify(data) }),
}

// ============================================================= points config
export type ConfigRow = { configKey: string; configValue: string; description: string | null }

export const adminConfigApi = {
  pointsConfig: () => adminFetch<{ items: ConfigRow[] }>('/api/admin/points-config'),
  updatePointsConfig: (values: Record<string, string>) =>
    adminFetch<{ items: ConfigRow[] }>('/api/admin/points-config', { method: 'PUT', body: JSON.stringify(values) }),
}

// =================================================================== news
export type NewsCategory = { id: string; key: string; nameLo: string; nameZh: string; nameEn: string }
export type AdminNewsArticle = {
  id: string
  categoryId: string
  category: NewsCategory
  titleLo: string
  titleZh: string
  titleEn: string
  bodyLo: string
  bodyZh: string
  bodyEn: string
  isPublished: boolean
  publishedAt: string | null
}

export const adminNewsApi = {
  categories: () => adminFetch<{ categories: NewsCategory[] }>('/api/admin/news/categories'),
  list: () => adminFetch<{ items: AdminNewsArticle[] }>('/api/admin/news'),
  create: (data: Omit<AdminNewsArticle, 'id' | 'category' | 'publishedAt'>) =>
    adminFetch<{ article: AdminNewsArticle }>('/api/admin/news', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Omit<AdminNewsArticle, 'id' | 'category'>>) =>
    adminFetch<{ article: AdminNewsArticle }>(`/api/admin/news/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => adminFetch<{ ok: true }>(`/api/admin/news/${id}`, { method: 'DELETE' }),
}

// ==================================================================== faq
export type FaqCategory = { id: string; key: string; nameLo: string; nameZh: string; nameEn: string; sortOrder: number }
export type AdminFaqItem = {
  id: string
  categoryId: string
  questionLo: string
  questionZh: string
  questionEn: string
  answerLo: string
  answerZh: string
  answerEn: string
  isPublished: boolean
  needsReview: boolean
}

export const adminFaqApi = {
  categories: () => adminFetch<{ categories: FaqCategory[] }>('/api/admin/faqs/categories'),
  list: () => adminFetch<{ items: AdminFaqItem[] }>('/api/admin/faqs'),
  create: (data: Omit<AdminFaqItem, 'id'>) => adminFetch<{ item: AdminFaqItem }>('/api/admin/faqs', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Omit<AdminFaqItem, 'id'>>) =>
    adminFetch<{ item: AdminFaqItem }>(`/api/admin/faqs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => adminFetch<{ ok: true }>(`/api/admin/faqs/${id}`, { method: 'DELETE' }),
}

// ================================================================= reviews
export type AdminReview = {
  id: string
  authorName: string
  stars: number
  quoteLo: string | null
  quoteZh: string | null
  quoteEn: string | null
  status: 'pending' | 'approved' | 'hidden'
}

export const adminReviewsApi = {
  list: () => adminFetch<{ reviews: AdminReview[] }>('/api/admin/reviews'),
  create: (data: Omit<AdminReview, 'id' | 'status'> & { status?: string }) =>
    adminFetch<{ review: AdminReview }>('/api/admin/reviews', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Omit<AdminReview, 'id'>>) =>
    adminFetch<{ review: AdminReview }>(`/api/admin/reviews/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => adminFetch<{ ok: true }>(`/api/admin/reviews/${id}`, { method: 'DELETE' }),
  approve: (id: string) => adminFetch<{ review: AdminReview }>(`/api/admin/reviews/${id}/approve`, { method: 'PATCH' }),
  hide: (id: string) => adminFetch<{ review: AdminReview }>(`/api/admin/reviews/${id}/hide`, { method: 'PATCH' }),
}

// ============================================================ notifications
export type NotificationTemplate = {
  id: string
  templateKey: string
  title: string
  bodyWeb: string
  bodyWhatsapp: string
  isActive: boolean
}

export const adminNotificationsApi = {
  list: () => adminFetch<{ templates: NotificationTemplate[] }>('/api/admin/notification-templates'),
  update: (id: string, data: { title: string; bodyWeb: string; bodyWhatsapp: string; isActive?: boolean }) =>
    adminFetch<{ template: NotificationTemplate }>(`/api/admin/notification-templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  sendTest: (id: string, phone: string) =>
    adminFetch<{ ok: true }>(`/api/admin/notifications/send-test/${id}`, { method: 'POST', body: JSON.stringify({ phone }) }),
}

// =================================================================== staff
export type StaffMember = {
  id: string
  fullName: string
  phone: string
  role: 'admin' | 'staff'
  status: 'active' | 'suspended'
  createdAt: string
  lastLoginAt: string | null
}

export type ResetLogEntry = {
  id: string
  action: string
  note: string | null
  createdAt: string
  staffName: string
  staffPhone: string
  performedByName: string
}

export const adminStaffApi = {
  list: () => adminFetch<{ items: StaffMember[] }>('/api/admin/staff'),
  create: (data: { fullName: string; phone: string; role: 'admin' | 'staff' }) =>
    adminFetch<{ staff: StaffMember; tempPassword: string }>('/api/admin/staff', { method: 'POST', body: JSON.stringify(data) }),
  resetPhone: (id: string, newPhone: string) =>
    adminFetch<{ ok: true }>(`/api/admin/staff/${id}/reset-phone`, { method: 'PATCH', body: JSON.stringify({ newPhone }) }),
  resetPassword: (id: string) => adminFetch<{ ok: true; tempPassword: string }>(`/api/admin/staff/${id}/reset-password`, { method: 'PATCH' }),
  suspend: (id: string) => adminFetch<{ ok: true; status: string }>(`/api/admin/staff/${id}/suspend`, { method: 'PATCH' }),
  resetLog: () => adminFetch<{ items: ResetLogEntry[] }>('/api/admin/staff/reset-log'),
}

// =============================================================== referrals
export type AdminReferral = {
  id: string
  referrerName: string | null
  referrerPhone: string
  referralCode: string
  refereeName: string | null
  refereePhone: string
  cumulativeKg: string
  status: 'pending' | 'unlocked' | 'flagged'
  fraudFlag: boolean
  fraudReason: string | null
  linkedAt: string
}

export const adminReferralsApi = {
  list: (status?: string) => adminFetch<{ items: AdminReferral[] }>(`/api/admin/referrals${status ? `?status=${status}` : ''}`),
  approve: (id: string) => adminFetch<{ referral: AdminReferral }>(`/api/admin/referrals/${id}/approve`, { method: 'PATCH' }),
  suspend: (id: string, note?: string) =>
    adminFetch<{ referral: AdminReferral }>(`/api/admin/referrals/${id}/suspend`, { method: 'PATCH', body: JSON.stringify({ note }) }),
}
