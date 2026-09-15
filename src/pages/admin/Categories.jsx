import { useEffect, useMemo, useState } from 'react'
import ConfirmModal from '../../components/admin/ConfirmModal'
import AdminState from '../../components/admin/AdminState'
import Loading from '../../components/Loading'
import { categoryService } from '../../services/categoryService'
import { slugify } from '../../services/storage'

const empty = { name: '', slug: '', description: '', status: 'active', icon: '📦' }

function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [fieldError, setFieldError] = useState('')
  const [deleteId, setDeleteId] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setCategories(await categoryService.getAll())
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
    if (!search.trim()) return categories
    const q = search.toLowerCase()
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.slug || '').toLowerCase().includes(q)
    )
  }, [categories, search])

  const openCreate = () => {
    setEditing(null)
    setForm(empty)
    setFieldError('')
    setModalOpen(true)
  }

  const openEdit = (cat) => {
    setEditing(cat)
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      status: cat.status || 'active',
      icon: cat.icon || '📦',
    })
    setFieldError('')
    setModalOpen(true)
  }

  const save = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setFieldError('Nhập tên danh mục')
      return
    }
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
      }
      if (editing) await categoryService.update(editing.id, payload)
      else await categoryService.create(payload)
      setModalOpen(false)
      await load()
    } catch (err) {
      setFieldError(err.message || 'Không thể lưu danh mục')
    }
  }

  const confirmDelete = async () => {
    try {
      await categoryService.remove(deleteId)
      setDeleteId(null)
      await load()
    } catch {
      setError('Không thể xóa danh mục')
      setDeleteId(null)
    }
  }

  const toggleStatus = async (cat) => {
    await categoryService.update(cat.id, {
      status: cat.status === 'active' ? 'inactive' : 'active',
    })
    await load()
  }

  if (loading) return <Loading text="Đang tải danh mục..." />
  if (error && categories.length === 0) {
    return <AdminState type="error" title="Lỗi" message={error} actionLabel="Thử lại" onAction={load} />
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Danh mục</h1>
          <p>{filtered.length} danh mục</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          + Thêm danh mục
        </button>
      </div>

      <div className="admin-toolbar">
        <input
          type="search"
          placeholder="Tìm danh mục..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <AdminState
          type="empty"
          title="Chưa có danh mục"
          actionLabel="+ Thêm danh mục"
          onAction={openCreate}
        />
      ) : (
        <div className="admin-card admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Icon</th>
                <th>Tên</th>
                <th>Slug</th>
                <th>Mô tả</th>
                <th>Trạng thái</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>{c.icon}</td>
                  <td>{c.name}</td>
                  <td>{c.slug}</td>
                  <td>{c.description || '—'}</td>
                  <td>
                    <button type="button" className="btn-text" onClick={() => toggleStatus(c)}>
                      <span className={`status-badge ${c.status === 'active' ? 'status-done' : 'status-cancel'}`}>
                        {c.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </button>
                  </td>
                  <td className="admin-actions">
                    <button type="button" className="btn-text" onClick={() => openEdit(c)}>
                      Sửa
                    </button>
                    <button type="button" className="btn-text danger" onClick={() => setDeleteId(c.id)}>
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? 'Sửa danh mục' : 'Thêm danh mục'}</h3>
            <form onSubmit={save} className="admin-modal-form">
              <label>
                Tên *
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      name: e.target.value,
                      slug: editing ? p.slug : slugify(e.target.value),
                    }))
                  }
                />
              </label>
              <label>
                Slug
                <input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} />
              </label>
              <label>
                Mô tả
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
              </label>
              <label>
                Trạng thái
                <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              {fieldError && <div className="alert alert-error">{fieldError}</div>}
              <div className="admin-modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        danger
        title="Xóa danh mục"
        message="Bạn có chắc chắn muốn xóa danh mục này?"
        confirmText="Xóa"
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

export default AdminCategories
