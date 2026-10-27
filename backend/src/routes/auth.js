import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { User } from '../models/User.js'
import { authRequired, signToken } from '../middleware/auth.js'
import { toUserResponse } from '../utils/helpers.js'

const router = Router()

router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin đăng ký' })
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu tối thiểu 6 ký tự' })
    }
    const exists = await User.findOne({ email: email.toLowerCase().trim() })
    if (exists) {
      return res.status(409).json({ success: false, message: 'Email đã được sử dụng' })
    }
    const hashed = await bcrypt.hash(password, 10)
    await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || '',
      password: hashed,
      role: 'user',
      status: 'active',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
    })
    res.status(201).json({ success: true, message: 'Đăng ký thành công! Vui lòng đăng nhập.' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email: String(email || '').toLowerCase().trim() })
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' })
    }
    const ok = await bcrypt.compare(password || '', user.password)
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' })
    }
    if (user.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị khóa. Liên hệ quản trị viên.',
      })
    }
    const token = signToken(user)
    res.json({ success: true, user: toUserResponse(user, token) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/change-password', authRequired, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const ok = await bcrypt.compare(currentPassword || '', req.user.password)
    if (!ok) return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' })
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới tối thiểu 6 ký tự' })
    }
    req.user.password = await bcrypt.hash(newPassword, 10)
    await req.user.save()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.put('/profile', authRequired, async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'address', 'avatar']
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) req.user[key] = req.body[key]
    })
    await req.user.save()
    const token = signToken(req.user)
    res.json(toUserResponse(req.user, token))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/me', authRequired, (req, res) => {
  const token = signToken(req.user)
  res.json(toUserResponse(req.user, token))
})

export default router
