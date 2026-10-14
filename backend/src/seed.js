import bcrypt from 'bcryptjs'
import { User } from './models/User.js'
import { Product } from './models/Product.js'
import { Category } from './models/Category.js'
import { Settings } from './models/Settings.js'
import { slugify } from './utils/helpers.js'
import seed from './data/seed.json' with { type: 'json' }

export async function seedDatabase() {
  const userCount = await User.countDocuments()

  // Admin account: requires ADMIN_INITIAL_PASSWORD env var
  // If not set, skip creating admin (production safe)
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD
  if (userCount === 0) {
    if (adminPassword) {
      const password = await bcrypt.hash(adminPassword, 10)
      await User.create({
        name: 'Admin DevShop',
        email: 'admin@devshop.com',
        phone: '0901234567',
        password,
        role: 'admin',
        status: 'active',
        address: '123 Đường DevOps, Quận 1, TP.HCM',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      })
      console.log('Seeded admin: admin@devshop.com (password from ADMIN_INITIAL_PASSWORD)')
    } else {
      console.log('Skipping admin seed: ADMIN_INITIAL_PASSWORD not set')
    }
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
