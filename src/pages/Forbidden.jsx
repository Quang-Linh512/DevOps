import { Link } from 'react-router-dom'

function Forbidden() {
  return (
    <div className="page">
      <div className="container empty-state">
        <p className="error-code">403</p>
        <h1>Không có quyền truy cập</h1>
        <p>Trang quản trị chỉ dành cho tài khoản có quyền Admin.</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-primary">
            Về trang chủ
          </Link>
          <Link to="/profile" className="btn btn-outline">
            Hồ sơ của tôi
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Forbidden
