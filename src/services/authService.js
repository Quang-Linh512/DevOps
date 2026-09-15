import api from './http'
import { readJSON, writeJSON } from './storage'

const USE_REMOTE = import.meta.env.VITE_USE_REMOTE_API === 'true'
const USERS_KEY = 'devshop_users'
const SETTINGS_KEY = 'devshop_store_settings'

/**
 * Auth helpers phía service.
 * Quyền ADMIN được xác định từ role do hệ thống auth trả về (session user),
 * không hard-code email/password ở UI Admin.
 */
export const authService = {
  isAdmin(user) {
    if (!user) return false
    const role = String(user.role || '').toLowerCase()
    return role === 'admin'
  },

  async changePassword({ userId, currentPassword, newPassword }) {
    if (USE_REMOTE) {
      const { data } = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      })
      return data
    }

    const users = readJSON(USERS_KEY, [])
    const idx = users.findIndex((u) => String(u.id) === String(userId))
    if (idx === -1) throw new Error('Không tìm thấy tài khoản')
    if (users[idx].password !== currentPassword) {
      throw new Error('Mật khẩu hiện tại không đúng')
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Mật khẩu mới tối thiểu 6 ký tự')
    }
    users[idx].password = newPassword
    writeJSON(USERS_KEY, users)
    return { success: true }
  },

  getStoreSettings() {
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
  },

  saveStoreSettings(settings) {
    if (USE_REMOTE) {
      return api.put('/admin/settings', settings).then((r) => r.data)
    }
    writeJSON(SETTINGS_KEY, settings)
    return Promise.resolve(settings)
  },
}

export default authService
