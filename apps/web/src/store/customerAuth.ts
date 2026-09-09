import { create } from 'zustand'

export type CustomerUser = {
  id: string
  accountId: string
  phone: string
  fullName: string | null
  email: string | null
  hasPassword: boolean
}

type State = {
  token: string | null
  user: CustomerUser | null
  setAuth: (token: string, user: CustomerUser) => void
  updateUser: (patch: Partial<CustomerUser>) => void
  clear: () => void
}

const STORAGE_KEY = 'meili.customer.auth'

function loadInitial(): { token: string | null; user: CustomerUser | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { token: null, user: null }
    return JSON.parse(raw)
  } catch {
    return { token: null, user: null }
  }
}

function persist(token: string | null, user: CustomerUser | null) {
  try {
    if (token && user) localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // localStorage unavailable (private browsing etc.) — session just won't persist across reloads.
  }
}

export const useCustomerAuth = create<State>((set, get) => ({
  ...loadInitial(),
  setAuth: (token, user) => {
    persist(token, user)
    set({ token, user })
  },
  updateUser: (patch) => {
    const user = get().user
    if (!user) return
    const next = { ...user, ...patch }
    persist(get().token, next)
    set({ user: next })
  },
  clear: () => {
    persist(null, null)
    set({ token: null, user: null })
  },
}))
