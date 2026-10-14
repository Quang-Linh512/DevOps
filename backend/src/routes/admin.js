import { Router } from 'express'
import { Order } from '../models/Order.js'
import { Product } from '../models/Product.js'
import { User } from '../models/User.js'
import { Settings } from '../models/Settings.js'
import { authRequired, adminRequired } from '../middleware/auth.js'
import { toOrderResponse, toProductResponse } from '../utils/helpers.js'

const router = Router()

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function inRange(dateStr, from, to) {
  const t = new Date(dateStr).getTime()
  return t >= from.getTime() && t <= to.getTime()
}

function percentChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0
  return Number((((current - previous) / previous) * 100).toFixed(1))
}

function filterOrders(orders, from, to) {
  return orders.filter((o) => o.status !== 'Đã hủy' && inRange(o.createdAt, from, to))
}

function revenueOf(orders) {
  return orders.reduce((sum, o) => sum + (o.total || 0), 0)
}

function getRangeDates(filter) {
  const now = new Date()
  const to = now
  const from = new Date(now)
  switch (filter) {
    case 'today':
      from.setHours(0, 0, 0, 0)
      break
    case '7days':
      from.setDate(now.getDate() - 6)
      from.setHours(0, 0, 0, 0)
      break
    case '30days':
      from.setDate(now.getDate() - 29)
      from.setHours(0, 0, 0, 0)
      break
    case 'month':
      from.setDate(1)
      from.setHours(0, 0, 0, 0)
      break
    case 'year':
      from.setMonth(0, 1)
      from.setHours(0, 0, 0, 0)
      break
    default:
      from.setDate(now.getDate() - 29)
      from.setHours(0, 0, 0, 0)
  }
  return { from, to }
}

