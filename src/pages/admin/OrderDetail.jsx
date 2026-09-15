import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ConfirmModal from '../../components/admin/ConfirmModal'
import AdminState from '../../components/admin/AdminState'
import Loading from '../../components/Loading'
import { orderService, ORDER_STATUSES } from '../../services/orderService'
import { formatPrice } from '../../data/products'

const TIMELINE = ['Chờ xác nhận', 'Đã xác nhận', 'Đang giao', 'Đã giao']

function AdminOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [pendingStatus, setPendingStatus] = useState('')
  const [confirmCancel, setConfirmCancel] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await orderService.getById(id)
      setOrder(data)
    } catch {
      setError('Không tìm thấy đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const applyStatus = async (status) => {
    setSaving(true)
    try {
      const updated = await orderService.updateStatus(id, status)
      setOrder(updated)
      setConfirmCancel(false)
      setPendingStatus('')
    } catch (err) {
      setError(err.message || 'Không thể cập nhật trạng thái')
    } finally {
      setSaving(false)
    }
  }

  const onStatusChange = (status) => {
    if (status === 'Đã hủy') {
      setPendingStatus(status)
      setConfirmCancel(true)
      return
    }
    applyStatus(status)
  }

  if (loading) return <Loading text="Đang tải đơn hàng..." />
  if (error && !order) {
    return (
      <AdminState
        type="error"
        title="Không tìm thấy"
        message={error}
        actionLabel="Quay lại"
        onAction={() => navigate('/admin/orders')}
      />
    )
  }

  const currentIdx = TIMELINE.indexOf(order.status)

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Đơn hàng {order.id}</h1>
          <p>Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
        </div>
        <Link to="/admin/orders" className="btn btn-outline">
          ← Danh sách
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="admin-grid-2">
        <section className="admin-card">
          <h2>Thông tin đơn hàng</h2>
          <dl className="admin-dl">
            <div>
              <dt>Order ID</dt>
              <dd>{order.id}</dd>
            </div>
            <div>
              <dt>Trạng thái</dt>
              <dd>{order.status}</dd>
            </div>
            <div>
              <dt>Thanh toán</dt>
              <dd>{order.paymentMethod}</dd>
            </div>
          </dl>

          <label className="admin-status-select">
            Đổi trạng thái
            <select
              value={order.status}
              disabled={saving || order.status === 'Đã hủy'}
              onChange={(e) => onStatusChange(e.target.value)}
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <div className="admin-timeline">
            {TIMELINE.map((step, idx) => {
              const done = order.status === 'Đã hủy' ? false : currentIdx >= idx
              const cancelled = order.status === 'Đã hủy'
              return (
                <div key={step} className={`timeline-step ${done ? 'done' : ''} ${cancelled ? 'cancelled' : ''}`}>
                  <span className="dot" />
                  <span>{step}</span>
                </div>
              )
            })}
            {order.status === 'Đã hủy' && (
              <div className="timeline-step cancelled done">
                <span className="dot" />
                <span>Đã hủy</span>
              </div>
            )}
          </div>
        </section>

        <section className="admin-card">
          <h2>Thông tin khách</h2>
          <dl className="admin-dl">
            <div>
              <dt>Họ tên</dt>
              <dd>{order.customer?.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{order.customer?.email || '—'}</dd>
            </div>
            <div>
              <dt>Số điện thoại</dt>
              <dd>{order.customer?.phone}</dd>
            </div>
            <div>
              <dt>Địa chỉ</dt>
              <dd>{order.customer?.address}</dd>
            </div>
            {order.customer?.note && (
              <div>
                <dt>Ghi chú</dt>
                <dd>{order.customer.note}</dd>
              </div>
            )}
          </dl>
        </section>
      </div>

      <section className="admin-card">
        <h2>Sản phẩm</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Tên</th>
                <th>Giá</th>
                <th>SL</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item) => (
                <tr key={item.id}>
                  <td>
                    <img className="admin-thumb" src={item.image} alt="" />
                  </td>
                  <td>{item.name}</td>
                  <td>{formatPrice(item.price)}</td>
                  <td>{item.quantity}</td>
                  <td>{formatPrice(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-order-totals">
          <div>
            <span>Subtotal</span>
            <strong>{formatPrice(order.subtotal)}</strong>
          </div>
          <div>
            <span>Shipping</span>
            <strong>{formatPrice(order.shipping || 0)}</strong>
          </div>
          <div>
            <span>Discount</span>
            <strong>{formatPrice(order.discount || 0)}</strong>
          </div>
          <div className="total">
            <span>Total</span>
            <strong>{formatPrice(order.total)}</strong>
          </div>
        </div>
      </section>

      <ConfirmModal
        open={confirmCancel}
        danger
        title="Hủy đơn hàng"
        message="Bạn có chắc chắn muốn hủy đơn hàng này?"
        confirmText="Hủy đơn"
        onCancel={() => {
          setConfirmCancel(false)
          setPendingStatus('')
        }}
        onConfirm={() => applyStatus(pendingStatus || 'Đã hủy')}
      />
    </div>
  )
}

export default AdminOrderDetail
