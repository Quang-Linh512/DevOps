import mongoose from 'mongoose'
import { config } from './config.js'
import { seedDatabase } from './seed.js'
import { createApp } from './app.js'

const app = createApp()

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
