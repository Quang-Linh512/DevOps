import { Router } from 'express'
import { Order, ORDER_STATUSES } from '../models/Order.js'
import { Product } from '../models/Product.js'
import { authRequired, adminRequired } from '../middleware/auth.js'
import { toOrderResponse } from '../utils/helpers.js'

const router = Router()

const SHIPPING_FEE = 30000
const FREE_SHIPPING_THRESHOLD = 500000

router.post('/', authRequired, async (req, res) => {
  try {
    const { name, phone, address, note, paymentMethod, items } = req.body
    if (!name?.trim() || !phone?.trim() || !address?.trim()) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin người nhận' })
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng trống' })
    }

    const normalized = []
    for (const item of items) {
      const product = await Product.findOne({ numericId: Number(item.id) })
      if (!product || product.status === 'inactive') {
        return res.status(400).json({ message: `Sản phẩm không hợp lệ: ${item.name || item.id}` })
      }
      const qty = Math.max(1, Number(item.quantity) || 1)
      if (product.stock < qty) {
        return res.status(400).json({ message: `${product.name} không đủ tồn kho` })
      }
      normalized.push({
        id: product.numericId,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: qty,
        _doc: product,
      })
    }

    const subtotal = normalized.reduce((s, i) => s + i.price * i.quantity, 0)
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
    const total = subtotal + shipping
    const orderCode = `DH${Date.now()}`
    const status = 'Chờ xác nhận'

    for (const item of normalized) {
      item._doc.stock -= item.quantity
      item._doc.sold = (item._doc.sold || 0) + item.quantity
      await item._doc.save()
      delete item._doc
    }

    const order = await Order.create({
      orderCode,
      userId: req.user._id,
      items: normalized,
      subtotal,
      shipping,
      total,
      status,
      paymentMethod: paymentMethod || 'COD',
      customer: {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        note: note || '',
      },
      statusHistory: [{ status, at: new Date() }],
    })

    res.status(201).json(toOrderResponse(order))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/me', authRequired, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 })
    res.json(orders.map(toOrderResponse))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/', authRequired, adminRequired, async (_req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 })
    res.json(orders.map(toOrderResponse))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/:id', authRequired, async (req, res) => {
  try {
    const order = await Order.findOne({ orderCode: req.params.id })
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' })
    const isOwner = String(order.userId) === String(req.user._id)
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền xem đơn này' })
    }
    res.json(toOrderResponse(order))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.patch('/:id/status', authRequired, adminRequired, async (req, res) => {
  try {
    const { status } = req.body
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' })
    }
    const order = await Order.findOne({ orderCode: req.params.id })
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' })
    order.status = status
    order.statusHistory = order.statusHistory || []
    order.statusHistory.push({ status, at: new Date() })
    await order.save()
    res.json(toOrderResponse(order))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
