import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-col">
          <h3>DevShop</h3>
          <p>
            Cửa hàng công nghệ dành cho sinh viên và developer. Sản phẩm chính
            hãng, giá tốt, giao hàng nhanh toàn quốc.
          </p>
        </div>

        <div className="footer-col">
          <h4>Liên kết nhanh</h4>
          <ul>
            <li>
              <Link to="/">Trang chủ</Link>
            </li>
            <li>
              <Link to="/products">Sản phẩm</Link>
            </li>
            <li>
              <Link to="/cart">Giỏ hàng</Link>
            </li>
            <li>
              <Link to="/orders">Đơn hàng</Link>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Chính sách</h4>
          <ul>
            <li>
              <a href="#policy">Chính sách bảo hành</a>
            </li>
            <li>
              <a href="#policy">Đổi trả trong 7 ngày</a>
            </li>
            <li>
              <a href="#policy">Chính sách vận chuyển</a>
            </li>
            <li>
              <a href="#policy">Bảo mật thông tin</a>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Hỗ trợ khách hàng</h4>
          <ul>
            <li>Hotline: 1900 1234</li>
            <li>Email: support@devshop.com</li>
            <li>Giờ làm việc: 8:00 – 22:00</li>
            <li>Địa chỉ: 123 Đường DevOps, Q.1, TP.HCM</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <p>© {new Date().getFullYear()} DevShop. Dự án môn học DevOps – Năm 4.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
