import { Link } from 'react-router-dom'
import Banner from '../components/Banner'
import CategoryCard from '../components/CategoryCard'
import ProductList from '../components/ProductList'
import { categories, products } from '../data/products'

function Home() {
  const featured = products.filter((p) => p.isFeatured).slice(0, 8)
  const newest = products.filter((p) => p.isNew).slice(0, 8)

  return (
    <div className="home-page">
      <Banner
        variant="hero"
        title="DevShop"
        subtitle="Thiết bị công nghệ chính hãng cho sinh viên và developer — giá tốt mỗi ngày."
        ctaText="Khám phá sản phẩm"
        ctaLink="/products"
        image="https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1600&h=900&fit=crop"
      />

      <section id="categories" className="section">
        <div className="container">
          <div className="section-head">
            <h2>Danh mục sản phẩm</h2>
            <p>Chọn nhanh nhóm sản phẩm bạn cần</p>
          </div>
          <div className="category-grid">
            {categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <h2>Sản phẩm nổi bật</h2>
            <Link to="/products">Xem tất cả →</Link>
          </div>
          <ProductList products={featured} />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Sản phẩm mới</h2>
            <Link to="/products?sort=newest">Xem thêm →</Link>
          </div>
          <ProductList products={newest} />
        </div>
      </section>

      <Banner
        variant="promo"
        title="Giảm đến 30% tuần này"
        subtitle="Áp dụng cho laptop, tai nghe và phụ kiện. Miễn phí vận chuyển đơn từ 500.000đ."
        ctaText="Mua ngay"
        ctaLink="/products"
        image="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600&h=700&fit=crop"
      />

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Tại sao chọn DevShop?</h2>
            <p>Cam kết trải nghiệm mua sắm dễ dàng và an toàn</p>
          </div>
          <div className="benefits-grid">
            <div className="benefit-item">
              <span>🚚</span>
              <h3>Giao hàng nhanh</h3>
              <p>Giao trong 24–48 giờ tại nội thành.</p>
            </div>
            <div className="benefit-item">
              <span>🔒</span>
              <h3>Thanh toán an toàn</h3>
              <p>COD hoặc chuyển khoản minh bạch.</p>
            </div>
            <div className="benefit-item">
              <span>↩️</span>
              <h3>Đổi trả dễ dàng</h3>
              <p>Đổi trả trong 7 ngày nếu lỗi nhà sản xuất.</p>
            </div>
            <div className="benefit-item">
              <span>💬</span>
              <h3>Hỗ trợ khách hàng</h3>
              <p>Tư vấn từ 8:00 đến 22:00 mỗi ngày.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
