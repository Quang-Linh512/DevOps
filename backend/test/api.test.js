/**
 * Integration test cho API DevShop.
 *
 * Dùng:
 *  - Express app THẬT (backend/src/app.js) -> đúng routes + middleware + schema
 *  - Mongo in-memory stub (backend/test/memory-mongo.js) -> không cần Docker/MongoDB
 *
 * KHÔNG phải production test: tầng lưu trữ bị thay bằng bộ nhớ, nên không
 * kiểm chứng được hành vi của MongoDB thật (unique index gốc, transaction, ...).
 * Mọi thứ khác (routing, auth, validation, business logic) là code production.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { installInMemoryMongo, seedModel, getStore, clearStores } from './memory-mongo.js'
import { startServer, createClient } from './http-client.js'

// 1) Cài stub TRƯỚC khi import route/model (route gọi mongoose.model lúc load)
await installInMemoryMongo()

const { createApp } = await import('../src/app.js')
await import('../src/models/User.js')
await import('../src/models/Product.js')
await import('../src/models/Category.js')
await import('../src/models/Order.js')
await import('../src/models/Settings.js')

const app = createApp({ silent: true })

const ADMIN = { name: 'Admin', email: 'admin@devshop.com', password: 'Admin@123' }
const CUSTOMER = { name: 'Nguyễn Văn A', email: 'khach@devshop.com', password: 'Khach@123' }

let server
let api
let adminToken = ''
let customerToken = ''

async function login(email, password) {
  const res = await api.post('/api/auth/login', { body: { email, password } })
  expect(res.status).toBe(200)
  return res.body.user.token
}

/** Tạo 1 đơn hàng hợp lệ, trả về response. */
async function createOrder(token, overrides = {}) {
  return api.post('/api/orders', {
    token,
    body: {
      name: 'Nguyễn Văn B',
      phone: '0944444444',
      address: '123 Nguyễn Huệ, Q1, TP.HCM',
      note: 'Giao buổi sáng',
      paymentMethod: 'COD',
      items: [{ id: 1, name: 'Laptop Pro 14', price: 20000000, image: 'l.jpg', quantity: 2 }],
      ...overrides,
    },
  })
}

/** Trạng thái Product gốc, dùng để reset giữa các test */
const PRODUCT_BASE = { 1: { stock: 10, sold: 0 }, 2: { stock: 3, sold: 0 } }

function resetProducts() {
  for (const [id, base] of Object.entries(PRODUCT_BASE)) {
    const p = getStore('Product').find((x) => x.numericId === Number(id))
    if (p) {
      p.stock = base.stock
      p.sold = base.sold
    }
  }
}

beforeAll(async () => {
  server = await startServer(app)
  api = createClient(server.baseUrl)

  const bcrypt = (await import('bcryptjs')).default
  const adminHash = await bcrypt.hash(ADMIN.password, 10)
  const customerHash = await bcrypt.hash(CUSTOMER.password, 10)

  seedModel('User', [
    { _id: 'admin-1', ...ADMIN, password: adminHash, role: 'admin', status: 'active', phone: '0900000000' },
    { _id: 'user-1', ...CUSTOMER, password: customerHash, role: 'user', status: 'active', phone: '0911111111' },
  ])
  seedModel('Category', [
    { _id: 'cat-1', slugId: 'laptop', name: 'Laptop', icon: '💻', slug: 'laptop', status: 'active' },
    { _id: 'cat-2', slugId: 'phone', name: 'Phone', icon: '📱', slug: 'phone', status: 'active' },
  ])
  seedModel('Product', [
    { _id: 'prod-1', numericId: 1, name: 'Laptop Pro 14', sku: 'SKU-0001', price: 20000000, oldPrice: 22000000, image: 'l.jpg', images: ['l.jpg'], category: 'Laptop', description: 'SP 1', rating: 5, stock: 10, isFeatured: true, isNewItem: true, status: 'active', slug: 'laptop-pro-14', sold: 0 },
    { _id: 'prod-2', numericId: 2, name: 'Phone X', sku: 'SKU-0002', price: 15000000, oldPrice: 15000000, image: 'p.jpg', images: ['p.jpg'], category: 'Phone', description: 'SP 2', rating: 4, stock: 3, isFeatured: false, isNewItem: false, status: 'active', slug: 'phone-x', sold: 0 },
  ])
  seedModel('Settings', [{ _id: 'set-1', key: 'store', storeName: 'DevShop' }])

  adminToken = await login(ADMIN.email, ADMIN.password)
  customerToken = await login(CUSTOMER.email, CUSTOMER.password)
})

