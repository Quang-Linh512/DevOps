import api from './http'
import { delay, readJSON, writeJSON } from './storage'

export const USERS_KEY = 'devshop_users'
const USE_REMOTE = import.meta.env.VITE_USE_REMOTE_API === 'true'

/** Loại bỏ password khỏi object user trước khi trả về UI */
function sanitize(user) {
  if (!user) return null
  const { password, ...safe } = user
  return {
    ...safe,
    status: safe.status || 'active',
    createdAt: safe.createdAt || new Date(safe.id || Date.now()).toISOString(),
  }
}

function getUsersRaw() {
  return readJSON(USERS_KEY, [])
}

export const userService = {
  async getAll() {
    await delay(100)
    if (USE_REMOTE) {
      try {
        // Backend mount danh sách user tại /api/admin/users (routes/users.js)
        const response = await api.get('/admin/users')
        return Array.isArray(response.data) ? response.data : response.data.users || []
      } catch (error) {
        console.error('Failed to fetch users:', error)
        throw new Error(error.response?.data?.message || 'Không thể tải danh sách người dùng')
      }
    }
    return getUsersRaw().map(sanitize)
  },

  async getById(id) {
    await delay(100)
    if (USE_REMOTE) {
      try {
        const response = await api.get(`/admin/users/${id}`)
        return response.data.user || response.data
      } catch (error) {
        console.error('Failed to fetch user:', error)
        throw new Error(error.response?.data?.message || 'Không tìm thấy người dùng')
      }
    }
    const user = getUsersRaw().find((u) => String(u.id) === String(id))
    if (!user) throw new Error('Không tìm thấy người dùng')
    return sanitize(user)
  },

  async setStatus(id, status) {
    await delay()
    if (USE_REMOTE) {
      try {
        const response = await api.patch(`/admin/users/${id}/status`, { status })
        return response.data.user || response.data
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Không thể cập nhật người dùng')
      }
    }
    if (!['active', 'blocked'].includes(status)) {
      throw new Error('Trạng thái không hợp lệ')
    }
    const list = getUsersRaw()
    const idx = list.findIndex((u) => String(u.id) === String(id))
    if (idx === -1) throw new Error('Không tìm thấy người dùng')

    list[idx] = { ...list[idx], status }
    writeJSON(USERS_KEY, list)
    return sanitize(list[idx])
  },
}

export default userService
