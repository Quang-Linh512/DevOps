import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

const USERS_KEY = 'devshop_users'
const USER_KEY = 'devshop_user'

/** Tài khoản demo mặc định */
const DEMO_USERS = [
  {
    id: 1,
    name: 'Admin DevShop',
    email: 'admin@devshop.com',
    phone: '0901234567',
    password: '123456',
    role: 'admin',
    address: '123 Đường DevOps, Quận 1, TP.HCM',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  },
]

function loadUsers() {
  const raw = localStorage.getItem(USERS_KEY)
  if (!raw) {
    localStorage.setItem(USERS_KEY, JSON.stringify(DEMO_USERS))
    return DEMO_USERS
  }
  try {
    return JSON.parse(raw)
  } catch {
    localStorage.setItem(USERS_KEY, JSON.stringify(DEMO_USERS))
    return DEMO_USERS
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Khôi phục phiên đăng nhập khi refresh
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

    // Không lưu password vào session
    const { password: _, ...safeUser } = found
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
      address: '',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(formData.email)}`,
    }

    users.push(newUser)
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
    return { success: true, message: 'Đăng ký thành công! Vui lòng đăng nhập.' }
  }

  const logout = () => {
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  const updateProfile = (updates) => {
    if (!user) return

    const users = loadUsers()
    const idx = users.findIndex((u) => u.id === user.id)
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates }
      localStorage.setItem(USERS_KEY, JSON.stringify(users))
    }

    const updated = { ...user, ...updates }
    delete updated.password
    localStorage.setItem(USER_KEY, JSON.stringify(updated))
    setUser(updated)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile,
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
