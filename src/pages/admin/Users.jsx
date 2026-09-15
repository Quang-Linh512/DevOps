import { useEffect, useMemo, useState } from 'react'
import ConfirmModal from '../../components/admin/ConfirmModal'
import AdminState from '../../components/admin/AdminState'
import Loading from '../../components/Loading'
import { userService } from '../../services/userService'
import { useAuth } from '../../context/AuthContext'

function AdminUsers() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [viewUser, setViewUser] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setUsers(await userService.getAll())
    } catch {
      setError('Không thể tải dữ liệu. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    let list = [...users]
    if (role) list = list.filter((u) => u.role === role)
    if (status) list = list.filter((u) => (u.status || 'active') === status)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      )
    }
    return list
  }, [users, role, status, search])

  const runConfirm = async () => {
    if (!confirmAction) return
    try {
      await userService.setStatus(confirmAction.id, confirmAction.status)
      setConfirmAction(null)
      await load()
    } catch (err) {
      setError(err.message || 'Không thể cập nhật người dùng')
      setConfirmAction(null)
    }
  }

  if (loading) return <Loading text="Đang tải người dùng..." />
  if (error && users.length === 0) {
    return <AdminState type="error" title="Lỗi" message={error} actionLabel="Thử lại" onAction={load} />
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Người dùng</h1>
          <p>{filtered.length} tài khoản</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="admin-toolbar">
        <input
          type="search"
          placeholder="Tìm theo tên hoặc email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">Tất cả role</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <AdminState type="empty" title="Không tìm thấy người dùng" />
      ) : (
        <div className="admin-card admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Role</th>
                <th>Trạng thái</th>
                <th>Ngày đăng ký</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isSelf = currentUser?.id === u.id
                const blocked = (u.status || 'active') === 'blocked'
                return (
                  <tr key={u.id}>
                    <td>
                      <img className="admin-avatar" src={u.avatar} alt="" />
                    </td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.phone || '—'}</td>
                    <td>
                      <span className="role-pill">{u.role}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${blocked ? 'status-cancel' : 'status-done'}`}>
                        {blocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="admin-actions">
                      <button type="button" className="btn-text" onClick={() => setViewUser(u)}>
                        Xem
                      </button>
                      {!isSelf && (
                        <button
                          type="button"
                          className={`btn-text ${blocked ? '' : 'danger'}`}
                          onClick={() =>
                            setConfirmAction({
                              id: u.id,
                              status: blocked ? 'active' : 'blocked',
                              name: u.name,
                            })
                          }
                        >
                          {blocked ? 'Mở khóa' : 'Khóa'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {viewUser && (
        <div className="admin-modal-backdrop" onClick={() => setViewUser(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Chi tiết người dùng</h3>
            <div className="admin-user-view">
              <img src={viewUser.avatar} alt="" />
              <dl className="admin-dl">
                <div>
                  <dt>Họ tên</dt>
                  <dd>{viewUser.name}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{viewUser.email}</dd>
                </div>
                <div>
                  <dt>Điện thoại</dt>
                  <dd>{viewUser.phone || '—'}</dd>
                </div>
                <div>
                  <dt>Role</dt>
                  <dd>{viewUser.role}</dd>
                </div>
                <div>
                  <dt>Trạng thái</dt>
                  <dd>{viewUser.status || 'active'}</dd>
                </div>
                <div>
                  <dt>Địa chỉ</dt>
                  <dd>{viewUser.address || '—'}</dd>
                </div>
              </dl>
            </div>
            <div className="admin-modal-actions">
              <button type="button" className="btn btn-primary" onClick={() => setViewUser(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirmAction}
        danger={confirmAction?.status === 'blocked'}
        title={confirmAction?.status === 'blocked' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
        message={
          confirmAction?.status === 'blocked'
            ? `Bạn có chắc muốn khóa tài khoản "${confirmAction?.name}"?`
            : `Mở khóa tài khoản "${confirmAction?.name}"?`
        }
        confirmText={confirmAction?.status === 'blocked' ? 'Khóa' : 'Mở khóa'}
        onCancel={() => setConfirmAction(null)}
        onConfirm={runConfirm}
      />
    </div>
  )
}

export default AdminUsers
