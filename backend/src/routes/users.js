import { Router } from 'express'
import { User } from '../models/User.js'
import { authRequired, adminRequired } from '../middleware/auth.js'
import { toUserResponse } from '../utils/helpers.js'

const router = Router()

router.get('/', authRequired, adminRequired, async (_req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 })
    res.json(users.map((u) => toUserResponse(u)))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' })
    res.json(toUserResponse(user))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.patch('/:id/status', authRequired, adminRequired, async (req, res) => {
  try {
    const { status } = req.body
    if (!['active', 'blocked'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' })
    }
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' })
    if (user.role === 'admin' && status === 'blocked') {
      return res.status(400).json({ message: 'Không thể khóa tài khoản admin' })
    }
    user.status = status
    await user.save()
    res.json(toUserResponse(user))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
