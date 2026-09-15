import api from './http'
import { delay, readJSON, writeJSON } from './storage'

export const ORDERS_KEY = 'devshop_orders'
const USE_REMOTE = import.meta.env.VITE_USE_REMOTE_API === 'true'

export const ORDER_STATUSES = [
  'Chờ xác nhận',
  'Đã xác nhận',
  'Đang giao',
  'Đã giao',
  'Đã hủy',
]

function getOrders() {
  return readJSON(ORDERS_KEY, [])
}

function saveOrders(list) {
  writeJSON(ORDERS_KEY, list)
  return list
}

export const orderService = {
  async getAll() {
    await delay()
    if (USE_REMOTE) {
      const { data } = await api.get('/admin/orders')
      return data
    }
    return getOrders()
  },

  async getById(id) {
    await delay()
    if (USE_REMOTE) {
      const { data } = await api.get(`/admin/orders/${id}`)
      return data
    }
    const order = getOrders().find((o) => String(o.id) === String(id))
    if (!order) throw new Error('Không tìm thấy đơn hàng')
    return order
  },

  async updateStatus(id, status) {
    await delay()
    if (USE_REMOTE) {
      const { data } = await api.patch(`/admin/orders/${id}/status`, { status })
      return data
    }
    if (!ORDER_STATUSES.includes(status)) {
      throw new Error('Trạng thái không hợp lệ')
    }
    const list = getOrders()
    const idx = list.findIndex((o) => String(o.id) === String(id))
    if (idx === -1) throw new Error('Không tìm thấy đơn hàng')

    const history = list[idx].statusHistory || [
      { status: list[idx].status, at: list[idx].createdAt },
    ]
    history.push({ status, at: new Date().toISOString() })

    list[idx] = {
      ...list[idx],
      status,
      statusHistory: history,
      updatedAt: new Date().toISOString(),
    }
    saveOrders(list)
    return list[idx]
  },
}

export default orderService
