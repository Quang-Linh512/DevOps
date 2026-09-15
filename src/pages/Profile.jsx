import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Profile() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="page profile-page">
      <div className="container">
        <div className="profile-card">
          <img
            className="profile-avatar"
            src={user.avatar}
            alt={`Avatar ${user.name}`}
          />
          <h1>{user.name}</h1>
          <p className="role-tag">{user.role === 'admin' ? 'Admin' : 'User'}</p>

          <dl className="profile-info">
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Số điện thoại</dt>
              <dd>{user.phone || 'Chưa cập nhật'}</dd>
            </div>
            <div>
              <dt>Địa chỉ</dt>
              <dd>{user.address || 'Chưa cập nhật'}</dd>
            </div>
          </dl>

          <div className="profile-actions">
            {isAdmin && (
              <Link to="/admin" className="btn btn-primary">
                Vào trang Admin
              </Link>
            )}
            <Link to="/orders" className="btn btn-outline">
              Xem đơn hàng
            </Link>
            <button type="button" className="btn btn-outline" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
