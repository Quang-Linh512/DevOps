import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    numericId: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    sku: { type: String, default: '' },
    price: { type: Number, required: true },
    oldPrice: { type: Number, default: 0 },
    image: { type: String, default: '' },
    images: { type: [String], default: [] },
    category: { type: String, required: true },
    description: { type: String, default: '' },
    rating: { type: Number, default: 5 },
    stock: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isNewItem: { type: Boolean, default: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    slug: { type: String, default: '' },
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    sold: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export const Product = mongoose.model('Product', productSchema)
