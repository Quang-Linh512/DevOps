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

  const login = async (email, password) => {
    const result = await authService.login(email, password)
    if (result.success && result.user) {
      saveUser({ ...result.user, token: result.token })
      setUser({ ...result.user, token: result.token })
    }
    return result
  }

  const register = async (formData) => {
    return authService.register(formData)
  }

  const logout = () => {
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  const updateProfile = async (updates) => {
    if (!user) return
    // Update local storage
    const updated = { ...user, ...updates }
    saveUser(updated)
    setUser(updated)
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
