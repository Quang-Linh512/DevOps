import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { config } from './config.js'
import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import categoryRoutes from './routes/categories.js'
import orderRoutes from './routes/orders.js'
import userRoutes from './routes/users.js'
import adminRoutes from './routes/admin.js'

/**
 * Khởi tạo Express app với đầy đủ middleware và routes.
 *
 * Tách riêng khỏi index.js để:
 *  - index.js chỉ lo phần kết nối DB / listen (hành vi production giữ nguyên)
 *  - test có thể mount đúng app + đúng routes/middleware của production
 *    mà không cần chạy server thật.
 *
 * @param {{ silent?: boolean }} [options] silent=true -> tắt log morgan (dùng cho test)
 */
export function createApp(options = {}) {
  const app = express()

  app.use(
    cors({
      origin: config.corsOrigin.includes('*') ? true : config.corsOrigin,
      credentials: true,
    })
  )
  app.use(express.json({ limit: '2mb' }))
  if (!options.silent) app.use(morgan('dev'))

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'devops-shop-api' })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/products', productRoutes)
  app.use('/api/orders', orderRoutes)
  app.use('/api/admin/products', productRoutes)
  app.use('/api/admin/categories', categoryRoutes)
  app.use('/api/admin/orders', orderRoutes)
  app.use('/api/admin/users', userRoutes)
  app.use('/api/admin', adminRoutes)

  app.use((err, _req, res, _next) => {
    console.error(err)
    res.status(500).json({ message: err.message || 'Internal Server Error' })
  })

  return app
}

export default createApp
