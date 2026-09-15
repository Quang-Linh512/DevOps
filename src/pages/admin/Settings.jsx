import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/authService'

function AdminSettings() {
  const { user, updateProfile, changePassword } = useAuth()
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: '',
  })
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [store, setStore] = useState(authService.getStoreSettings())
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
      })
    }
  }, [user])

  const flash = (text, isError = false) => {
    setMsg(isError ? '' : text)
    setErr(isError ? text : '')
  }

  const saveProfile = (e) => {
    e.preventDefault()
    updateProfile({
      name: profile.name.trim(),
      phone: profile.phone.trim(),
      avatar: profile.avatar.trim(),
    })
    flash('Đã cập nhật hồ sơ admin')
  }

  const savePassword = async (e) => {
    e.preventDefault()
    if (passwords.newPassword.length < 6) {
      flash('Mật khẩu mới tối thiểu 6 ký tự', true)
      return
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      flash('Xác nhận mật khẩu không khớp', true)
      return
    }
    try {
      await changePassword(passwords.currentPassword, passwords.newPassword)
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      flash('Đổi mật khẩu thành công')
    } catch (error) {
      flash(error.message || 'Không thể đổi mật khẩu', true)
    }
  }

  const saveStore = async (e) => {
    e.preventDefault()
    await authService.saveStoreSettings(store)
    flash('Đã lưu cài đặt cửa hàng')
  }

  const onAvatarUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setProfile((p) => ({ ...p, avatar: String(reader.result) }))
    reader.readAsDataURL(file)
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Cài đặt</h1>
          <p>Hồ sơ admin, bảo mật và cửa hàng</p>
        </div>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}
      {err && <div className="alert alert-error">{err}</div>}

      <div className="admin-grid-2">
        <form className="admin-card" onSubmit={saveProfile}>
          <h2>Profile Admin</h2>
          <div className="admin-settings-avatar">
            <img src={profile.avatar} alt="" />
            <input type="file" accept="image/*" onChange={onAvatarUpload} />
          </div>
          <label>
            Full name
            <input
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            />
          </label>
          <label>
            Email
            <input value={profile.email} disabled />
          </label>
          <label>
            Phone
            <input
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
            />
          </label>
          <button type="submit" className="btn btn-primary">
            Lưu hồ sơ
          </button>
        </form>

        <form className="admin-card" onSubmit={savePassword}>
          <h2>Đổi mật khẩu</h2>
          <label>
            Current password
            <input
              type="password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
            />
          </label>
          <label>
            New password
            <input
              type="password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
            />
          </label>
          <label>
            Confirm password
            <input
              type="password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
            />
          </label>
          <button type="submit" className="btn btn-primary">
            Đổi mật khẩu
          </button>
        </form>
      </div>

      <form className="admin-card" onSubmit={saveStore}>
        <h2>Store settings</h2>
        <div className="admin-form-grid">
          <label>
            Tên cửa hàng
            <input
              value={store.storeName}
              onChange={(e) => setStore((s) => ({ ...s, storeName: e.target.value }))}
            />
          </label>
          <label>
            Email
            <input
              value={store.email}
              onChange={(e) => setStore((s) => ({ ...s, email: e.target.value }))}
            />
          </label>
          <label>
            Hotline
            <input
              value={store.hotline}
              onChange={(e) => setStore((s) => ({ ...s, hotline: e.target.value }))}
            />
          </label>
          <label>
            Logo URL
            <input
              value={store.logo}
              onChange={(e) => setStore((s) => ({ ...s, logo: e.target.value }))}
            />
          </label>
          <label className="full">
            Địa chỉ
            <textarea
              rows={2}
              value={store.address}
              onChange={(e) => setStore((s) => ({ ...s, address: e.target.value }))}
            />
          </label>
        </div>

        <h3 style={{ marginTop: '1.25rem' }}>Notification settings</h3>
        <div className="admin-form-grid">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={store.notifyNewOrder}
              onChange={(e) => setStore((s) => ({ ...s, notifyNewOrder: e.target.checked }))}
            />
            Thông báo đơn hàng mới
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={store.notifyLowStock}
              onChange={(e) => setStore((s) => ({ ...s, notifyLowStock: e.target.checked }))}
            />
            Cảnh báo sắp hết hàng
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={store.notifyNewUser}
              onChange={(e) => setStore((s) => ({ ...s, notifyNewUser: e.target.checked }))}
            />
            Thông báo user mới
          </label>
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Lưu cài đặt cửa hàng
        </button>
      </form>
    </div>
  )
}

export default AdminSettings
