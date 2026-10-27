import api from './http'
import { delay, readJSON, writeJSON, slugify } from './storage'
import { categories as seedCategories } from '../data/products'

export const CATEGORIES_KEY = 'devshop_categories'
const USE_REMOTE = import.meta.env.VITE_USE_REMOTE_API === 'true'

function normalizeCategory(c) {
  return {
    id: c.id,
    name: c.name,
    icon: c.icon || '📦',
    slug: c.slug || slugify(c.name),
    description: c.description || '',
    status: c.status || 'active',
    createdAt: c.createdAt || new Date().toISOString(),
  }
}

function ensureCategories() {
  const existing = readJSON(CATEGORIES_KEY, null)
  if (existing && Array.isArray(existing) && existing.length > 0) {
    return existing.map(normalizeCategory)
  }
  const seeded = seedCategories.map(normalizeCategory)
  writeJSON(CATEGORIES_KEY, seeded)
  return seeded
}

function save(list) {
  writeJSON(CATEGORIES_KEY, list)
  return list
}

export const categoryService = {
  async getAll() {
    await delay(100)
    if (USE_REMOTE) {
      try {
        // Backend mount danh mục tại /api/admin/categories (routes/categories.js).
        // GET / trong router này không yêu cầu token nên storefront vẫn đọc được.
        const response = await api.get('/admin/categories')
        return Array.isArray(response.data) ? response.data : response.data.categories || []
      } catch (error) {
        console.error('Failed to fetch categories:', error)
        throw new Error(error.response?.data?.message || 'Không thể tải danh mục')
      }
    }
    return ensureCategories()
  },

  async create(payload) {
    await delay()
    if (USE_REMOTE) {
      try {
        const response = await api.post('/admin/categories', payload)
        return response.data.category || response.data
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Không thể tạo danh mục')
      }
    }
    const list = ensureCategories()
    const item = normalizeCategory({
      id: slugify(payload.name) || `cat-${Date.now()}`,
      name: payload.name.trim(),
      slug: payload.slug || slugify(payload.name),
      description: payload.description || '',
      status: payload.status || 'active',
      icon: payload.icon || '📦',
      createdAt: new Date().toISOString(),
    })
    list.push(item)
    save(list)
    return item
  },

  async update(id, payload) {
    await delay()
    if (USE_REMOTE) {
      try {
        const response = await api.put(`/admin/categories/${id}`, payload)
        return response.data.category || response.data
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Không thể cập nhật danh mục')
      }
    }
    const list = ensureCategories()
    const idx = list.findIndex((c) => String(c.id) === String(id))
    if (idx === -1) throw new Error('Không tìm thấy danh mục')
    list[idx] = normalizeCategory({ ...list[idx], ...payload, id: list[idx].id })
    save(list)
    return list[idx]
  },

  async remove(id) {
    await delay()
    if (USE_REMOTE) {
      try {
        await api.delete(`/admin/categories/${id}`)
        return true
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Không thể xóa danh mục')
      }
    }
    save(ensureCategories().filter((c) => String(c.id) !== String(id)))
    return true
  },
}

export default categoryService
