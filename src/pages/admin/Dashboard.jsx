import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import StatCard from '../../components/admin/StatCard'
import AdminState from '../../components/admin/AdminState'
import Loading from '../../components/Loading'
import { dashboardService } from '../../services/dashboardService'
import { formatPrice } from '../../data/products'

const PIE_COLORS = ['#0d7377', '#14919b', '#e85d04', '#1b7f4a', '#c62828']

function statusClass(status) {
  if (status === 'Chờ xác nhận') return 'status-pending'
  if (status === 'Đã xác nhận') return 'status-shipping'
  if (status === 'Đang giao') return 'status-shipping'
  if (status === 'Đã giao') return 'status-done'
  if (status === 'Đã hủy') return 'status-cancel'
  return ''
}

function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [range, setRange] = useState('month')
  const [stats, setStats] = useState(null)
  const [revenue, setRevenue] = useState([])
  const [statusData, setStatusData] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [recentOrders, setRecentOrders] = useState([])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [s, r, st, top, recent] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRevenueSeries(range),
        dashboardService.getOrderStatusBreakdown(),
        dashboardService.getTopProducts(),
        dashboardService.getRecentOrders(),
      ])
      setStats(s)
      setRevenue(r)
      setStatusData(st)
      setTopProducts(top)
      setRecentOrders(recent)
    } catch {
      setError('Không thể tải dữ liệu. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range])

  if (loading) return <Loading text="Đang tải dashboard..." />
  if (error) {
    return (
      <AdminState
        type="error"
        title="Lỗi tải dữ liệu"
        message={error}
        actionLabel="Thử lại"
        onAction={load}
      />
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Tổng quan hoạt động cửa hàng DevShop</p>
        </div>
      </div>

      <div className="admin-stats-grid">
        <StatCard title="Doanh thu" value={stats.revenue.value} change={stats.revenue.change} icon="💰" format="currency" />
        <StatCard title="Đơn hàng" value={stats.orders.value} change={stats.orders.change} icon="🧾" />
        <StatCard title="Sản phẩm" value={stats.products.value} change={stats.products.change} icon="📦" />
        <StatCard title="Khách hàng" value={stats.customers.value} change={stats.customers.change} icon="👥" />
      </div>

      <div className="admin-grid-2">
        <section className="admin-card">
          <div className="admin-card-head">
            <h2>Doanh thu</h2>
            <select value={range} onChange={(e) => setRange(e.target.value)} aria-label="Khoảng thời gian">
              <option value="day">Theo ngày</option>
              <option value="week">Theo tuần</option>
              <option value="month">Theo tháng</option>
            </select>
          </div>
          <div className="admin-chart">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5eef2" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(v) => formatPrice(v)} />
                <Bar dataKey="revenue" fill="#0d7377" radius={[6, 6, 0, 0]} name="Doanh thu" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="admin-card">
          <div className="admin-card-head">
            <h2>Trạng thái đơn hàng</h2>
          </div>
          <div className="admin-chart">
            {statusData.every((d) => d.value === 0) ? (
              <AdminState type="empty" title="Chưa có đơn hàng" message="Biểu đồ sẽ hiện khi có đơn đặt hàng." />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={95} label>
                    {statusData.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      <div className="admin-grid-2">
        <section className="admin-card">
          <div className="admin-card-head">
            <h2>Top sản phẩm bán chạy</h2>
          </div>
          {topProducts.length === 0 ? (
            <AdminState type="empty" title="Chưa có dữ liệu bán" />
          ) : (
            <ul className="admin-top-list">
              {topProducts.map((p) => (
                <li key={p.id}>
                  <img src={p.image} alt="" />
                  <div>
                    <strong>{p.name}</strong>
                    <span>
                      Đã bán: {p.sold} — {formatPrice(p.revenue || 0)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-card">
          <div className="admin-card-head">
            <h2>Đơn hàng gần đây</h2>
            <Link to="/admin/orders">Xem tất cả</Link>
          </div>
          {recentOrders.length === 0 ? (
            <AdminState type="empty" title="Chưa có đơn hàng" />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Khách</th>
                    <th>Ngày</th>
                    <th>Tổng</th>
                    <th>Trạng thái</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td>{o.id}</td>
                      <td>{o.customer?.name}</td>
                      <td>{new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td>{formatPrice(o.total)}</td>
                      <td>
                        <span className={`status-badge ${statusClass(o.status)}`}>{o.status}</span>
                      </td>
                      <td>
                        <Link to={`/admin/orders/${o.id}`} className="btn-text">
                          Xem
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default AdminDashboard
