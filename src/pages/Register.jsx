import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const update = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const validate = () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password || !form.confirmPassword) {
      return 'Vui lòng không bỏ trống các trường'
    }
    if (!emailRegex.test(form.email.trim())) {
      return 'Email không đúng định dạng'
    }
    if (form.password.length < 6) {
      return 'Mật khẩu tối thiểu 6 ký tự'
    }
    if (form.password !== form.confirmPassword) {
      return 'Hai mật khẩu phải giống nhau'
    }
    return ''
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    const result = register({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
    })

    if (!result.success) {
      setError(result.message)
      return
    }

    setSuccess(result.message)
    setTimeout(() => navigate('/login'), 1200)
  }

  return (
    <div className="page auth-page">
      <div className="auth-card">
        <h1>Đăng ký</h1>
        <p className="auth-hint">Tạo tài khoản DevShop để đặt hàng nhanh hơn</p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <label>
            Họ tên
            <input type="text" value={form.name} onChange={update('name')} placeholder="Nguyễn Văn A" />
          </label>

          <label>
            Email
            <input type="email" value={form.email} onChange={update('email')} placeholder="you@email.com" />
          </label>

          <label>
            Số điện thoại
            <input type="tel" value={form.phone} onChange={update('phone')} placeholder="09xxxxxxxx" />
          </label>

          <label>
            Mật khẩu
            <input type="password" value={form.password} onChange={update('password')} placeholder="Tối thiểu 6 ký tự" />
          </label>

          <label>
            Nhập lại mật khẩu
            <input
              type="password"
              value={form.confirmPassword}
              onChange={update('confirmPassword')}
              placeholder="Nhập lại mật khẩu"
            />
          </label>

          <button type="submit" className="btn btn-primary btn-block">
            Đăng ký
          </button>
        </form>

        <p className="auth-switch">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  )
}

export default Register
