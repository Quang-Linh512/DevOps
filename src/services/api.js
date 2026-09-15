import { productService } from './productService'
import api from './http'

/**
 * API storefront.
 * Sản phẩm lấy qua productService (cùng nguồn với Admin).
 * Khi backend sẵn sàng: bật VITE_USE_REMOTE_API=true trong các service.
 */
export async function getProducts() {
  const products = await productService.getAll()
  return products.filter((p) => p.status !== 'inactive')
}

export async function getProductById(id) {
  const product = await productService.getById(id)
  if (product.status === 'inactive') {
    throw new Error('Không tìm thấy sản phẩm')
  }
  return product
}

export async function getProductsByCategory(category) {
  const products = await getProducts()
  return products.filter((p) => p.category === category)
}

export async function searchProducts(keyword) {
  const q = keyword.toLowerCase().trim()
  const products = await getProducts()
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
  )
}

export default api
