import { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

const USERS_KEY = 'devshop_users'
const USER_KEY = 'devshop_user'

/** Tài khoản demo mặc định — role do hệ thống auth gán */
const DEMO_USERS = [
  {
    id: 1,
    name: 'Admin DevShop',
    email: 'admin@devshop.com',
    phone: '0901234567',
    password: '123456',
    role: 'admin',
    status: 'active',
    address: '123 Đường DevOps, Quận 1, TP.HCM',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
]

function loadUsers() {
  const raw = localStorage.getItem(USERS_KEY)
  if (!raw) {
    localStorage.setItem(USERS_KEY, JSON.stringify(DEMO_USERS))
    return DEMO_USERS
  }
  try {
    const users = JSON.parse(raw)
    // Đảm bảo admin demo vẫn tồn tại nếu bị xóa nhầm
    if (!users.some((u) => u.email === 'admin@devshop.com')) {
      users.unshift(DEMO_USERS[0])
      localStorage.setItem(USERS_KEY, JSON.stringify(users))
    }
    return users
  } catch {
    localStorage.setItem(USERS_KEY, JSON.stringify(DEMO_USERS))
    return DEMO_USERS
  }
}

function toSafeUser(user) {
  const { password: _, ...safeUser } = user
  return {
    ...safeUser,
    status: safeUser.status || 'active',
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
    const raw = localStorage.getItem(USER_KEY)
    if (raw) {
      try {
        setUser(JSON.parse(raw))
      } catch {
        localStorage.removeItem(USER_KEY)
      }
    }
    setLoading(false)
  }, [])

  const login = (email, password) => {
    const users = loadUsers()
    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )

    if (!found) {
      return { success: false, message: 'Email hoặc mật khẩu không đúng' }
    }

    if ((found.status || 'active') === 'blocked') {
      return { success: false, message: 'Tài khoản đã bị khóa. Liên hệ quản trị viên.' }
    }

    const safeUser = toSafeUser(found)
    localStorage.setItem(USER_KEY, JSON.stringify(safeUser))
    setUser(safeUser)
    return { success: true, user: safeUser }
  }

  const register = (formData) => {
    const users = loadUsers()
    const exists = users.some(
      (u) => u.email.toLowerCase() === formData.email.toLowerCase()
    )

    if (exists) {
      return { success: false, message: 'Email đã được sử dụng' }
    }

    const newUser = {
      id: Date.now(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      role: 'user',
      status: 'active',
      address: '',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(formData.email)}`,
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
    return { success: true, message: 'Đăng ký thành công! Vui lòng đăng nhập.' }
  }

  const logout = () => {
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  /** Không cho user tự gán role/password qua updateProfile */
  const updateProfile = (updates) => {
    if (!user) return

    const allowed = {
      name: updates.name,
      phone: updates.phone,
      address: updates.address,
      avatar: updates.avatar,
    }
    Object.keys(allowed).forEach((k) => {
      if (allowed[k] === undefined) delete allowed[k]
    })

    const users = loadUsers()
    const idx = users.findIndex((u) => u.id === user.id)
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...allowed }
      localStorage.setItem(USERS_KEY, JSON.stringify(users))
    }

    const updated = toSafeUser({ ...user, ...allowed })
    localStorage.setItem(USER_KEY, JSON.stringify(updated))
    setUser(updated)
  }

  const changePassword = async (currentPassword, newPassword) => {
    if (!user) throw new Error('Chưa đăng nhập')
    await authService.changePassword({
      userId: user.id,
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
