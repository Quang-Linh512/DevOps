import { describe, expect, it } from 'vitest'
import { formatPrice, products } from './products'

describe('DevShop mock data', () => {
  it('có ít nhất 20 sản phẩm', () => {
    expect(products.length).toBeGreaterThanOrEqual(20)
  })

  it('mỗi sản phẩm có các trường bắt buộc', () => {
    const required = [
      'id',
      'name',
      'price',
      'oldPrice',
      'image',
      'category',
      'description',
      'rating',
      'stock',
      'isFeatured',
      'isNew',
    ]

    products.forEach((product) => {
      required.forEach((key) => {
        expect(product).toHaveProperty(key)
      })
    })
  })

  it('formatPrice trả về chuỗi VND', () => {
    const result = formatPrice(1000000)
    expect(result).toContain('1.000.000')
    expect(result).toMatch(/₫|VND/)
  })
})
