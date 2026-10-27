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

  /**
   * Đăng nhập.
   * Luôn trả về cùng một hình dạng:
   *   { success: boolean, user: object|null, token: string|null, message?: string }
   * Nhánh remote đọc response.data (token nằm trong user theo toUserResponse),
   * nhánh fallback localStorage không có token nên token = null.
   */
  async login(email, password) {
    if (USE_REMOTE) {
      try {
        const response = await api.post('/auth/login', { email, password })
        if (response.data.success && response.data.user) {
          const user = response.data.user
          // Backend nhúng token vào user (toUserResponse), hỗ trợ cả 2 vị trí.
          const token = response.data.token || user.token || null
          return { success: true, user: { ...user, token }, token, message: response.data.message }
        }
        return {
          success: false,
          user: null,
          token: null,
          message: response.data.message || 'Đăng nhập thất bại',
        }
      } catch (error) {
        const message = error.response?.data?.message || 'Đăng nhập thất bại'
        return { success: false, user: null, token: null, message }
      }
    }
    // Fallback localStorage
    const users = readJSON('devshop_users', [])
    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )
    if (!found) {
      return { success: false, user: null, token: null, message: 'Email hoặc mật khẩu không đúng' }
    }
    if (found.status === 'blocked') {
      return { success: false, user: null, token: null, message: 'Tài khoản đã bị khóa' }
    }
    const { password: _, ...safeUser } = found
    return { success: true, user: safeUser, token: null }
  },

  /**
   * Đăng ký.
   * Luôn trả về: { success: boolean, message: string }
   */
  async register(formData) {
    if (USE_REMOTE) {
      try {
        const response = await api.post('/auth/register', {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
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

  /**
   * Cập nhật hồ sơ người dùng.
   * API thật: PUT /auth/profile (backend chỉ cho phép name, phone, address, avatar).
   */
  async updateProfile(updates) {
    if (USE_REMOTE) {
      try {
        const response = await api.put('/auth/profile', updates)
        return { success: true, user: response.data }
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Không thể cập nhật hồ sơ')
      }
    }
    return { success: true, user: { ...updates } }
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
        // Backend mount cài đặt tại /api/admin/settings (routes/admin.js)
        const response = await api.get('/admin/settings')
        return response.data.settings || response.data
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
        const response = await api.put('/admin/settings', settings)
        return response.data.settings || response.data
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
