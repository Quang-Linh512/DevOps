import api from './http'
import { delay, readJSON, writeJSON, slugify } from './storage'
import { products as seedProducts } from '../data/products'

export const PRODUCTS_KEY = 'devshop_products'
const USE_REMOTE = import.meta.env.VITE_USE_REMOTE_API === 'true'

function normalizeProduct(p) {
  const sku = p.sku || `SKU-${String(p.id).padStart(4, '0')}`
  return {
    ...p,
    sku,
    status: p.status || 'active',
    createdAt: p.createdAt || new Date().toISOString(),
    updatedAt: p.updatedAt || p.createdAt || new Date().toISOString(),
    slug: p.slug || slugify(p.name),
    metaTitle: p.metaTitle || p.name,
    metaDescription: p.metaDescription || (p.description || '').slice(0, 160),
    images: p.images || (p.image ? [p.image] : []),
    sold: p.sold || 0,
  }
}

function ensureProducts() {
  const existing = readJSON(PRODUCTS_KEY, null)
  if (existing && Array.isArray(existing) && existing.length > 0) {
    return existing.map(normalizeProduct)
  }
  const seeded = seedProducts.map(normalizeProduct)
  writeJSON(PRODUCTS_KEY, seeded)
  return seeded
}

function saveProducts(list) {
  writeJSON(PRODUCTS_KEY, list)
  return list
}

/**
 * Product service.
 * Hiện lưu localStorage (đồng bộ với cửa hàng).
 * Khi backend có API: bật VITE_USE_REMOTE_API=true và dùng các nhánh api.*.
 */
export const productService = {
  async getAll() {
    await delay()
    if (USE_REMOTE) {
      const { data } = await api.get('/admin/products')
      return data
    }
    return ensureProducts()
  },

  async getById(id) {
    await delay()
    if (USE_REMOTE) {
      const { data } = await api.get(`/admin/products/${id}`)
      return data
    }
    const product = ensureProducts().find((p) => String(p.id) === String(id))
    if (!product) throw new Error('Không tìm thấy sản phẩm')
    return product
  },

  async create(payload) {
    await delay()
    if (USE_REMOTE) {
      const { data } = await api.post('/admin/products', payload)
      return data
    }
    const list = ensureProducts()
    const id = Date.now()
    const product = normalizeProduct({
      id,
      name: payload.name,
      sku: payload.sku || `SKU-${id}`,
      price: Number(payload.price) || 0,
      oldPrice: Number(payload.oldPrice) || Number(payload.price) || 0,
      image: payload.image || payload.images?.[0] || '',
      images: payload.images || [],
      category: payload.category,
      description: payload.description || '',
      rating: Number(payload.rating) || 5,
      stock: Number(payload.stock) || 0,
      isFeatured: Boolean(payload.isFeatured),
      isNew: payload.isNew !== false,
      status: payload.status || 'active',
      slug: payload.slug || slugify(payload.name),
      metaTitle: payload.metaTitle || payload.name,
      metaDescription: payload.metaDescription || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sold: 0,
    })
    list.unshift(product)
    saveProducts(list)
    return product
  },

  async update(id, payload) {
    await delay()
    if (USE_REMOTE) {
      const { data } = await api.put(`/admin/products/${id}`, payload)
      return data
    }
    const list = ensureProducts()
    const idx = list.findIndex((p) => String(p.id) === String(id))
    if (idx === -1) throw new Error('Không tìm thấy sản phẩm')

    const updated = normalizeProduct({
      ...list[idx],
      ...payload,
      id: list[idx].id,
      price: Number(payload.price ?? list[idx].price),
      oldPrice: Number(payload.oldPrice ?? list[idx].oldPrice),
      stock: Number(payload.stock ?? list[idx].stock),
      image: payload.image || payload.images?.[0] || list[idx].image,
      images: payload.images || list[idx].images,
      updatedAt: new Date().toISOString(),
    })
    list[idx] = updated
    saveProducts(list)
    return updated
  },

  async remove(id) {
    await delay()
    if (USE_REMOTE) {
      await api.delete(`/admin/products/${id}`)
      return true
    }
    const list = ensureProducts().filter((p) => String(p.id) !== String(id))
    saveProducts(list)
    return true
  },
}

export default productService
