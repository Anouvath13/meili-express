import { apiFetch } from './api'

export type ShippingRate = {
  id: string
  key: string
  nameLo: string
  nameZh: string
  nameEn: string
  price: string
  currency: string
  unit: string
}

export type NewsListItem = {
  id: string
  category: string
  titleLo: string
  titleZh: string
  titleEn: string
  coverImageUrl: string | null
  publishedAt: string | null
}

export type NewsArticle = NewsListItem & {
  bodyLo: string
  bodyZh: string
  bodyEn: string
}

export type NewsCategory = { id: string; key: string; nameLo: string; nameZh: string; nameEn: string }

export type FaqCategory = { id: string; key: string; nameLo: string; nameZh: string; nameEn: string; sortOrder: number }
export type FaqItem = {
  id: string
  categoryId: string
  questionLo: string
  questionZh: string
  questionEn: string
  answerLo: string
  answerZh: string
  answerEn: string
}

export type Review = {
  id: string
  authorName: string
  stars: number
  quoteLo: string | null
  quoteZh: string | null
  quoteEn: string | null
}

export type ShipmentStatus =
  | 'received_from_china'
  | 'in_transit'
  | 'arrived_lao_warehouse'
  | 'arrived_branch'
  | 'priced_awaiting_payment'
  | 'paid_awaiting_pickup'
  | 'delivered'

export type TrackingResult = {
  billNumber: string
  origin: string | null
  destination: string | null
  weightKg: string | null
  productType: string | null
  price: string | null
  status: ShipmentStatus
  receivedDate: string | null
  estimatedDelivery: string | null
  actualDelivery: string | null
  history: { status: ShipmentStatus; location: string | null; note: string | null; changedAt: string }[]
}

export const publicApi = {
  rates: () => apiFetch<{ rates: ShippingRate[] }>('/api/rates'),
  news: (params?: { limit?: number; category?: string }) => {
    const qs = new URLSearchParams()
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.category) qs.set('category', params.category)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return apiFetch<{ items: NewsListItem[] }>(`/api/news${suffix}`)
  },
  newsCategories: () => apiFetch<{ categories: NewsCategory[] }>('/api/news/categories'),
  newsArticle: (id: string) => apiFetch<{ article: NewsArticle }>(`/api/news/${id}`),
  faq: () => apiFetch<{ categories: FaqCategory[]; items: FaqItem[] }>('/api/faq'),
  reviews: () => apiFetch<{ reviews: Review[] }>('/api/reviews'),
  tracking: (billNumber: string) => apiFetch<TrackingResult>(`/api/tracking/${encodeURIComponent(billNumber)}`),
  contact: (data: { name: string; phone: string; subject?: string; message: string }) =>
    apiFetch<{ ok: true }>('/api/contact', { method: 'POST', body: JSON.stringify(data) }),
}
