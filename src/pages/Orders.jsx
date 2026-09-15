import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../data/products'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

function statusClass(status) {
  switch (status) {
    case 'Chờ xác nhận':
      return 'status-pending'
    case 'Đang giao':
      return 'status-shipping'
    case 'Đã giao':
      return 'status-done'
    case 'Đã hủy':
      return 'status-cancel'
    default:
      return ''
  }
}

function Orders() {
  const { user } = useAuth()
  const { getOrdersByUser } = useCart()

  const orders = useMemo(() => getOrdersByUser(user.id), [user.id, getOrdersByUser])

  if (orders.length === 0) {
    return (
      <div className="page">
        <div className="container empty-state">
          <h1>Chưa có đơn hàng</h1>
          <p>Bạn chưa đặt đơn nào. Hãy mua sắm và quay lại đây nhé!</p>
          <Link to="/products" className="btn btn-primary">
            Mua sắm ngay
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page orders-page">
      <div className="container">
        <h1>Lịch sử đơn hàng</h1>

        <div className="orders-list">
          {orders.map((order) => (
            <article key={order.id} className="order-card">
              <div className="order-head">
                <div>
                  <h3>Mã đơn: {order.id}</h3>
                  <p>
                    Ngày đặt:{' '}
                    {new Date(order.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                <span className={`status-badge ${statusClass(order.status)}`}>
                  {order.status}
                </span>
              </div>

              <ul className="order-items">
                {order.items.map((item) => (
                  <li key={item.id}>
                    <img src={item.image} alt={item.name} />
                    <div>
                      <p>{item.name}</p>
                      <span>
                        × {item.quantity} — {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="order-footer">
                <span>Thanh toán: {order.paymentMethod}</span>
                <strong>Tổng: {formatPrice(order.total)}</strong>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Orders
