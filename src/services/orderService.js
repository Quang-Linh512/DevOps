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
    await delay(100)
    if (USE_REMOTE) {
      try {
        // GET /api/orders yêu cầu quyền admin -> dùng cho trang quản trị đơn hàng
        const response = await api.get('/orders')
        return response.data || []
      } catch (error) {
        console.error('Failed to fetch orders:', error)
        throw new Error(error.response?.data?.message || 'Không thể tải đơn hàng')
      }
    }
    return getOrders()
  },

  async getMine() {
    await delay(100)
    if (USE_REMOTE) {
      try {
        // GET /api/orders/me trả về đơn hàng của chính người đang đăng nhập
        const response = await api.get('/orders/me')
        return response.data || []
      } catch (error) {
        console.error('Failed to fetch my orders:', error)
        throw new Error(error.response?.data?.message || 'Không thể tải đơn hàng của bạn')
      }
    }
    return getOrders()
  },

  async getById(id) {
    await delay(100)
    if (USE_REMOTE) {
      try {
        const response = await api.get(`/orders/${id}`)
        return response.data
      } catch (error) {
        console.error('Failed to fetch order:', error)
        throw new Error(error.response?.data?.message || 'Không tìm thấy đơn hàng')
      }
    }
    const order = getOrders().find((o) => String(o.id) === String(id))
    if (!order) throw new Error('Không tìm thấy đơn hàng')
    return order
  },

  async create(orderData) {
    await delay()
    if (USE_REMOTE) {
      try {
        // Backend (routes/orders.js) đọc: name, phone, address, note, paymentMethod, items
        const response = await api.post('/orders', {
          name: orderData.name,
          phone: orderData.phone,
          address: orderData.address,
          note: orderData.note || '',
          paymentMethod: orderData.paymentMethod || 'COD',
          items: orderData.items,
        })
        return response.data.order || response.data
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Không thể tạo đơn hàng')
      }
    }
    // LocalStorage fallback
    const orders = getOrders()
    const order = {
      id: `DH${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...orderData,
      status: 'Chờ xác nhận',
      statusHistory: [{ status: 'Chờ xác nhận', at: new Date().toISOString() }],
    }
    orders.unshift(order)
    saveOrders(orders)
    return order
  },

  async updateStatus(id, status) {
    await delay()
    if (USE_REMOTE) {
      try {
        const response = await api.patch(`/orders/${id}/status`, { status })
        return response.data.order || response.data
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Không thể cập nhật trạng thái')
      }
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
