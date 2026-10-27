import { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

const USER_KEY = 'devshop_user'

function loadUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveUser(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(USER_KEY)
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load user from localStorage on mount
    const savedUser = loadUser()
    if (savedUser) {
      setUser(savedUser)
    }
    setLoading(false)
  }, [])

  /**
   * Đăng nhập.
   * Luôn trả về cùng một hình dạng:
   *   { success: boolean, user: object|null, token: string|null, message?: string }
   * - `success`  : đăng nhập có thành công không
   * - `user`     : thông tin user đã đăng nhập (null nếu thất bại)
   * - `token`    : JWT (null ở chế độ localStorage mock)
   * - `message`  : thông báo lỗi khi thất bại
   */
  const login = async (email, password) => {
    const result = await authService.login(email, password)

    if (!result?.success || !result.user) {
      return {
        success: false,
        user: null,
        token: null,
        message: result?.message || 'Đăng nhập thất bại',
      }
    }

    const token = result.token ?? result.user.token ?? null
    const session = { ...result.user, token }
    saveUser(session)
    setUser(session)

    return { success: true, user: session, token, message: result.message }
  }

  /**
   * Đăng ký.
   * Luôn trả về: { success: boolean, message: string }
   */
  const register = async (formData) => {
    const result = await authService.register(formData)
    return {
      success: Boolean(result?.success),
      message: result?.message || (result?.success ? 'Đăng ký thành công!' : 'Đăng ký thất bại'),
    }
  }

  const logout = () => {
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  /**
   * Cập nhật hồ sơ người dùng.
   * Khi API thật: gọi PUT /auth/profile để lưu vào database.
   * Khi mock: chỉ cập nhật localStorage.
   */
  const updateProfile = async (updates) => {
    if (!user) return
    try {
      const result = await authService.updateProfile(updates)
      const updated = { ...user, ...(result?.user || result || updates) }
      saveUser(updated)
      setUser(updated)
      return { success: true, user: updated }
    } catch (error) {
      // API lỗi -> vẫn cập nhật local để UI không bị kẹt
      const updated = { ...user, ...updates }
      saveUser(updated)
      setUser(updated)
      throw error
    }
  }

  const changePassword = async (currentPassword, newPassword) => {
    return authService.changePassword({
      userId: user?.id,
      currentPassword,
      newPassword,
    })
  }

  const isAdmin = authService.isAdmin(user)

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth phải dùng bên trong AuthProvider')
  }
  return ctx
}
