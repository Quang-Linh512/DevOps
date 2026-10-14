import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    name: String,
    price: Number,
    image: String,
    quantity: Number,
  },
  { _id: false }
)

const orderSchema = new mongoose.Schema(
  {
    orderCode: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    subtotal: Number,
    shipping: Number,
    total: Number,
    status: {
      type: String,
      enum: ['Chờ xác nhận', 'Đã xác nhận', 'Đang giao', 'Đã giao', 'Đã hủy'],
      default: 'Chờ xác nhận',
    },
    paymentMethod: { type: String, default: 'COD' },
    customer: {
      name: String,
      phone: String,
      address: String,
      note: { type: String, default: '' },
    },
    statusHistory: [
      {
        status: String,
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
)

export const Order = mongoose.model('Order', orderSchema)

export const ORDER_STATUSES = [
  'Chờ xác nhận',
  'Đã xác nhận',
  'Đang giao',
  'Đã giao',
  'Đã hủy',
]
