import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    status: { type: String, enum: ['active', 'blocked'], default: 'active' },
    address: { type: String, default: '' },
    avatar: { type: String, default: '' },
  },
  { timestamps: true }
)

export const User = mongoose.model('User', userSchema)
