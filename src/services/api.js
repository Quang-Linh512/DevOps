import axios from 'axios'
import { products as localProducts } from '../data/products'

/**
 * Cấu hình Axios tập trung.
 * Chỉ cần đổi VITE_API_URL trong file .env để kết nối backend thật.
 */
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Gắn token nếu có (chuẩn bị cho backend thật)
api.interceptors.request.use((config) => {
  const user = localStorage.getItem('devshop_user')
  if (user) {
    try {
      const parsed = JSON.parse(user)
      if (parsed?.token) {
        config.headers.Authorization = `Bearer ${parsed.token}`
      }
    } catch {
      // ignore parse error
    }
  }
  return config
})

/**
 * Lấy danh sách sản phẩm.
 * Hiện dùng mock data; khi có backend chỉ cần bỏ comment phần gọi API.
 */
export async function getProducts() {
  // Khi backend sẵn sàng, thay bằng:
  // const { data } = await api.get('/products')
  // return data

  return Promise.resolve(localProducts)
}

export async function getProductById(id) {
  // const { data } = await api.get(`/products/${id}`)
  // return data

  const product = localProducts.find((p) => p.id === Number(id))
  if (!product) {
    throw new Error('Không tìm thấy sản phẩm')
  }
  return product
}

export async function getProductsByCategory(category) {
  // const { data } = await api.get(`/products?category=${category}`)
  // return data

  return localProducts.filter((p) => p.category === category)
}

export async function searchProducts(keyword) {
  // const { data } = await api.get(`/products/search?q=${keyword}`)
  // return data

  const q = keyword.toLowerCase().trim()
  return localProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
  )
}

export default api
