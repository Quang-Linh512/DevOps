import { Router } from 'express'
import { Category } from '../models/Category.js'
import { authRequired, adminRequired } from '../middleware/auth.js'
import { slugify, toCategoryResponse } from '../utils/helpers.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const list = await Category.find().sort({ createdAt: 1 })
    res.json(list.map(toCategoryResponse))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', authRequired, adminRequired, async (req, res) => {
  try {
    const name = String(req.body.name || '').trim()
    if (!name) return res.status(400).json({ message: 'Tên danh mục bắt buộc' })
    const slugId = req.body.id || slugify(name) || `cat-${Date.now()}`
    const item = await Category.create({
      slugId,
      name,
      slug: req.body.slug || slugify(name),
      description: req.body.description || '',
      status: req.body.status || 'active',
      icon: req.body.icon || '📦',
    })
    res.status(201).json(toCategoryResponse(item))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.put('/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const item = await Category.findOne({ slugId: req.params.id })
    if (!item) return res.status(404).json({ message: 'Không tìm thấy danh mục' })
    Object.assign(item, {
      name: req.body.name ?? item.name,
      slug: req.body.slug || slugify(req.body.name || item.name),
      description: req.body.description ?? item.description,
      status: req.body.status ?? item.status,
      icon: req.body.icon ?? item.icon,
    })
    await item.save()
    res.json(toCategoryResponse(item))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.delete('/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const deleted = await Category.findOneAndDelete({ slugId: req.params.id })
    if (!deleted) return res.status(404).json({ message: 'Không tìm thấy danh mục' })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
