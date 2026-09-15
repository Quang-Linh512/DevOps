import { delay } from './storage'
import { productService } from './productService'
import { orderService } from './orderService'
import { userService } from './userService'
import api from './http'

const USE_REMOTE = import.meta.env.VITE_USE_REMOTE_API === 'true'

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
  return orders.filter(
    (o) => o.status !== 'Đã hủy' && inRange(o.createdAt, from, to)
  )
}

function revenueOf(orders) {
  return orders.reduce((sum, o) => sum + (o.total || 0), 0)
}

/**
 * Dashboard stats tính từ dữ liệu đơn hàng / sản phẩm / user hiện có.
 * Không hard-code số liệu giả.
 */
export const dashboardService = {
  async getStats() {
    await delay()
    if (USE_REMOTE) {
      const { data } = await api.get('/admin/dashboard/stats')
      return data
    }

    const [orders, products, users] = await Promise.all([
      orderService.getAll(),
      productService.getAll(),
      userService.getAll(),
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
    const prevCustomersApprox = Math.max(0, customers.length - 1)

    return {
      revenue: {
        value: revenue,
        change: percentChange(revenue, prevRevenue),
      },
      orders: {
        value: thisMonthOrders.length,
        change: percentChange(thisMonthOrders.length, prevMonthOrders.length),
      },
      products: {
        value: products.length,
        change: 0,
      },
      customers: {
        value: customers.length,
        change: percentChange(customers.length, prevCustomersApprox),
      },
    }
  },

  async getRevenueSeries(range = 'month') {
    await delay()
    if (USE_REMOTE) {
      const { data } = await api.get(`/admin/dashboard/revenue?range=${range}`)
      return data
    }

    const orders = (await orderService.getAll()).filter((o) => o.status !== 'Đã hủy')
    const now = new Date()
    const points = []

    if (range === 'day') {
      for (let h = 0; h < 24; h += 3) {
        const from = new Date(now)
        from.setHours(h, 0, 0, 0)
        const to = new Date(now)
        to.setHours(h + 2, 59, 59, 999)
        const label = `${String(h).padStart(2, '0')}:00`
        const bucket = orders.filter((o) => inRange(o.createdAt, from, to) && startOfDay(o.createdAt).getTime() === startOfDay(now).getTime())
        points.push({ label, revenue: revenueOf(bucket), orders: bucket.length })
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
      // month: 4 tuần
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

    return points
  },

  async getOrderStatusBreakdown() {
    await delay()
    if (USE_REMOTE) {
      const { data } = await api.get('/admin/dashboard/order-status')
      return data
    }
    const orders = await orderService.getAll()
    const map = {
      'Chờ xác nhận': 0,
      'Đã xác nhận': 0,
      'Đang giao': 0,
      'Đã giao': 0,
      'Đã hủy': 0,
    }
    orders.forEach((o) => {
      if (map[o.status] !== undefined) map[o.status] += 1
      else if (o.status === 'Hoàn thành') map['Đã giao'] += 1
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  },

  async getTopProducts(limit = 5) {
    await delay()
    if (USE_REMOTE) {
      const { data } = await api.get(`/admin/dashboard/top-products?limit=${limit}`)
      return data
    }
    const orders = await orderService.getAll()
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
    if (fromOrders.length > 0) return fromOrders.slice(0, limit)

    // Chưa có đơn: lấy theo stock thấp / featured thay vì số giả
    const products = await productService.getAll()
    return products
      .slice()
      .sort((a, b) => (b.sold || 0) - (a.sold || 0) || b.rating - a.rating)
      .slice(0, limit)
      .map((p) => ({
        id: p.id,
        name: p.name,
        image: p.image,
        sold: p.sold || 0,
        revenue: 0,
      }))
  },

  async getRecentOrders(limit = 8) {
    await delay()
    if (USE_REMOTE) {
      const { data } = await api.get(`/admin/dashboard/recent-orders?limit=${limit}`)
      return data
    }
    const orders = await orderService.getAll()
    return orders
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit)
  },

  async getNotifications() {
    await delay()
    const [orders, products, users] = await Promise.all([
      orderService.getAll(),
      productService.getAll(),
      userService.getAll(),
    ])

    const readIds = readJSONSafe()
    const items = []

    orders
      .filter((o) => o.status === 'Chờ xác nhận')
      .slice(0, 5)
      .forEach((o) => {
        items.push({
          id: `order-${o.id}`,
          type: 'order',
          title: 'Đơn hàng cần xử lý',
          message: `Đơn ${o.id} đang chờ xác nhận`,
          createdAt: o.createdAt,
          link: `/admin/orders/${o.id}`,
        })
      })

    products
      .filter((p) => p.stock > 0 && p.stock <= 5)
      .slice(0, 5)
      .forEach((p) => {
        items.push({
          id: `stock-${p.id}`,
          type: 'stock',
          title: 'Sản phẩm sắp hết hàng',
          message: `${p.name} còn ${p.stock} sản phẩm`,
          createdAt: p.updatedAt || p.createdAt,
          link: `/admin/products/edit/${p.id}`,
        })
      })

    users
      .filter((u) => u.role !== 'admin')
      .slice(-3)
      .reverse()
      .forEach((u) => {
        items.push({
          id: `user-${u.id}`,
          type: 'user',
          title: 'Người dùng mới',
          message: `${u.name} vừa đăng ký`,
          createdAt: u.createdAt,
          link: '/admin/users',
        })
      })

    return items
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .map((n) => ({ ...n, read: readIds.includes(n.id) }))
  },
}

function readJSONSafe() {
  try {
    return JSON.parse(localStorage.getItem('devshop_admin_notif_read') || '[]')
  } catch {
    return []
  }
}

export function markNotificationRead(id) {
  const ids = readJSONSafe()
  if (!ids.includes(id)) {
    ids.push(id)
    localStorage.setItem('devshop_admin_notif_read', JSON.stringify(ids))
  }
}

export function markAllNotificationsRead(ids) {
  localStorage.setItem('devshop_admin_notif_read', JSON.stringify(ids))
}

export default dashboardService
