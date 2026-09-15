import api from './http'
import { delay } from './storage'
import { orderService } from './orderService'
import { productService } from './productService'
import { userService } from './userService'
import { formatPrice } from '../data/products'

const USE_REMOTE = import.meta.env.VITE_USE_REMOTE_API === 'true'

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

export const reportService = {
  async getReport(filter = '30days') {
    await delay()
    if (USE_REMOTE) {
      const { data } = await api.get(`/admin/reports?filter=${filter}`)
      return data
    }

    const { from, to } = getRangeDates(filter)
    const [orders, products, users] = await Promise.all([
      orderService.getAll(),
      productService.getAll(),
      userService.getAll(),
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

    return {
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
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    }
  },

  /**
   * Export CSV phía client.
   * Khi backend có /admin/reports/export thì chuyển sang tải file từ API.
   */
  async exportCSV(filter = '30days') {
    if (USE_REMOTE) {
      const { data } = await api.get(`/admin/reports/export?filter=${filter}`, {
        responseType: 'blob',
      })
      return data
    }

    const report = await this.getReport(filter)
    const rows = [
      ['Ma don', 'Ngay dat', 'Khach hang', 'Tong tien', 'Trang thai', 'Thanh toan'],
      ...report.orders.map((o) => [
        o.id,
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
    return new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  },

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  },

  formatMoney: formatPrice,
}

export default reportService
