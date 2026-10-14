import dotenv from 'dotenv'

dotenv.config()

const isProduction = process.env.NODE_ENV === 'production'

// Production: JWT_SECRET is required
if (isProduction) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
    console.error('FATAL: JWT_SECRET is required in production environment')
    console.error('Set JWT_SECRET environment variable or add it to your .env file')
    process.exit(1)
  }
}

export const config = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/devops-shop',
  jwtSecret: process.env.JWT_SECRET || 'devshop-dev-secret',
  corsOrigin: (process.env.CORS_ORIGIN || '*')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  seedOnStart: process.env.SEED_ON_START !== 'false',
}
