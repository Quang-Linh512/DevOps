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
 */
export const dashboardService = {
  async getStats() {
    await delay(100)
    if (USE_REMOTE) {
      try {
        const response = await api.get('/admin/stats')
        return response.data
      } catch (error) {
        console.error('Failed to fetch stats:', error)
        return getFallbackStats()
      }
    }
    return getFallbackStats()
  },

  async getRevenueSeries(range = 'month') {
    await delay(100)
    if (USE_REMOTE) {
      try {
        const response = await api.get(`/admin/revenue?range=${range}`)
        return response.data
      } catch (error) {
        console.error('Failed to fetch revenue series:', error)
        return []
      }
    }
    return []
  },

  async getOrderStatusBreakdown() {
    await delay(100)
    if (USE_REMOTE) {
      try {
        const response = await api.get('/admin/order-status')
        return response.data
      } catch (error) {
        console.error('Failed to fetch order status:', error)
        return []
      }
    }
    return []
  },

  async getTopProducts(limit = 5) {
    await delay(100)
    if (USE_REMOTE) {
      try {
        const response = await api.get(`/admin/top-products?limit=${limit}`)
        return response.data
      } catch (error) {
        console.error('Failed to fetch top products:', error)
        return []
      }
    }
    return []
  },

  async getRecentOrders(limit = 8) {
    await delay(100)
    if (USE_REMOTE) {
      try {
        const response = await api.get(`/admin/recent-orders?limit=${limit}`)
        return response.data
      } catch (error) {
        console.error('Failed to fetch recent orders:', error)
        return []
      }
    }
    return []
  },

  async getNotifications() {
    await delay(100)
    if (USE_REMOTE) {
      try {
        // Notifications calculated from orders/products/users
        const [orders, products, users] = await Promise.all([
          orderService.getAll(),
          productService.getAll(),
          userService.getAll(),
        ])
        return buildNotifications(orders, products, users)
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
        return []
      }
    }
    // LocalStorage fallback
    const orders = orderService.getAll()
    const products = productService.getAll()
    const users = userService.getAll()
    return buildNotifications(orders, products, users)
  },
}

function buildNotifications(orders, products, users) {
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
}

function getFallbackStats() {
  return {
    revenue: { value: 0, change: 0 },
    orders: { value: 0, change: 0 },
    products: { value: 0, change: 0 },
    customers: { value: 0, change: 0 },
  }
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
