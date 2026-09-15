import { Link } from 'react-router-dom'
import { formatPrice } from '../data/products'
import { useCart } from '../context/CartContext'

function ProductCard({ product }) {
  const { addToCart } = useCart()

  const discount =
    product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : 0

  return (
    <article className="product-card">
      <Link to={`/products/${product.id}`} className="product-card-image">
        <img src={product.image} alt={product.name} loading="lazy" />
        {product.isNew && <span className="badge badge-new">Mới</span>}
        {discount > 0 && <span className="badge badge-sale">-{discount}%</span>}
      </Link>

      <div className="product-card-body">
        <p className="product-category">{product.category}</p>
        <Link to={`/products/${product.id}`}>
          <h3>{product.name}</h3>
        </Link>
        <div className="product-rating">
          <span>★ {product.rating}</span>
        </div>
        <div className="product-prices">
          <strong>{formatPrice(product.price)}</strong>
          {product.oldPrice > product.price && (
            <span className="old-price">{formatPrice(product.oldPrice)}</span>
          )}
        </div>
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => addToCart(product, 1)}
          disabled={product.stock === 0}
        >
          {product.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
        </button>
      </div>
    </article>
  )
}

export default ProductCard
