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
    await delay()
    if (USE_REMOTE) {
      const { data } = await api.get('/admin/users')
      return data
    }
    return getUsersRaw().map(sanitize)
  },

  async getById(id) {
    await delay()
    if (USE_REMOTE) {
      const { data } = await api.get(`/admin/users/${id}`)
      return data
    }
    const user = getUsersRaw().find((u) => String(u.id) === String(id))
    if (!user) throw new Error('Không tìm thấy người dùng')
    return sanitize(user)
  },

  async setStatus(id, status) {
    await delay()
    if (USE_REMOTE) {
      const { data } = await api.patch(`/admin/users/${id}/status`, { status })
      return data
    }
    if (!['active', 'blocked'].includes(status)) {
      throw new Error('Trạng thái không hợp lệ')
    }
    const list = getUsersRaw()
    const idx = list.findIndex((u) => String(u.id) === String(id))
    if (idx === -1) throw new Error('Không tìm thấy người dùng')

    // Không cho phép khóa chính tài khoản admin gốc nếu cần — vẫn cho phép block user thường
    list[idx] = { ...list[idx], status }
    writeJSON(USERS_KEY, list)
    return sanitize(list[idx])
  },
}

export default userService
