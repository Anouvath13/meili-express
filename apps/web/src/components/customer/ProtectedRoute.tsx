import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useCustomerAuth } from '../../store/customerAuth'

export function ProtectedRoute() {
  const token = useCustomerAuth((s) => s.token)
  const location = useLocation()

  if (!token) {
    return <Navigate to="/app/login" state={{ from: location }} replace />
  }
  return <Outlet />
}
