import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { User } from '../models/User.js'

export function signToken(user) {
  return jwt.sign(
    { id: String(user._id), role: user.role, email: user.email },
    config.jwtSecret,
    { expiresIn: '7d' }
  )
}

export async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) {
      return res.status(401).json({ message: 'Chưa đăng nhập' })
    }
    const decoded = jwt.verify(token, config.jwtSecret)
    const user = await User.findById(decoded.id)
    if (!user) return res.status(401).json({ message: 'Token không hợp lệ' })
    if (user.status === 'blocked') {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa' })
    }
    req.user = user
    next()
  } catch {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc hết hạn' })
  }
}

export function adminRequired(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Yêu cầu quyền admin' })
  }
  next()
}
