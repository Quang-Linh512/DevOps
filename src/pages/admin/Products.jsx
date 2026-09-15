import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import ConfirmModal from '../../components/admin/ConfirmModal'
import AdminState from '../../components/admin/AdminState'
import Loading from '../../components/Loading'
import { productService } from '../../services/productService'
import { categoryService } from '../../services/categoryService'
import { formatPrice } from '../../data/products'

function AdminProducts() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selected, setSelected] = useState([])
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('newest')
  const [deleteId, setDeleteId] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [p, c] = await Promise.all([productService.getAll(), categoryService.getAll()])
      setProducts(p)
      setCategories(c)
    } catch {
      setError('Không thể tải dữ liệu. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    let list = [...products]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku || '').toLowerCase().includes(q)
      )
    }
    if (category) list = list.filter((p) => p.category === category)
    if (status) list = list.filter((p) => p.status === status)

    switch (sort) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        list.sort((a, b) => b.price - a.price)
        break
      case 'stock':
        list.sort((a, b) => a.stock - b.stock)
        break
      default:
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }
    return list
  }, [products, search, category, status, sort])

  const toggleAll = (checked) => {
    setSelected(checked ? filtered.map((p) => p.id) : [])
  }

  const toggleOne = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const confirmDelete = async () => {
    try {
      await productService.remove(deleteId)
      setDeleteId(null)
      await load()
    } catch {
      setError('Không thể xóa sản phẩm.')
      setDeleteId(null)
    }
  }

  if (loading) return <Loading text="Đang tải sản phẩm..." />
  if (error && products.length === 0) {
    return (
      <AdminState type="error" title="Lỗi" message={error} actionLabel="Thử lại" onAction={load} />
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Sản phẩm</h1>
          <p>{filtered.length} sản phẩm</p>
        </div>
        <Link to="/admin/products/add" className="btn btn-primary">
          + Thêm sản phẩm
        </Link>
      </div>

      <div className="admin-toolbar">
        <input
          type="search"
          placeholder="Tìm theo tên hoặc SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Mới nhất</option>
          <option value="price-asc">Giá tăng dần</option>
          <option value="price-desc">Giá giảm dần</option>
          <option value="stock">Tồn kho thấp</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <AdminState
          type="empty"
          title="Chưa có sản phẩm"
          message="Hãy thêm sản phẩm đầu tiên cho cửa hàng."
          actionLabel="+ Thêm sản phẩm"
          onAction={() => navigate('/admin/products/add')}
        />
      ) : (
        <div className="admin-card admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={(e) => toggleAll(e.target.checked)}
                    aria-label="Chọn tất cả"
                  />
                </th>
                <th>Hình ảnh</th>
                <th>Tên sản phẩm</th>
                <th>SKU</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th>Tồn kho</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(p.id)}
                      onChange={() => toggleOne(p.id)}
                      aria-label={`Chọn ${p.name}`}
                    />
                  </td>
                  <td>
                    <img className="admin-thumb" src={p.image} alt="" />
                  </td>
                  <td>
                    <strong>{p.name}</strong>
                  </td>
                  <td>{p.sku}</td>
                  <td>{p.category}</td>
                  <td>{formatPrice(p.price)}</td>
                  <td>{p.stock}</td>
                  <td>
                    <span className={`status-badge ${p.status === 'active' ? 'status-done' : 'status-cancel'}`}>
                      {p.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(p.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="admin-actions">
                    <Link to={`/products/${p.id}`} className="btn-text">
                      Xem
                    </Link>
                    <Link to={`/admin/products/edit/${p.id}`} className="btn-text">
                      Sửa
                    </Link>
                    <button type="button" className="btn-text danger" onClick={() => setDeleteId(p.id)}>
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        danger
        title="Xóa sản phẩm"
        message="Bạn có chắc chắn muốn xóa sản phẩm này?"
        confirmText="Xóa"
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

export default AdminProducts
