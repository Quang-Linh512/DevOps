import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="page">
      <div className="container empty-state not-found">
        <p className="error-code">404</p>
        <h1>Trang không tồn tại</h1>
        <p>Đường dẫn bạn truy cập không đúng hoặc đã bị xóa.</p>
        <Link to="/" className="btn btn-primary">
          Về trang chủ
        </Link>
      </div>
    </div>
  )
}

export default NotFound
