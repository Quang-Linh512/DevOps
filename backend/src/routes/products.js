import { Router } from 'express'
import { Product } from '../models/Product.js'
import { authRequired, adminRequired } from '../middleware/auth.js'
import { slugify, toProductResponse } from '../utils/helpers.js'

const router = Router()

async function nextNumericId() {
  const last = await Product.findOne().sort({ numericId: -1 }).lean()
  return (last?.numericId || 0) + 1
}

router.get('/', async (req, res) => {
  try {
    const list = await Product.find().sort({ createdAt: -1 })
    res.json(list.map(toProductResponse))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ numericId: Number(req.params.id) })
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' })
    res.json(toProductResponse(product))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', authRequired, adminRequired, async (req, res) => {
  try {
    const id = await nextNumericId()
    const payload = req.body
    const product = await Product.create({
      numericId: id,
      name: payload.name,
      sku: payload.sku || `SKU-${String(id).padStart(4, '0')}`,
      price: Number(payload.price) || 0,
      oldPrice: Number(payload.oldPrice) || Number(payload.price) || 0,
      image: payload.image || payload.images?.[0] || '',
      images: payload.images || [],
      category: payload.category,
      description: payload.description || '',
      rating: Number(payload.rating) || 5,
      stock: Number(payload.stock) || 0,
      isFeatured: Boolean(payload.isFeatured),
      isNewItem: payload.isNew !== false,
      status: payload.status || 'active',
      slug: payload.slug || slugify(payload.name),
      metaTitle: payload.metaTitle || payload.name,
      metaDescription: payload.metaDescription || '',
      sold: 0,
    })
    res.status(201).json(toProductResponse(product))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.put('/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const product = await Product.findOne({ numericId: Number(req.params.id) })
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' })
    const payload = req.body
    Object.assign(product, {
      name: payload.name ?? product.name,
      sku: payload.sku ?? product.sku,
      price: Number(payload.price ?? product.price),
      oldPrice: Number(payload.oldPrice ?? product.oldPrice),
      stock: Number(payload.stock ?? product.stock),
      category: payload.category ?? product.category,
      description: payload.description ?? product.description,
      rating: Number(payload.rating ?? product.rating),
      isFeatured: payload.isFeatured !== undefined ? Boolean(payload.isFeatured) : product.isFeatured,
      isNewItem: payload.isNew !== undefined ? Boolean(payload.isNew) : product.isNewItem,
      status: payload.status ?? product.status,
      slug: payload.slug || slugify(payload.name || product.name),
      metaTitle: payload.metaTitle ?? product.metaTitle,
      metaDescription: payload.metaDescription ?? product.metaDescription,
      image: payload.image || payload.images?.[0] || product.image,
      images: payload.images || product.images,
    })
    await product.save()
    res.json(toProductResponse(product))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.delete('/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const deleted = await Product.findOneAndDelete({ numericId: Number(req.params.id) })
    if (!deleted) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
