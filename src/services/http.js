import axios from 'axios'

/**
 * Axios client dùng chung.
 * Khi chạy trong Docker: VITE_API_URL=/api (nginx proxy)
 * Khi dev: VITE_API_URL=http://localhost:5000/api
 */
const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - thêm token vào header
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

// Response interceptor - xử lý lỗi global
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ
      localStorage.removeItem('devshop_user')
      // Chỉ redirect nếu không phải trang login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
