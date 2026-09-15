import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loading from './Loading'
import { authService } from '../services/authService'

/**
 * Bảo vệ route Admin.
 * Quyền lấy từ role trong session auth — không hard-code email.
 */
function AdminRoute({ children }) {
  const { user, loading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Loading text="Đang kiểm tra quyền truy cập..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!authService.isAdmin(user)) {
    return <Navigate to="/403" replace />
  }

  return children
}

export default AdminRoute
