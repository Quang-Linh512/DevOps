import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import mongoose from 'mongoose'
import { config } from './config.js'
import { seedDatabase } from './seed.js'
import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import categoryRoutes from './routes/categories.js'
import orderRoutes from './routes/orders.js'
import userRoutes from './routes/users.js'
import adminRoutes from './routes/admin.js'

const app = express()

app.use(
  cors({
    origin: config.corsOrigin.includes('*') ? true : config.corsOrigin,
    credentials: true,
  })
)
app.use(express.json({ limit: '2mb' }))
app.use(morgan('dev'))

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

async function start() {
  await mongoose.connect(config.mongoUri)
  console.log('MongoDB connected')

  if (config.seedOnStart) {
    await seedDatabase()
  }

  app.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}`)
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
