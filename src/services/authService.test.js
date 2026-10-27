import { beforeEach, describe, expect, it } from 'vitest'
import { authService } from './authService'

/**
 * Test contract của authService ở chế độ localStorage (VITE_USE_REMOTE_API=false).
 * Đảm bảo login/register luôn trả về cùng một HÌNH DẠNG để các page có thể
 * kiểm tra `result.success` mà không bị lỗi "undefined".
 */
describe('authService - contract (localStorage mode)', () => {
  const seedUser = (overrides = {}) => {
    const user = {
      id: 'u1',
      name: 'Admin',
      email: 'admin@devshop.com',
      phone: '0900000000',
      password: '123456',
      role: 'admin',
      status: 'active',
      address: '',
      avatar: '',
      ...overrides,
    }
    localStorage.setItem('devshop_users', JSON.stringify([user]))
    return user
  }

  beforeEach(() => {
    localStorage.clear()
  })

  describe('login()', () => {
    it('đăng nhập thành công trả { success:true, user, token }', async () => {
      seedUser()

      const result = await authService.login('admin@devshop.com', '123456')

      expect(result.success).toBe(true)
      expect(result.user).toBeTruthy()
      expect(result.user.email).toBe('admin@devshop.com')
      expect(result.user.role).toBe('admin')
      expect(result.token).toBeNull()
    })

    it('không trả mật khẩu trong user (an toàn)', async () => {
      seedUser()

      const result = await authService.login('admin@devshop.com', '123456')

      expect(result.user).not.toHaveProperty('password')
    })

    it('không phân biệt hoa thường cho email', async () => {
      seedUser()

      const result = await authService.login('ADMIN@DevShop.COM', '123456')

      expect(result.success).toBe(true)
    })

    it('mật khẩu sai trả { success:false, user:null, token:null, message }', async () => {
      seedUser()

      const result = await authService.login('admin@devshop.com', 'wrong-password')

      expect(result.success).toBe(false)
      expect(result.user).toBeNull()
      expect(result.token).toBeNull()
      expect(result.message).toBe('Email hoặc mật khẩu không đúng')
    })

    it('email không tồn tại trả lỗi rõ ràng', async () => {
      seedUser()

      const result = await authService.login('khong-ton-tai@devshop.com', '123456')

      expect(result.success).toBe(false)
      expect(result.user).toBeNull()
      expect(result.message).toBe('Email hoặc mật khẩu không đúng')
    })

    it('tài khoản bị khóa trả thông báo tương ứng', async () => {
      seedUser({ status: 'blocked' })

      const result = await authService.login('admin@devshop.com', '123456')

      expect(result.success).toBe(false)
      expect(result.user).toBeNull()
      expect(result.message).toBe('Tài khoản đã bị khóa')
    })

    it('không ghi session vào localStorage khi đăng nhập thất bại', async () => {
      seedUser()

      await authService.login('admin@devshop.com', 'wrong-password')

      expect(localStorage.getItem('devshop_user')).toBeNull()
    })
  })

  describe('register()', () => {
    it('đăng ký thành công trả { success:true, message } và tạo user', async () => {
      const result = await authService.register({
        name: 'Nguyễn Văn A',
        email: 'a@devshop.com',
        phone: '0900000000',
        password: '123456',
      })

      expect(result.success).toBe(true)
      expect(typeof result.message).toBe('string')

      const users = JSON.parse(localStorage.getItem('devshop_users'))
      expect(users).toHaveLength(1)
      expect(users[0].email).toBe('a@devshop.com')
      expect(users[0].role).toBe('user')
      expect(users[0].status).toBe('active')
    })

    it('email trùng trả { success:false, message }', async () => {
      await authService.register({
        name: 'A',
        email: 'a@devshop.com',
        phone: '09',
        password: '123456',
      })

      const result = await authService.register({
        name: 'B',
        email: 'A@devshop.com',
        phone: '09',
        password: '123456',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('Email đã được sử dụng')
      expect(JSON.parse(localStorage.getItem('devshop_users'))).toHaveLength(1)
    })
  })

  describe('isAdmin()', () => {
    it('nhận diện admin', () => {
      expect(authService.isAdmin({ role: 'admin' })).toBe(true)
      expect(authService.isAdmin({ role: 'ADMIN' })).toBe(true)
    })

    it('từ chối user thường và null', () => {
      expect(authService.isAdmin({ role: 'user' })).toBe(false)
      expect(authService.isAdmin(null)).toBe(false)
    })
  })
})
