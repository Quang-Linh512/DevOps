import { Link } from 'react-router-dom'
import { formatPrice } from '../data/products'
import { useCart } from '../context/CartContext'

function Cart() {
  const {
    cartItems,
    subtotal,
    shipping,
    total,
    updateQuantity,
    removeFromCart,
    FREE_SHIPPING_THRESHOLD,
  } = useCart()

  if (cartItems.length === 0) {
    return (
      <div className="page">
        <div className="container empty-state">
          <h1>Giỏ hàng trống</h1>
          <p>Bạn chưa thêm sản phẩm nào. Hãy tiếp tục mua sắm!</p>
          <Link to="/products" className="btn btn-primary">
            Tiếp tục mua hàng
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page cart-page">
      <div className="container">
        <h1>Giỏ hàng</h1>

        <div className="cart-layout">
          <div className="cart-list">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item">
                <img src={item.image} alt={item.name} />
                <div className="cart-item-info">
                  <Link to={`/products/${item.id}`}>
                    <h3>{item.name}</h3>
                  </Link>
                  <p>{formatPrice(item.price)}</p>

                  <div className="qty-control">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="cart-item-side">
                  <strong>{formatPrice(item.price * item.quantity)}</strong>
                  <button
                    type="button"
                    className="btn-text danger"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>

          <aside className="cart-summary">
            <h2>Tóm tắt đơn hàng</h2>
            <div className="summary-row">
              <span>Tạm tính</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Phí vận chuyển</span>
              <span>{shipping === 0 ? 'Miễn phí' : formatPrice(shipping)}</span>
            </div>
            {subtotal < FREE_SHIPPING_THRESHOLD && (
              <p className="shipping-hint">
                Mua thêm {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} để miễn phí ship
              </p>
            )}
            <div className="summary-row total">
              <span>Tổng thanh toán</span>
              <strong>{formatPrice(total)}</strong>
            </div>

            <Link to="/products" className="btn btn-outline btn-block">
              Tiếp tục mua hàng
            </Link>
            <Link to="/checkout" className="btn btn-primary btn-block">
              Thanh toán
            </Link>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default Cart
