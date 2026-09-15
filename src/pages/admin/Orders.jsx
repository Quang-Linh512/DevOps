import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminState from '../../components/admin/AdminState'
import Loading from '../../components/Loading'
import { orderService, ORDER_STATUSES } from '../../services/orderService'
import { formatPrice } from '../../data/products'

function statusClass(status) {
  if (status === 'Chờ xác nhận') return 'status-pending'
  if (status === 'Đã xác nhận' || status === 'Đang giao') return 'status-shipping'
  if (status === 'Đã giao') return 'status-done'
  if (status === 'Đã hủy') return 'status-cancel'
  return ''
}

function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await orderService.getAll()
      setOrders(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
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
    let list = [...orders]
    if (status) list = list.filter((o) => o.status === status)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          (o.customer?.name || '').toLowerCase().includes(q) ||
          (o.customer?.email || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [orders, status, search])

  if (loading) return <Loading text="Đang tải đơn hàng..." />
  if (error) {
    return <AdminState type="error" title="Lỗi" message={error} actionLabel="Thử lại" onAction={load} />
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Đơn hàng</h1>
          <p>{filtered.length} đơn hàng</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <input
          type="search"
          placeholder="Tìm mã đơn, tên khách, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tất cả</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <AdminState type="empty" title="Chưa có đơn hàng" message="Đơn hàng từ khách sẽ xuất hiện tại đây." />
      ) : (
        <div className="admin-card admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Ngày đặt</th>
                <th>Số SP</th>
                <th>Tổng tiền</th>
                <th>Thanh toán</th>
                <th>Trạng thái</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.customer?.name}</td>
                  <td>{new Date(o.createdAt).toLocaleString('vi-VN')}</td>
                  <td>{(o.items || []).reduce((s, i) => s + i.quantity, 0)}</td>
                  <td>{formatPrice(o.total)}</td>
                  <td>{o.paymentMethod}</td>
                  <td>
                    <span className={`status-badge ${statusClass(o.status)}`}>{o.status}</span>
                  </td>
                  <td>
                    <Link to={`/admin/orders/${o.id}`} className="btn-text">
                      Chi tiết
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminOrders
