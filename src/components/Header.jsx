import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

function Header() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const { cartCount } = useCart()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSearch = (e) => {
    e.preventDefault()
    const q = search.trim()
    if (q) {
      navigate(`/products?search=${encodeURIComponent(q)}`)
      setSearch('')
      setMenuOpen(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="logo" onClick={() => setMenuOpen(false)}>
          <span className="logo-mark">DS</span>
          <span className="logo-text">DevShop</span>
        </Link>

        <button
          className="menu-toggle"
          type="button"
          aria-label="Mở menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`nav ${menuOpen ? 'nav-open' : ''}`}>
          <NavLink to="/" end onClick={() => setMenuOpen(false)}>
            Trang chủ
          </NavLink>
          <NavLink to="/products" onClick={() => setMenuOpen(false)}>
            Sản phẩm
          </NavLink>
          <Link to="/#categories" onClick={() => setMenuOpen(false)}>
            Danh mục
          </Link>

          <form className="search-form" onSubmit={handleSearch}>
            <input
              type="search"
              placeholder="Tìm sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Tìm kiếm sản phẩm"
            />
            <button type="submit" aria-label="Tìm kiếm">
              🔍
            </button>
          </form>

          <Link to="/cart" className="cart-link" onClick={() => setMenuOpen(false)}>
            <span className="cart-icon">🛒</span>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>

          {isAuthenticated ? (
            <div className="user-menu">
              {isAdmin && (
                <Link to="/admin" className="btn btn-outline btn-sm" onClick={() => setMenuOpen(false)}>
                  Admin
                </Link>
              )}
              <Link to="/profile" onClick={() => setMenuOpen(false)}>
                {user.name}
              </Link>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="btn btn-ghost btn-sm" onClick={() => setMenuOpen(false)}>
                Đăng nhập
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>
                Đăng ký
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header
