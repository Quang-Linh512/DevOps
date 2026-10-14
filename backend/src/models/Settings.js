import mongoose from 'mongoose'

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'store', unique: true },
    storeName: { type: String, default: 'DevShop' },
    email: { type: String, default: 'support@devshop.com' },
    hotline: { type: String, default: '1900 1234' },
    address: { type: String, default: '123 Đường DevOps, Quận 1, TP.HCM' },
    logo: { type: String, default: '' },
    notifyNewOrder: { type: Boolean, default: true },
    notifyLowStock: { type: Boolean, default: true },
    notifyNewUser: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const Settings = mongoose.model('Settings', settingsSchema)
