function StatCard({ title, value, change, icon, format = 'number' }) {
  const display =
    format === 'currency'
      ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0)
      : new Intl.NumberFormat('vi-VN').format(value || 0)

  const up = (change || 0) >= 0

  return (
    <div className="admin-stat-card">
      <div className="admin-stat-icon" aria-hidden="true">
        {icon}
      </div>
      <div>
        <p className="admin-stat-label">{title}</p>
        <h3 className="admin-stat-value">{display}</h3>
        {change !== undefined && change !== null && (
          <p className={`admin-stat-change ${up ? 'up' : 'down'}`}>
            {up ? '↑' : '↓'} {Math.abs(change)}% so với kỳ trước
          </p>
        )}
      </div>
    </div>
  )
}

export default StatCard
