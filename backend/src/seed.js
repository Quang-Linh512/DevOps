import bcrypt from 'bcryptjs'
import { User } from './models/User.js'
import { Product } from './models/Product.js'
import { Category } from './models/Category.js'
import { Settings } from './models/Settings.js'
import { slugify } from './utils/helpers.js'
import seed from './data/seed.json' with { type: 'json' }

export async function seedDatabase() {
  // --- Admin account ---
  // Yêu cầu ADMIN_INITIAL_PASSWORD (biến môi trường, không nằm trong source).
  // Idempotent: chỉ tạo khi chưa tồn tại user có email admin@devshop.com.
  // Không phụ thuộc userCount === 0 nên vẫn tạo được admin trên DB đã có dữ liệu.
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD
  if (adminPassword) {
    const adminEmail = 'admin@devshop.com'
    const existingAdmin = await User.findOne({ email: adminEmail })
    if (!existingAdmin) {
      const password = await bcrypt.hash(adminPassword, 10)
      await User.create({
        name: 'Admin DevShop',
        email: adminEmail,
        phone: '0901234567',
        password,
        role: 'admin',
        status: 'active',
        address: '123 Đường DevOps, Quận 1, TP.HCM',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      })
      console.log('Seeded admin account: admin@devshop.com')
    } else {
      console.log('Admin account already exists, skipping admin seed')
    }
  } else {
    console.log('Skipping admin seed: ADMIN_INITIAL_PASSWORD not set')
  }

  if ((await Category.countDocuments()) === 0) {
    await Category.insertMany(
      seed.categories.map((c) => ({
        slugId: c.id,
        name: c.name,
        icon: c.icon || '📦',
        slug: c.id,
        description: '',
        status: 'active',
      }))
    )
    console.log(`Seeded ${seed.categories.length} categories`)
  }

  if ((await Product.countDocuments()) === 0) {
    await Product.insertMany(
      seed.products.map((p) => ({
        numericId: p.id,
        name: p.name,
        sku: `SKU-${String(p.id).padStart(4, '0')}`,
        price: p.price,
        oldPrice: p.oldPrice || p.price,
        image: p.image,
        images: p.image ? [p.image] : [],
        category: p.category,
        description: p.description || '',
        rating: p.rating ?? 5,
        stock: p.stock ?? 0,
        isFeatured: Boolean(p.isFeatured),
        isNewItem: p.isNew !== false,
        status: 'active',
        slug: slugify(p.name),
        metaTitle: p.name,
        metaDescription: (p.description || '').slice(0, 160),
        sold: 0,
      }))
    )
    console.log(`Seeded ${seed.products.length} products`)
  }

  if ((await Settings.countDocuments()) === 0) {
    await Settings.create({})
    console.log('Seeded store settings')
  }
}

/**
 * Tạo (hoặc nâng cấp lại) tài khoản admin mà KHÔNG đụng tới dữ liệu khác.
 * Dùng khi DB production đã có dữ liệu và không muốn chạy seed tổng.
 *
 * Dùng:  ADMIN_INITIAL_PASSWORD='...' npm run create-admin
 *        (hoặc node src/seed.js --create-admin)
 */
export async function createAdminAccount() {
  const password = process.env.ADMIN_INITIAL_PASSWORD
  if (!password) {
    console.error('ERROR: ADMIN_INITIAL_PASSWORD is required to create the admin account')
    process.exit(1)
  }
  if (password.length < 8) {
    console.error('ERROR: ADMIN_INITIAL_PASSWORD must be at least 8 characters')
    process.exit(1)
  }

  const email = 'admin@devshop.com'
  const existing = await User.findOne({ email })
  const hashed = await bcrypt.hash(password, 10)

  if (existing) {
    existing.password = hashed
    existing.role = 'admin'
    existing.status = 'active'
    await existing.save()
    console.log('Updated existing admin account: admin@devshop.com')
    return
  }

  await User.create({
    name: 'Admin DevShop',
    email,
    phone: '0901234567',
    password: hashed,
    role: 'admin',
    status: 'active',
    address: '123 Đường DevOps, Quận 1, TP.HCM',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  })
  console.log('Created admin account: admin@devshop.com')
}

// Cho phép chạy trực tiếp: node src/seed.js --create-admin
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  const mongoose = (await import('mongoose')).default
  const { config } = await import('./config.js')
  const run = async () => {
    // Validate MẬT KHẨU TRƯỚC khi kết nối DB để lỗi hiện ra ngay,
    // không treo chờ kết nối MongoDB.
    if (process.argv.includes('--create-admin')) {
      const pwd = process.env.ADMIN_INITIAL_PASSWORD
      if (!pwd) {
        console.error('ERROR: ADMIN_INITIAL_PASSWORD is required to create the admin account')
        process.exit(1)
      }
      if (pwd.length < 8) {
        console.error('ERROR: ADMIN_INITIAL_PASSWORD must be at least 8 characters')
        process.exit(1)
      }
    }

    await mongoose.connect(config.mongoUri)
    if (process.argv.includes('--create-admin')) {
      await createAdminAccount()
    } else {
      await seedDatabase()
    }
    await mongoose.disconnect()
    process.exit(0)
  }
  run().catch((err) => {
    console.error('Failed:', err.message)
    process.exit(1)
  })
}
