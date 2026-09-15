import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatPrice } from '../data/products'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

function Checkout() {
  const { user } = useAuth()
  const { cartItems, subtotal, shipping, total, placeOrder } = useCart()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    note: '',
    paymentMethod: 'COD',
  })
  const [error, setError] = useState('')

  if (cartItems.length === 0) {
    return (
      <div className="page">
        <div className="container empty-state">
          <h1>Không có sản phẩm để thanh toán</h1>
          <Link to="/products" className="btn btn-primary">
            Mua sắm ngay
          </Link>
        </div>
      </div>
    )
  }

  const update = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError('Vui lòng điền đầy đủ thông tin người nhận')
      return
    }

    placeOrder({
      ...form,
      name: form.name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      userId: user.id,
    })

    navigate('/orders')
  }

  return (
    <div className="page checkout-page">
      <div className="container">
        <h1>Thanh toán</h1>

        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={handleSubmit}>
            <h2>Thông tin người nhận</h2>
            {error && <div className="alert alert-error">{error}</div>}

            <label>
              Họ tên
              <input type="text" value={form.name} onChange={update('name')} />
            </label>
            <label>
              Số điện thoại
              <input type="tel" value={form.phone} onChange={update('phone')} />
            </label>
            <label>
              Địa chỉ
              <textarea rows={3} value={form.address} onChange={update('address')} />
            </label>
            <label>
              Ghi chú
              <textarea rows={2} value={form.note} onChange={update('note')} placeholder="Giao giờ hành chính..." />
            </label>

            <h2>Phương thức thanh toán</h2>
            <div className="payment-options">
              <label className="radio-option">
                <input
                  type="radio"
                  name="payment"
                  value="COD"
                  checked={form.paymentMethod === 'COD'}
                  onChange={update('paymentMethod')}
                />
                Thanh toán khi nhận hàng (COD)
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="payment"
                  value="Bank Transfer"
                  checked={form.paymentMethod === 'Bank Transfer'}
                  onChange={update('paymentMethod')}
                />
                Chuyển khoản ngân hàng
              </label>
            </div>

            <button type="submit" className="btn btn-primary btn-block">
              Đặt hàng
            </button>
          </form>

          <aside className="cart-summary">
            <h2>Đơn hàng của bạn</h2>
            <ul className="checkout-items">
              {cartItems.map((item) => (
                <li key={item.id}>
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="summary-row">
              <span>Tổng tiền hàng</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Phí vận chuyển</span>
              <span>{shipping === 0 ? 'Miễn phí' : formatPrice(shipping)}</span>
            </div>
            <div className="summary-row total">
              <span>Tổng thanh toán</span>
              <strong>{formatPrice(total)}</strong>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default Checkout
