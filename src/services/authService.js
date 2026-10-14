import api from './http'
import { readJSON, writeJSON } from './storage'

const USE_REMOTE = import.meta.env.VITE_USE_REMOTE_API === 'true'
const SETTINGS_KEY = 'devshop_store_settings'

/**
 * Auth helpers phía service.
 * Quyền ADMIN được xác định từ role do hệ thống auth trả về.
 */
export const authService = {
  isAdmin(user) {
    if (!user) return false
    const role = String(user.role || '').toLowerCase()
    return role === 'admin'
  },

  async login(email, password) {
    if (USE_REMOTE) {
      try {
        const response = await api.post('/auth/login', { email, password })
        if (response.data.success && response.data.token) {
          const user = response.data.user
          const token = response.data.token
          // Lưu vào localStorage
          localStorage.setItem('devshop_user', JSON.stringify({ ...user, token }))
          return { success: true, user, token }
        }
        return { success: false, message: response.data.message || 'Đăng nhập thất bại' }
      } catch (error) {
        const message = error.response?.data?.message || 'Đăng nhập thất bại'
        return { success: false, message }
      }
    }
    // Fallback localStorage
    const users = readJSON('devshop_users', [])
    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )
    if (!found) {
      return { success: false, message: 'Email hoặc mật khẩu không đúng' }
    }
    if (found.status === 'blocked') {
      return { success: false, message: 'Tài khoản đã bị khóa' }
    }
    const { password: _, ...safeUser } = found
    localStorage.setItem('devshop_user', JSON.stringify(safeUser))
    return { success: true, user: safeUser }
  },

  async register(formData) {
    if (USE_REMOTE) {
      try {
        const response = await api.post('/auth/register', {
          email: formData.email,
          password: formData.password,
          ho_ten: formData.name,
          so_dien_thoai: formData.phone,
        })
        if (response.data.success) {
          return { success: true, message: response.data.message || 'Đăng ký thành công!' }
        }
        return { success: false, message: response.data.message || 'Đăng ký thất bại' }
      } catch (error) {
        const message = error.response?.data?.message || 'Email đã được sử dụng'
        return { success: false, message }
      }
    }
    // Fallback localStorage
    const users = readJSON('devshop_users', [])
    const exists = users.some(
      (u) => u.email.toLowerCase() === formData.email.toLowerCase()
    )
    if (exists) {
      return { success: false, message: 'Email đã được sử dụng' }
    }
    const newUser = {
      id: Date.now(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      role: 'user',
      status: 'active',
      address: '',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(formData.email)}`,
      createdAt: new Date().toISOString(),
    }
    users.push(newUser)
    writeJSON('devshop_users', users)
    return { success: true, message: 'Đăng ký thành công! Vui lòng đăng nhập.' }
  },

  async changePassword({ userId, currentPassword, newPassword }) {
    if (USE_REMOTE) {
      try {
        const response = await api.post('/auth/change-password', {
          currentPassword,
          newPassword,
        })
        return response.data
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Không thể đổi mật khẩu')
      }
    }
    // Fallback localStorage
    const users = readJSON('devshop_users', [])
    const idx = users.findIndex((u) => String(u.id) === String(userId))
    if (idx === -1) throw new Error('Không tìm thấy tài khoản')
    if (users[idx].password !== currentPassword) {
      throw new Error('Mật khẩu hiện tại không đúng')
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Mật khẩu mới tối thiểu 6 ký tự')
    }
    users[idx].password = newPassword
    writeJSON('devshop_users', users)
    return { success: true }
  },

  async getStoreSettings() {
    if (USE_REMOTE) {
      try {
        const response = await api.get('/settings')
        return response.data.settings || {}
      } catch (error) {
        console.error('Failed to fetch settings:', error)
        return getDefaultSettings()
      }
    }
    return getDefaultSettings()
  },

  async saveStoreSettings(settings) {
    if (USE_REMOTE) {
      try {
        const response = await api.put('/settings', settings)
        return response.data.settings
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Không thể lưu cài đặt')
      }
    }
    writeJSON(SETTINGS_KEY, settings)
    return settings
  },
}

function getDefaultSettings() {
  return readJSON(SETTINGS_KEY, {
    storeName: 'DevShop',
    email: 'support@devshop.com',
    hotline: '1900 1234',
    address: '123 Đường DevOps, Quận 1, TP.HCM',
    logo: '',
    notifyNewOrder: true,
    notifyLowStock: true,
    notifyNewUser: true,
  })
}

export default authService
