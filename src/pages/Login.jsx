import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu')
      return
    }

    setSubmitting(true)
    try {
      // login() là async -> phải await, nếu không result sẽ là Promise
      // và result.success luôn undefined khiến form báo lỗi vô lý.
      const result = await login(email.trim(), password)

      if (!result?.success) {
        setError(result?.message || 'Đăng nhập thất bại')
        return
      }

      navigate(from, { replace: true })
    } catch (err) {
      setError(err?.message || 'Đăng nhập thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page auth-page">
      <div className="auth-card">
        <h1>Đăng nhập</h1>
        <p className="auth-hint">Đăng nhập để theo dõi đơn hàng và quản lý tài khoản của bạn.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
            />
          </label>

          <label>
            Mật khẩu
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              autoComplete="current-password"
            />
          </label>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="auth-switch">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
