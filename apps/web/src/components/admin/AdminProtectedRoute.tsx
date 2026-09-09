import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../../store/adminAuth'

export function AdminProtectedRoute() {
  const token = useAdminAuth((s) => s.token)
  const staff = useAdminAuth((s) => s.staff)
  const location = useLocation()

  if (!token) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }
  // Server-side blockIfTempPassword already refuses every other route — this
  // just gets the UI there directly instead of bouncing through 403s.
  if (staff?.forcePasswordChange && location.pathname !== '/admin/account') {
    return <Navigate to="/admin/account" replace />
  }
  return <Outlet />
}
