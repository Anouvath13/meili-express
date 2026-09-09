import { create } from 'zustand'

export type AdminStaff = {
  id: string
  fullName: string
  phone: string
  role: 'admin' | 'staff'
  forcePasswordChange: boolean
}

type State = {
  token: string | null
  staff: AdminStaff | null
  setAuth: (token: string, staff: AdminStaff) => void
  updateStaff: (patch: Partial<AdminStaff>) => void
  clear: () => void
}

// Separate storage key from the customer store — an admin/staff session
// must never mix with a customer session in the same browser.
const STORAGE_KEY = 'meili.admin.auth'

function loadInitial(): { token: string | null; staff: AdminStaff | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { token: null, staff: null }
    return JSON.parse(raw)
  } catch {
    return { token: null, staff: null }
  }
}

function persist(token: string | null, staff: AdminStaff | null) {
  try {
    if (token && staff) localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, staff }))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore — session just won't persist across reloads
  }
}

export const useAdminAuth = create<State>((set, get) => ({
  ...loadInitial(),
  setAuth: (token, staff) => {
    persist(token, staff)
    set({ token, staff })
  },
  updateStaff: (patch) => {
    const staff = get().staff
    if (!staff) return
    const next = { ...staff, ...patch }
    persist(get().token, next)
    set({ staff: next })
  },
  clear: () => {
    persist(null, null)
    set({ token: null, staff: null })
  },
}))