router.get('/dashboard/stats', authRequired, adminRequired, async (_req, res) => {
  try {
    const [orders, products, users] = await Promise.all([
      Order.find(),
      Product.find(),
      User.find(),
    ])
    const now = new Date()
    const thisMonthFrom = new Date(now.getFullYear(), now.getMonth(), 1)
    const prevMonthFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevMonthTo = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    const thisMonthOrders = filterOrders(orders, thisMonthFrom, now)
    const prevMonthOrders = filterOrders(orders, prevMonthFrom, prevMonthTo)
    const revenue = revenueOf(thisMonthOrders)
    const prevRevenue = revenueOf(prevMonthOrders)
    const customers = users.filter((u) => u.role !== 'admin')
    res.json({
      revenue: { value: revenue, change: percentChange(revenue, prevRevenue) },
      orders: {
        value: thisMonthOrders.length,
        change: percentChange(thisMonthOrders.length, prevMonthOrders.length),
      },
      products: { value: products.length, change: 0 },
      customers: {
        value: customers.length,
        change: percentChange(customers.length, Math.max(0, customers.length - 1)),
      },
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/dashboard/revenue', authRequired, adminRequired, async (req, res) => {
  try {
    const range = req.query.range || 'month'
    const orders = (await Order.find()).filter((o) => o.status !== 'Đã hủy')
    const now = new Date()
    const points = []

    if (range === 'day') {
      for (let h = 0; h < 24; h += 3) {
        const from = new Date(now)
        from.setHours(h, 0, 0, 0)
        const to = new Date(now)
        to.setHours(h + 2, 59, 59, 999)
        const bucket = orders.filter(
          (o) =>
            inRange(o.createdAt, from, to) &&
            startOfDay(o.createdAt).getTime() === startOfDay(now).getTime()
        )
        points.push({
          label: `${String(h).padStart(2, '0')}:00`,
          revenue: revenueOf(bucket),
          orders: bucket.length,
        })
      }
    } else if (range === 'week') {
      for (let i = 6; i >= 0; i -= 1) {
        const day = new Date(now)
        day.setDate(now.getDate() - i)
        const from = startOfDay(day)
        const to = new Date(from)
        to.setHours(23, 59, 59, 999)
        const bucket = orders.filter((o) => inRange(o.createdAt, from, to))
        points.push({
          label: from.toLocaleDateString('vi-VN', { weekday: 'short' }),
          revenue: revenueOf(bucket),
          orders: bucket.length,
        })
      }
    } else {
      for (let i = 3; i >= 0; i -= 1) {
        const to = new Date(now)
        to.setDate(now.getDate() - i * 7)
        const from = new Date(to)
        from.setDate(to.getDate() - 6)
        from.setHours(0, 0, 0, 0)
        to.setHours(23, 59, 59, 999)
        const bucket = orders.filter((o) => inRange(o.createdAt, from, to))
        points.push({
          label: `Tuần ${4 - i}`,
          revenue: revenueOf(bucket),
          orders: bucket.length,
        })
      }
    }
    res.json(points)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/dashboard/order-status', authRequired, adminRequired, async (_req, res) => {
  try {
    const orders = await Order.find()
    const map = {
      'Chờ xác nhận': 0,
      'Đã xác nhận': 0,
      'Đang giao': 0,
      'Đã giao': 0,
      'Đã hủy': 0,
    }
    orders.forEach((o) => {
      if (map[o.status] !== undefined) map[o.status] += 1
    })
    res.json(Object.entries(map).map(([name, value]) => ({ name, value })))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/dashboard/top-products', authRequired, adminRequired, async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 5
    const orders = await Order.find()
    const soldMap = {}
    orders
      .filter((o) => o.status !== 'Đã hủy')
      .forEach((o) => {
        ;(o.items || []).forEach((item) => {
          if (!soldMap[item.id]) {
            soldMap[item.id] = {
              id: item.id,
              name: item.name,
              image: item.image,
              sold: 0,
              revenue: 0,
            }
          }
          soldMap[item.id].sold += item.quantity
          soldMap[item.id].revenue += item.price * item.quantity
        })
      })
    const fromOrders = Object.values(soldMap).sort((a, b) => b.sold - a.sold)
    if (fromOrders.length > 0) return res.json(fromOrders.slice(0, limit))

    const products = await Product.find().sort({ sold: -1, rating: -1 }).limit(limit)
    res.json(
      products.map((p) => ({
        id: p.numericId,
        name: p.name,
        image: p.image,
        sold: p.sold || 0,
        revenue: 0,
      }))
    )
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/dashboard/recent-orders', authRequired, adminRequired, async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 8
    const orders = await Order.find().sort({ createdAt: -1 }).limit(limit)
    res.json(orders.map(toOrderResponse))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/reports', authRequired, adminRequired, async (req, res) => {
  try {
    const filter = req.query.filter || '30days'
    const { from, to } = getRangeDates(filter)
    const [orders, products, users] = await Promise.all([
      Order.find(),
      Product.find(),
      User.find(),
    ])
    const ranged = orders.filter((o) => {
      const t = new Date(o.createdAt).getTime()
      return t >= from.getTime() && t <= to.getTime()
    })
    const valid = ranged.filter((o) => o.status !== 'Đã hủy')
    const revenue = valid.reduce((s, o) => s + o.total, 0)
    const soldMap = {}
    valid.forEach((o) => {
      ;(o.items || []).forEach((item) => {
        if (!soldMap[item.id]) {
          soldMap[item.id] = { id: item.id, name: item.name, sold: 0, revenue: 0 }
        }
        soldMap[item.id].sold += item.quantity
        soldMap[item.id].revenue += item.price * item.quantity
      })
    })
    const seriesMap = {}
    valid.forEach((o) => {
      const key = new Date(o.createdAt).toLocaleDateString('vi-VN')
      if (!seriesMap[key]) seriesMap[key] = { label: key, revenue: 0, orders: 0 }
      seriesMap[key].revenue += o.total
      seriesMap[key].orders += 1
    })
    res.json({
      summary: {
        revenue,
        orders: ranged.length,
        products: products.length,
        customers: users.filter((u) => u.role !== 'admin').length,
        completed: ranged.filter((o) => o.status === 'Đã giao').length,
        cancelled: ranged.filter((o) => o.status === 'Đã hủy').length,
      },
      series: Object.values(seriesMap),
      topProducts: Object.values(soldMap)
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 10),
      orders: ranged
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(toOrderResponse),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/reports/export', authRequired, adminRequired, async (req, res) => {
  try {
    const filter = req.query.filter || '30days'
    const { from, to } = getRangeDates(filter)
    const orders = await Order.find()
    const ranged = orders.filter((o) => {
      const t = new Date(o.createdAt).getTime()
      return t >= from.getTime() && t <= to.getTime()
    })
    const rows = [
      ['Ma don', 'Ngay dat', 'Khach hang', 'Tong tien', 'Trang thai', 'Thanh toan'],
      ...ranged.map((o) => [
        o.orderCode,
        new Date(o.createdAt).toLocaleString('vi-VN'),
        o.customer?.name || '',
        o.total,
        o.status,
        o.paymentMethod,
      ]),
    ]
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    res.setHeader('Content-Type', 'text/csv;charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="report-${filter}.csv"`)
    res.send(csv)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/settings', authRequired, adminRequired, async (_req, res) => {
  try {
    let settings = await Settings.findOne({ key: 'store' })
    if (!settings) settings = await Settings.create({})
    res.json({
      storeName: settings.storeName,
      email: settings.email,
      hotline: settings.hotline,
      address: settings.address,
      logo: settings.logo,
      notifyNewOrder: settings.notifyNewOrder,
      notifyLowStock: settings.notifyLowStock,
      notifyNewUser: settings.notifyNewUser,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.put('/settings', authRequired, adminRequired, async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: 'store' })
    if (!settings) settings = new Settings({ key: 'store' })
    Object.assign(settings, {
      storeName: req.body.storeName ?? settings.storeName,
      email: req.body.email ?? settings.email,
      hotline: req.body.hotline ?? settings.hotline,
      address: req.body.address ?? settings.address,
      logo: req.body.logo ?? settings.logo,
      notifyNewOrder: req.body.notifyNewOrder ?? settings.notifyNewOrder,
      notifyLowStock: req.body.notifyLowStock ?? settings.notifyLowStock,
      notifyNewUser: req.body.notifyNewUser ?? settings.notifyNewUser,
    })
    await settings.save()
    res.json({
      storeName: settings.storeName,
      email: settings.email,
      hotline: settings.hotline,
      address: settings.address,
      logo: settings.logo,
      notifyNewOrder: settings.notifyNewOrder,
      notifyLowStock: settings.notifyLowStock,
      notifyNewUser: settings.notifyNewUser,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
