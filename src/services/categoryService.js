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
    await delay()
    if (USE_REMOTE) {
      const { data } = await api.get('/admin/categories')
      return data
    }
    return ensureCategories()
  },

  async create(payload) {
    await delay()
    if (USE_REMOTE) {
      const { data } = await api.post('/admin/categories', payload)
      return data
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
      const { data } = await api.put(`/admin/categories/${id}`, payload)
      return data
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
      await api.delete(`/admin/categories/${id}`)
      return true
    }
    save(ensureCategories().filter((c) => String(c.id) !== String(id)))
    return true
  },
}

export default categoryService
