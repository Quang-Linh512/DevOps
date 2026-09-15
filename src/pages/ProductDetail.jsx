import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Loading from '../components/Loading'
import ProductList from '../components/ProductList'
import { formatPrice } from '../data/products'
import { getProductById, getProducts } from '../services/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()

  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setQuantity(1)

    Promise.all([getProductById(id), getProducts()])
      .then(([item, all]) => {
        if (!active) return
        setProduct(item)
        setRelated(
          all
            .filter((p) => p.category === item.category && p.id !== item.id)
            .slice(0, 4)
        )
      })
      .catch(() => {
        if (active) setError('Không tìm thấy sản phẩm')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [id])

  if (loading) return <Loading />

  if (error || !product) {
    return (
      <div className="page">
        <div className="container empty-state">
          <h1>Product not found</h1>
          <p>Sản phẩm không tồn tại hoặc đã bị xóa.</p>
          <Link to="/products" className="btn btn-primary">
            Quay lại danh sách
          </Link>
        </div>
      </div>
    )
  }

  const handleBuyNow = () => {
    addToCart(product, quantity)
    if (isAuthenticated) {
      navigate('/checkout')
    } else {
      navigate('/login', { state: { from: '/checkout' } })
    }
  }

  return (
    <div className="page product-detail-page">
      <div className="container">
        <div className="detail-layout">
          <div className="detail-image">
            <img src={product.image} alt={product.name} />
          </div>

          <div className="detail-info">
            <p className="product-category">{product.category}</p>
            <h1>{product.name}</h1>
            <div className="product-rating">★ {product.rating} / 5</div>

            <div className="product-prices detail-prices">
              <strong>{formatPrice(product.price)}</strong>
              {product.oldPrice > product.price && (
                <span className="old-price">{formatPrice(product.oldPrice)}</span>
              )}
            </div>

            <p className="detail-desc">{product.description}</p>
            <p className="stock-info">
              Tồn kho: <strong>{product.stock}</strong> sản phẩm
            </p>

            <div className="qty-row">
              <label htmlFor="qty">Số lượng</label>
              <div className="qty-control">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <input
                  id="qty"
                  type="number"
                  min={1}
                  max={product.stock}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      Math.min(
                        product.stock,
                        Math.max(1, Number(e.target.value) || 1)
                      )
                    )
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(product.stock, q + 1))
                  }
                >
                  +
                </button>
              </div>
            </div>

            <div className="detail-actions">
              <button
                type="button"
                className="btn btn-primary"
                disabled={product.stock === 0}
                onClick={() => addToCart(product, quantity)}
              >
                Thêm vào giỏ hàng
              </button>
              <button
                type="button"
                className="btn btn-accent"
                disabled={product.stock === 0}
                onClick={handleBuyNow}
              >
                Mua ngay
              </button>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="section related-section">
            <div className="section-head">
              <h2>Sản phẩm liên quan</h2>
            </div>
            <ProductList products={related} />
          </section>
        )}
      </div>
    </div>
  )
}

export default ProductDetail
