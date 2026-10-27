import api from './http'
import { delay } from './storage'
import { formatPrice } from '../data/products'

const USE_REMOTE = import.meta.env.VITE_USE_REMOTE_API === 'true'

export const reportService = {
  async getReport(filter = '30days') {
    await delay(100)
    if (USE_REMOTE) {
      try {
        // Backend mount báo cáo tại /api/admin/reports (routes/admin.js)
        const response = await api.get(`/admin/reports?filter=${filter}`)
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
        const response = await api.get(`/admin/reports/export?filter=${filter}`, {
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
