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
    await delay(100)
    if (USE_REMOTE) {
      try {
        const response = await api.get(`/reports?filter=${filter}`)
        return response.data
      } catch (error) {
        console.error('Failed to fetch report:', error)
        return getFallbackReport()
      }
    }
    return getFallbackReport()
  },

  async exportCSV(filter = '30days') {
    if (USE_REMOTE) {
      try {
        const response = await api.get(`/reports/export?filter=${filter}`, {
          responseType: 'blob',
        })
        return response.data
      } catch (error) {
        console.error('Failed to export CSV:', error)
        throw error
      }
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

function getFallbackReport() {
  return {
    summary: {
      revenue: 0,
      orders: 0,
      products: 0,
      customers: 0,
      completed: 0,
      cancelled: 0,
    },
    series: [],
    topProducts: [],
    orders: [],
  }
}

export default reportService
