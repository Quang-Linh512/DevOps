import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductList from '../components/ProductList'
import Loading from '../components/Loading'
import { getProducts } from '../services/api'
import { categoryService } from '../services/categoryService'

const PAGE_SIZE = 8

function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const sort = searchParams.get('sort') || ''

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([getProducts(), categoryService.getAll()])
      .then(([data, cats]) => {
        if (!active) return
        setProducts(data)
        setCategories(cats.filter((c) => c.status !== 'inactive'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  // Reset trang khi filter thay đổi
  useEffect(() => {
    setPage(1)
  }, [search, category, sort])

  const filtered = useMemo(() => {
    let list = [...products]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
    }

    if (category) {
      list = list.filter((p) => p.category === category)
    }

    switch (sort) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        list.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        list.sort((a, b) => b.rating - a.rating)
        break
      case 'newest':
        list.sort((a, b) => Number(b.isNew) - Number(a.isNew))
        break
      default:
        break
    }

    return list
  }, [products, search, category, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice(0, page * PAGE_SIZE)

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
  }

  if (loading) return <Loading />

  return (
    <div className="page products-page">
      <div className="container">
        <div className="page-header">
          <h1>Sản phẩm</h1>
          <p>{filtered.length} sản phẩm</p>
        </div>

        <div className="filters">
          <input
            type="search"
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={(e) => updateParam('search', e.target.value)}
          />

          <select
            value={category}
            onChange={(e) => updateParam('category', e.target.value)}
            aria-label="Lọc theo danh mục"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => updateParam('sort', e.target.value)}
            aria-label="Sắp xếp"
          >
            <option value="">Sắp xếp mặc định</option>
            <option value="price-asc">Giá tăng dần</option>
            <option value="price-desc">Giá giảm dần</option>
            <option value="rating">Đánh giá cao nhất</option>
            <option value="newest">Sản phẩm mới</option>
          </select>
        </div>

        <ProductList
          products={paged}
          emptyMessage="Không tìm thấy sản phẩm phù hợp"
        />

        {page < totalPages && filtered.length > 0 && (
          <div className="load-more">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setPage((p) => p + 1)}
            >
              Xem thêm
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Products
