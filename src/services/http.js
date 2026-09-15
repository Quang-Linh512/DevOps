import axios from 'axios'

/**
 * Axios client dùng chung.
 * Các service admin/storefront import từ đây để tránh circular dependency.
 */
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const user = localStorage.getItem('devshop_user')
  if (user) {
    try {
      const parsed = JSON.parse(user)
      if (parsed?.token) {
        config.headers.Authorization = `Bearer ${parsed.token}`
      }
    } catch {
      // ignore
    }
  }
  return config
})

export default api