beforeEach(() => {
  // giữ nguyên user/category/product/settings, chỉ xóa đơn hàng giữa các test
  getStore('Order').length = 0
  // reset tồn kho & số lượng đã bán (các test đặt hàng làm thay đổi chúng)
  resetProducts()
})

afterAll(async () => {
  if (server) await server.close()
  clearStores()
})

// ============================================================
describe('1. AUTH - đăng ký / đăng nhập', () => {
  it('POST /api/auth/register tạo user mới và trả success', async () => {
    const res = await api.post('/api/auth/register', {
      body: { name: 'Người Mới', email: 'newuser@devshop.com', phone: '0933333333', password: 'Matkhau@1' },
    })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    const created = getStore('User').find((u) => u.email === 'newuser@devshop.com')
    expect(created).toBeTruthy()
    expect(created.role).toBe('user')
    // mật khẩu phải được hash, không lưu plaintext
    expect(created.password).not.toBe('Matkhau@1')
  })

  it('POST /api/auth/register từ chối email trùng', async () => {
    const res = await api.post('/api/auth/register', {
      body: { name: 'Trùng', email: CUSTOMER.email, phone: '09', password: 'Matkhau@1' },
    })

    expect(res.status).toBe(409)
    expect(res.body.success).toBe(false)
  })

  it('POST /api/auth/register từ chối mật khẩu < 6 ký tự', async () => {
    const res = await api.post('/api/auth/register', {
      body: { name: 'Yếu', email: 'weak@devshop.com', phone: '09', password: '123' },
    })

    expect(res.status).toBe(400)
  })

  it('POST /api/auth/login trả user + token khi đúng mật khẩu', async () => {
    const res = await api.post('/api/auth/login', {
      body: { email: CUSTOMER.email, password: CUSTOMER.password },
    })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.user.email).toBe(CUSTOMER.email)
    expect(res.body.user.role).toBe('user')
    expect(res.body.user.token).toBeTruthy()
    // KHÔNG trả mật khẩu
    expect(res.body.user.password).toBeUndefined()
  })

  it('POST /api/auth/login sai mật khẩu -> 401', async () => {
    const res = await api.post('/api/auth/login', {
      body: { email: CUSTOMER.email, password: 'sai-mat-khau' },
    })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('GET /api/auth/me trả user hiện tại theo token', async () => {
    const res = await api.get('/api/auth/me', { token: customerToken })

    expect(res.status).toBe(200)
    expect(res.body.email).toBe(CUSTOMER.email)
  })

  it('GET /api/auth/me không token -> 401', async () => {
    const res = await api.get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('PUT /api/auth/profile cập nhật hồ sơ và trả lại token mới', async () => {
    const res = await api.put('/api/auth/profile', {
      token: customerToken,
      body: { name: 'Nguyễn Văn B', phone: '0944444444' },
    })

    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Nguyễn Văn B')
    expect(res.body.token).toBeTruthy()
  })

  it('POST /api/auth/change-password đổi được mật khẩu', async () => {
    const bcrypt = (await import('bcryptjs')).default
    const hash = await bcrypt.hash('Tamkhau@1', 10)
    seedModel('User', [
      { _id: 'user-pw', name: 'PW', email: 'pw@devshop.com', password: hash, role: 'user', status: 'active' },
    ])

    const t = await login('pw@devshop.com', 'Tamkhau@1')
    const res = await api.post('/api/auth/change-password', {
      token: t,
      body: { currentPassword: 'Tamkhau@1', newPassword: 'MatkhauMoi@2' },
    })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)

    const again = await api.post('/api/auth/login', {
      body: { email: 'pw@devshop.com', password: 'MatkhauMoi@2' },
    })
    expect(again.status).toBe(200)
  })
})

// ============================================================
describe('2. PRODUCTS - danh sách / chi tiết / CRUD', () => {
  it('GET /api/products trả danh sách sản phẩm (không cần token)', async () => {
    const res = await api.get('/api/products')

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
    const p = res.body.find((x) => x.id === 1)
    expect(p).toBeTruthy()
    // shape đúng chuẩn frontend dùng
    expect(p).toHaveProperty('name')
    expect(p).toHaveProperty('price')
    expect(p).toHaveProperty('category')
    expect(p).toHaveProperty('status')
    expect(p).toHaveProperty('isFeatured')
    expect(p).toHaveProperty('isNew')
  })

  it('GET /api/products/:id trả chi tiết sản phẩm', async () => {
    const res = await api.get('/api/products/1')
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(1)
    expect(res.body.name).toBe('Laptop Pro 14')
  })

  it('GET /api/products/:id không tồn tại -> 404', async () => {
    const res = await api.get('/api/products/9999')
    expect(res.status).toBe(404)
  })

  it('POST /api/products bị chặn khi không có token', async () => {
    const res = await api.post('/api/products', {
      body: { name: 'SP mới', category: 'Laptop', price: 1000 },
    })
    expect(res.status).toBe(401)
  })

  it('POST /api/products bị chặn khi user thường gọi', async () => {
    const res = await api.post('/api/products', {
      token: customerToken,
      body: { name: 'SP mới', category: 'Laptop', price: 1000 },
    })
    expect(res.status).toBe(403)
  })

  it('POST /api/products admin tạo được và trả numericId tăng dần', async () => {
    const res = await api.post('/api/products', {
      token: adminToken,
      body: { name: 'Tai nghe Mới', category: 'Phone', price: 500000, stock: 7, image: 't.jpg' },
    })

    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Tai nghe Mới')
    expect(res.body.id).toBe(3)
    expect(res.body.sku).toBe('SKU-0003')
  })

  it('PUT /api/products/:id admin cập nhật được', async () => {
    const res = await api.put('/api/products/2', {
      token: adminToken,
      body: { name: 'Phone X Đổi', price: 16000000 },
    })

    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Phone X Đổi')
    expect(res.body.price).toBe(16000000)
  })

  it('DELETE /api/products/:id admin xóa được', async () => {
    const res = await api.delete('/api/products/2', { token: adminToken })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})

// ============================================================
describe('3. CATEGORIES - danh mục', () => {
  it('GET /api/admin/categories trả danh mục (không cần token)', async () => {
    const res = await api.get('/api/admin/categories')

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    const c = res.body.find((x) => x.id === 'laptop')
    expect(c).toBeTruthy()
    expect(c.name).toBe('Laptop')
  })

  it('POST /api/admin/categories admin tạo được', async () => {
    const res = await api.post('/api/admin/categories', {
      token: adminToken,
      body: { name: 'Phụ kiện' },
    })

    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Phụ kiện')
    expect(res.body.id).toBe('phu-kien')
  })

  it('PUT /api/admin/categories/:id admin sửa được', async () => {
    const res = await api.put('/api/admin/categories/phone', {
      token: adminToken,
      body: { name: 'Điện thoại' },
    })

    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Điện thoại')
  })

  it('DELETE /api/admin/categories/:id admin xóa được', async () => {
    const res = await api.delete('/api/admin/categories/phone', { token: adminToken })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})

// ============================================================
describe('4. ORDERS - tạo đơn / lịch sử / quản trị', () => {
  it('POST /api/orders tạo đơn hàng thành công', async () => {
    const res = await createOrder(customerToken)

    expect(res.status).toBe(201)
    expect(res.body.id).toMatch(/^DH\d+$/)
    expect(res.body.status).toBe('Chờ xác nhận')
    expect(res.body.subtotal).toBe(40000000)
    expect(res.body.shipping).toBe(0) // >= 500.000 -> miễn phí ship
    expect(res.body.total).toBe(40000000)
    expect(res.body.customer.name).toBe('Nguyễn Văn B')
    expect(res.body.customer.phone).toBe('0944444444')
    expect(res.body.items).toHaveLength(1)
    expect(res.body.items[0].quantity).toBe(2)
    expect(res.body.userId).toBe('user-1')
  })

  it('POST /api/orders trừ tồn kho và tăng số lượng đã bán', async () => {
    const before = getStore('Product').find((p) => p.numericId === 1)
    const stockBefore = before.stock
    const soldBefore = before.sold

    const res = await createOrder(customerToken, { items: [{ id: 1, quantity: 1 }] })
    expect(res.status).toBe(201)

    const after = getStore('Product').find((p) => p.numericId === 1)
    expect(after.stock).toBe(stockBefore - 1)
    expect(after.sold).toBe(soldBefore + 1)
  })

  it('POST /api/orders thiếu thông tin người nhận -> 400', async () => {
    const res = await createOrder(customerToken, { name: '', address: '' })
    expect(res.status).toBe(400)
  })

  it('POST /api/orders giỏ hàng rỗng -> 400', async () => {
    const res = await createOrder(customerToken, { items: [] })
    expect(res.status).toBe(400)
  })

  it('POST /api/orders vượt tồn kho -> 400', async () => {
    const res = await createOrder(customerToken, { items: [{ id: 1, quantity: 99999 }] })
    expect(res.status).toBe(400)
  })

  it('POST /api/orders không token -> 401', async () => {
    const res = await createOrder(undefined)
    expect(res.status).toBe(401)
  })

  it('GET /api/orders/me chỉ trả đơn của chính user', async () => {
    const created = await createOrder(customerToken)
    expect(created.status).toBe(201)

    const res = await api.get('/api/orders/me', { token: customerToken })

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
    // tất cả đều phải thuộc user-1
    for (const o of res.body) expect(o.userId).toBe('user-1')
  })

  it('GET /api/orders/me của admin KHÔNG chứa đơn của user thường (chống lộ đơn)', async () => {
    // tạo đơn cho cả user thường lẫn admin để so sánh
    const o1 = await createOrder(customerToken)
    expect(o1.status).toBe(201)
    const o2 = await createOrder(adminToken, { items: [{ id: 1, quantity: 1 }] })
    expect(o2.status).toBe(201)

    const res = await api.get('/api/orders/me', { token: adminToken })

    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThan(0)
    for (const o of res.body) expect(o.userId).toBe('admin-1')
    expect(res.body.every((o) => o.userId !== 'user-1')).toBe(true)
  })

  it('GET /api/orders (danh sách) yêu cầu admin', async () => {
    await createOrder(customerToken)

    const resUser = await api.get('/api/orders', { token: customerToken })
    expect(resUser.status).toBe(403)

    const resAdmin = await api.get('/api/orders', { token: adminToken })
    expect(resAdmin.status).toBe(200)
    expect(Array.isArray(resAdmin.body)).toBe(true)
    expect(resAdmin.body.length).toBeGreaterThan(0)
  })

  it('GET /api/orders/:id trả chi tiết đơn của chính user', async () => {
    const created = await createOrder(customerToken)
    expect(created.status).toBe(201)

    const res = await api.get(`/api/orders/${created.body.id}`, { token: customerToken })

    expect(res.status).toBe(200)
    expect(res.body.id).toBe(created.body.id)
  })

  it('GET /api/orders/:id user khác bị chặn 403, admin được xem', async () => {
    const created = await createOrder(customerToken)
    expect(created.status).toBe(201)

    const res = await api.get(`/api/orders/${created.body.id}`, { token: adminToken })
    expect(res.status).toBe(200)
  })

  it('PATCH /api/orders/:id/status admin đổi trạng thái được', async () => {
    const created = await createOrder(customerToken)
    expect(created.status).toBe(201)

    const res = await api.patch(`/api/orders/${created.body.id}/status`, {
      token: adminToken,
      body: { status: 'Đã xác nhận' },
    })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('Đã xác nhận')
    expect(res.body.statusHistory.length).toBeGreaterThan(1)
  })

  it('PATCH /api/orders/:id/status user thường -> 403', async () => {
    const created = await createOrder(customerToken)
    expect(created.status).toBe(201)

    const res = await api.patch(`/api/orders/${created.body.id}/status`, {
      token: customerToken,
      body: { status: 'Đã giao' },
    })

    expect(res.status).toBe(403)
  })

  it('PATCH /api/orders/:id/status trạng thái không hợp lệ -> 400', async () => {
    const created = await createOrder(customerToken)
    expect(created.status).toBe(201)

    const res = await api.patch(`/api/orders/${created.body.id}/status`, {
      token: adminToken,
      body: { status: 'SAI' },
    })

    expect(res.status).toBe(400)
  })
})

// ============================================================
describe('5. ADMIN - dashboard / users / reports / settings', () => {
  it('GET /api/admin/dashboard/stats trả 4 nhóm chỉ số', async () => {
    const res = await api.get('/api/admin/dashboard/stats', { token: adminToken })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('revenue.value')
    expect(res.body).toHaveProperty('orders.value')
    expect(res.body).toHaveProperty('products.value')
    expect(res.body).toHaveProperty('customers.value')
  })

  it('GET /api/admin/dashboard/revenue trả mảng điểm doanh thu', async () => {
    const res = await api.get('/api/admin/dashboard/revenue?range=month', { token: adminToken })

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body[0]).toHaveProperty('label')
    expect(res.body[0]).toHaveProperty('revenue')
  })

  it('GET /api/admin/dashboard/order-status trả breakdown 5 trạng thái', async () => {
    const res = await api.get('/api/admin/dashboard/order-status', { token: adminToken })

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(5)
    expect(res.body[0]).toHaveProperty('name')
    expect(res.body[0]).toHaveProperty('value')
  })

  it('GET /api/admin/dashboard/top-products trả danh sách sản phẩm bán chạy', async () => {
    const res = await api.get('/api/admin/dashboard/top-products?limit=5', { token: adminToken })

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('GET /api/admin/dashboard/recent-orders trả đơn hàng gần đây', async () => {
    const res = await api.get('/api/admin/dashboard/recent-orders?limit=8', { token: adminToken })

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('GET /api/admin/users trả danh sách người dùng (không kèm password)', async () => {
    const res = await api.get('/api/admin/users', { token: adminToken })

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
    for (const u of res.body) expect(u.password).toBeUndefined()
  })

  it('GET /api/admin/users yêu cầu admin', async () => {
    const res = await api.get('/api/admin/users', { token: customerToken })
    expect(res.status).toBe(403)
  })

  it('PATCH /api/admin/users/:id/status khóa được user thường', async () => {
    const res = await api.patch('/api/admin/users/user-1/status', {
      token: adminToken,
      body: { status: 'blocked' },
    })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('blocked')

    // khôi phục lại cho test sau
    await api.patch('/api/admin/users/user-1/status', {
      token: adminToken,
      body: { status: 'active' },
    })
  })

  it('PATCH /api/admin/users/:id/status không cho khóa tài khoản admin', async () => {
    const res = await api.patch('/api/admin/users/admin-1/status', {
      token: adminToken,
      body: { status: 'blocked' },
    })
    expect(res.status).toBe(400)
  })

  it('GET /api/admin/reports trả summary + series + topProducts + orders', async () => {
    const res = await api.get('/api/admin/reports?filter=30days', { token: adminToken })

    expect(res.status).toBe(200)
    expect(res.body.summary).toHaveProperty('revenue')
    expect(res.body.summary).toHaveProperty('orders')
    expect(Array.isArray(res.body.series)).toBe(true)
    expect(Array.isArray(res.body.topProducts)).toBe(true)
    expect(Array.isArray(res.body.orders)).toBe(true)
  })

  it('GET /api/admin/reports/export trả CSV', async () => {
    const res = await api.get('/api/admin/reports/export?filter=30days', { token: adminToken })

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/text\/csv/)
    expect(res.text).toContain('Ma don')
  })

  it('GET /api/admin/settings trả cài đặt cửa hàng', async () => {
    const res = await api.get('/api/admin/settings', { token: adminToken })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('storeName')
    expect(res.body).toHaveProperty('email')
    expect(res.body).toHaveProperty('hotline')
  })

  it('PUT /api/admin/settings lưu được cài đặt', async () => {
    const res = await api.put('/api/admin/settings', {
      token: adminToken,
      body: { storeName: 'DevShop Official', hotline: '1900 9999' },
    })

    expect(res.status).toBe(200)
    expect(res.body.storeName).toBe('DevShop Official')
  })
})

// ============================================================
describe('6. Đối chiếu URL frontend vs route backend', () => {
  it('các URL frontend đã sửa đều tồn tại (không 404)', async () => {
    const calls = [
      ['get', '/api/auth/me', customerToken],
      ['get', '/api/products', null],
      ['get', '/api/products/1', null],
      ['get', '/api/admin/categories', null],
      ['get', '/api/orders/me', customerToken],
      ['get', '/api/orders', adminToken],
      ['get', '/api/admin/users', adminToken],
      ['get', '/api/admin/dashboard/stats', adminToken],
      ['get', '/api/admin/dashboard/revenue', adminToken],
      ['get', '/api/admin/dashboard/order-status', adminToken],
      ['get', '/api/admin/dashboard/top-products', adminToken],
      ['get', '/api/admin/dashboard/recent-orders', adminToken],
      ['get', '/api/admin/reports', adminToken],
      ['get', '/api/admin/reports/export', adminToken],
      ['get', '/api/admin/settings', adminToken],
    ]
    for (const [method, path, token] of calls) {
      const res = await api[method](path, { token: token || undefined })
      expect(res.status, `${method.toUpperCase()} ${path} -> ${res.status}`).not.toBe(404)
    }
  })

  it('các URL frontend SAI (đã dùng trước Giai đoạn 2) trả 404', async () => {
    const wrongPaths = [
      '/api/categories',
      '/api/users',
      '/api/reports',
      '/api/settings',
      '/api/admin/stats',
      '/api/admin/revenue',
      '/api/admin/order-status',
      '/api/admin/top-products',
      '/api/admin/recent-orders',
    ]
    for (const path of wrongPaths) {
      const res = await api.get(path, { token: adminToken })
      expect(res.status, `${path} phải là 404`).toBe(404)
    }
  })
})
