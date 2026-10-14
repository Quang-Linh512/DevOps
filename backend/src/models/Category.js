import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema(
  {
    slugId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    icon: { type: String, default: '📦' },
    slug: { type: String, default: '' },
    description: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
)

export const Category = mongoose.model('Category', categorySchema)
