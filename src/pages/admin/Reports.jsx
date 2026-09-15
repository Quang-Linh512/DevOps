import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import StatCard from '../../components/admin/StatCard'
import AdminState from '../../components/admin/AdminState'
import Loading from '../../components/Loading'
import { reportService } from '../../services/reportService'
import { formatPrice } from '../../data/products'

function AdminReports() {
  const [filter, setFilter] = useState('30days')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [report, setReport] = useState(null)
  const [exporting, setExporting] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setReport(await reportService.getReport(filter))
    } catch {
      setError('Không thể tải dữ liệu. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [filter])

  const onExport = async () => {
    setExporting(true)
    try {
      const blob = await reportService.exportCSV(filter)
      reportService.downloadBlob(blob, `devshop-report-${filter}.csv`)
    } catch {
      setError('Không thể xuất CSV')
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <Loading text="Đang tải báo cáo..." />
  if (error && !report) {
    return <AdminState type="error" title="Lỗi" message={error} actionLabel="Thử lại" onAction={load} />
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Báo cáo</h1>
          <p>Doanh thu, đơn hàng và sản phẩm bán chạy</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={onExport} disabled={exporting}>
          {exporting ? 'Đang xuất...' : 'Export CSV'}
        </button>
      </div>

      <div className="admin-toolbar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="today">Hôm nay</option>
          <option value="7days">7 ngày</option>
          <option value="30days">30 ngày</option>
          <option value="month">Tháng này</option>
          <option value="year">Năm nay</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="admin-stats-grid">
        <StatCard title="Doanh thu" value={report.summary.revenue} icon="💰" format="currency" />
        <StatCard title="Đơn hàng" value={report.summary.orders} icon="🧾" />
        <StatCard title="Hoàn thành" value={report.summary.completed} icon="✅" />
        <StatCard title="Khách hàng" value={report.summary.customers} icon="👥" />
      </div>

      <section className="admin-card">
        <div className="admin-card-head">
          <h2>Doanh thu theo thời gian</h2>
        </div>
        <div className="admin-chart">
          {report.series.length === 0 ? (
            <AdminState type="empty" title="Chưa có dữ liệu trong kỳ này" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={report.series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5eef2" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(v) => formatPrice(v)} />
                <Bar dataKey="revenue" fill="#0d7377" name="Doanh thu" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <div className="admin-grid-2">
        <section className="admin-card">
          <h2>Sản phẩm bán chạy</h2>
          {report.topProducts.length === 0 ? (
            <AdminState type="empty" title="Chưa có sản phẩm bán chạy" />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Đã bán</th>
                    <th>Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {report.topProducts.map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{p.sold}</td>
                      <td>{formatPrice(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="admin-card">
          <h2>Đơn hàng trong kỳ</h2>
          {report.orders.length === 0 ? (
            <AdminState type="empty" title="Không có đơn hàng" />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Khách</th>
                    <th>Tổng</th>
                    <th>TT</th>
                  </tr>
                </thead>
                <tbody>
                  {report.orders.slice(0, 10).map((o) => (
                    <tr key={o.id}>
                      <td>{o.id}</td>
                      <td>{o.customer?.name}</td>
                      <td>{formatPrice(o.total)}</td>
                      <td>{o.status}</td>
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

export default AdminReports
