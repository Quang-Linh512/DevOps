import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  dashboardService,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/dashboardService'
import '../styles/admin.css'

const NAV = [
  { to: '/admin', label: 'Dashboard', end: true, icon: '📊' },
  { to: '/admin/products', label: 'Sản phẩm', icon: '📦' },
  { to: '/admin/orders', label: 'Đơn hàng', icon: '🧾' },
  { to: '/admin/users', label: 'Người dùng', icon: '👥' },
  { to: '/admin/categories', label: 'Danh mục', icon: '🗂️' },
  { to: '/admin/reports', label: 'Báo cáo', icon: '📈' },
  { to: '/admin/settings', label: 'Cài đặt', icon: '⚙️' },
]

function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [notifs, setNotifs] = useState([])
  const [notifOpen, setNotifOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const notifRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    dashboardService.getNotifications().then(setNotifs).catch(() => setNotifs([]))
  }, [])

  useEffect(() => {
    const onClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const unread = notifs.filter((n) => !n.read).length

  const handleSearch = (e) => {
    e.preventDefault()
    const q = search.trim()
    if (!q) return
    navigate(`/admin/products?search=${encodeURIComponent(q)}`)
    setSearch('')
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const onReadOne = (n) => {
    markNotificationRead(n.id)
    setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
    setNotifOpen(false)
    if (n.link) navigate(n.link)
  }

  const onReadAll = () => {
    markAllNotificationsRead(notifs.map((n) => n.id))
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <div className={`admin-app ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
      {mobileOpen && (
        <button
          type="button"
          className="admin-sidebar-backdrop"
          aria-label="Đóng menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className="admin-sidebar">
        <Link to="/admin" className="admin-logo" onClick={() => setMobileOpen(false)}>
          <span className="logo-mark">DS</span>
          {!collapsed && <span>DevShop Admin</span>}
        </Link>

        <nav className="admin-nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
            >
              <span aria-hidden="true">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-side-link" onClick={() => setMobileOpen(false)}>
            ← {!collapsed && 'Quay lại cửa hàng'}
          </Link>
          <button type="button" className="admin-side-link" onClick={handleLogout}>
            {!collapsed ? 'Đăng xuất' : '⏻'}
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-icon-btn"
              aria-label="Thu gọn sidebar"
              onClick={() => {
                if (window.innerWidth <= 960) setMobileOpen((v) => !v)
                else setCollapsed((v) => !v)
              }}
            >
              ☰
            </button>
            <form className="admin-search" onSubmit={handleSearch}>
              <input
                type="search"
                placeholder="Tìm sản phẩm, đơn hàng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
          </div>

          <div className="admin-topbar-right">
            <div className="admin-notif" ref={notifRef}>
              <button
                type="button"
                className="admin-icon-btn"
                aria-label="Thông báo"
                onClick={() => setNotifOpen((v) => !v)}
              >
                🔔
                {unread > 0 && <span className="admin-badge">{unread}</span>}
              </button>
              {notifOpen && (
                <div className="admin-dropdown admin-notif-dropdown">
                  <div className="admin-dropdown-head">
                    <strong>Thông báo</strong>
                    <button type="button" className="btn-text" onClick={onReadAll}>
                      Đánh dấu đã đọc
                    </button>
                  </div>
                  {notifs.length === 0 ? (
                    <p className="admin-dropdown-empty">Không có thông báo</p>
                  ) : (
                    <ul>
                      {notifs.slice(0, 8).map((n) => (
                        <li key={n.id}>
                          <button
                            type="button"
                            className={n.read ? 'read' : ''}
                            onClick={() => onReadOne(n)}
                          >
                            <strong>{n.title}</strong>
                            <span>{n.message}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link to="/admin/orders" className="admin-dropdown-foot" onClick={() => setNotifOpen(false)}>
                    Xem tất cả
                  </Link>
                </div>
              )}
            </div>

            <div className="admin-account" ref={menuRef}>
              <button type="button" className="admin-account-btn" onClick={() => setMenuOpen((v) => !v)}>
                <img src={user?.avatar} alt="" />
                <span>{user?.name}</span>
              </button>
              {menuOpen && (
                <div className="admin-dropdown">
                  <Link to="/admin/settings" onClick={() => setMenuOpen(false)}>
                    Cài đặt tài khoản
                  </Link>
                  <Link to="/profile" onClick={() => setMenuOpen(false)}>
                    Hồ sơ cửa hàng
                  </Link>
                  <button type="button" onClick={handleLogout}>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AdminLayout
