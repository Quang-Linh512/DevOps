import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ConfirmModal from '../../components/admin/ConfirmModal'
import AdminState from '../../components/admin/AdminState'
import Loading from '../../components/Loading'
import { productService } from '../../services/productService'
import { categoryService } from '../../services/categoryService'
import { slugify } from '../../services/storage'

const emptyForm = {
  name: '',
  sku: '',
  description: '',
  category: '',
  price: '',
  oldPrice: '',
  stock: '',
  image: '',
  images: [],
  status: 'active',
  slug: '',
  metaTitle: '',
  metaDescription: '',
  isFeatured: false,
  isNew: true,
}

function ProductFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(emptyForm)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [showDelete, setShowDelete] = useState(false)

  useEffect(() => {
    categoryService.getAll().then(setCategories).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    if (!isEdit) return
    let active = true
    setLoading(true)
    productService
      .getById(id)
      .then((p) => {
        if (!active) return
        setForm({
          name: p.name || '',
          sku: p.sku || '',
          description: p.description || '',
          category: p.category || '',
          price: p.price ?? '',
          oldPrice: p.oldPrice ?? '',
          stock: p.stock ?? '',
          image: p.image || '',
          images: p.images || (p.image ? [p.image] : []),
          status: p.status || 'active',
          slug: p.slug || '',
          metaTitle: p.metaTitle || '',
          metaDescription: p.metaDescription || '',
          isFeatured: Boolean(p.isFeatured),
          isNew: Boolean(p.isNew),
        })
      })
      .catch(() => setError('Không tìm thấy sản phẩm'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id, isEdit])

  const setField = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'name' && !isEdit) {
        next.slug = slugify(value)
        next.metaTitle = value
      }
      return next
    })
  }

  const onImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setFieldErrors((prev) => ({ ...prev, image: 'File phải là ảnh' }))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const url = String(reader.result)
      setForm((prev) => ({
        ...prev,
        image: prev.image || url,
        images: [...(prev.images || []), url],
      }))
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const removeImage = (idx) => {
    setForm((prev) => {
      const images = prev.images.filter((_, i) => i !== idx)
      return {
        ...prev,
        images,
        image: images[0] || '',
      }
    })
  }

  const setMainImage = (idx) => {
    setForm((prev) => {
      const images = [...prev.images]
      const [main] = images.splice(idx, 1)
      images.unshift(main)
      return { ...prev, images, image: main }
    })
  }

  const validate = (asDraft = false) => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Nhập tên sản phẩm'
    if (!form.category) errs.category = 'Chọn danh mục'
    if (!asDraft) {
      if (form.price === '' || Number(form.price) < 0) errs.price = 'Giá không hợp lệ'
      if (form.stock === '' || Number(form.stock) < 0) errs.stock = 'Tồn kho không hợp lệ'
      if (!form.image && form.images.length === 0) errs.image = 'Cần ít nhất 1 ảnh'
    }
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const buildPayload = (statusOverride) => ({
    name: form.name.trim(),
    sku: form.sku.trim() || undefined,
    description: form.description.trim(),
    category: form.category,
    price: Number(form.price) || 0,
    oldPrice: Number(form.oldPrice) || Number(form.price) || 0,
    stock: Number(form.stock) || 0,
    image: form.image || form.images[0] || '',
    images: form.images,
    status: statusOverride || form.status,
    slug: form.slug || slugify(form.name),
    metaTitle: form.metaTitle || form.name,
    metaDescription: form.metaDescription,
    isFeatured: form.isFeatured,
    isNew: form.isNew,
    rating: 5,
  })

  const save = async (asDraft = false) => {
    if (!validate(asDraft)) return
    setSaving(true)
    setError('')
    try {
      const payload = buildPayload(asDraft ? 'inactive' : form.status)
      if (isEdit) {
        await productService.update(id, payload)
      } else {
        await productService.create(payload)
      }
      navigate('/admin/products')
    } catch (err) {
      setError(err.message || 'Không thể lưu sản phẩm')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await productService.remove(id)
      navigate('/admin/products')
    } catch {
      setError('Không thể xóa sản phẩm')
      setShowDelete(false)
    }
  }

  if (loading) return <Loading text="Đang tải sản phẩm..." />
  if (error && isEdit && !form.name) {
    return (
      <AdminState
        type="error"
        title="Không tìm thấy"
        message={error}
        actionLabel="Quay lại"
        onAction={() => navigate('/admin/products')}
      />
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>{isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h1>
          <p>{isEdit ? `ID: ${id}` : 'Tạo sản phẩm mới cho cửa hàng'}</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form
        className="admin-form"
        onSubmit={(e) => {
          e.preventDefault()
          save(false)
        }}
      >
        <section className="admin-card">
          <h2>Thông tin cơ bản</h2>
          <div className="admin-form-grid">
            <label>
              Tên sản phẩm *
              <input value={form.name} onChange={(e) => setField('name', e.target.value)} />
              {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
            </label>
            <label>
              SKU
              <input value={form.sku} onChange={(e) => setField('sku', e.target.value)} placeholder="Tự tạo nếu để trống" />
            </label>
            <label className="full">
              Mô tả
              <textarea rows={4} value={form.description} onChange={(e) => setField('description', e.target.value)} />
            </label>
            <label>
              Danh mục *
              <select value={form.category} onChange={(e) => setField('category', e.target.value)}>
                <option value="">Chọn danh mục</option>
                {categories.filter((c) => c.status === 'active').map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              {fieldErrors.category && <span className="field-error">{fieldErrors.category}</span>}
            </label>
            <label>
              Giá *
              <input type="number" min="0" value={form.price} onChange={(e) => setField('price', e.target.value)} />
              {fieldErrors.price && <span className="field-error">{fieldErrors.price}</span>}
            </label>
            <label>
              Giá khuyến mãi / giá cũ
              <input type="number" min="0" value={form.oldPrice} onChange={(e) => setField('oldPrice', e.target.value)} />
            </label>
            <label>
              Tồn kho *
              <input type="number" min="0" value={form.stock} onChange={(e) => setField('stock', e.target.value)} />
              {fieldErrors.stock && <span className="field-error">{fieldErrors.stock}</span>}
            </label>
          </div>
        </section>

        <section className="admin-card">
          <h2>Hình ảnh</h2>
          <div className="admin-upload">
            <input type="file" accept="image/*" onChange={onImageUpload} />
            <input
              type="url"
              placeholder="Hoặc dán URL ảnh"
              value=""
              onChange={(e) => {
                const url = e.target.value.trim()
                if (!url) return
                setForm((prev) => ({
                  ...prev,
                  image: prev.image || url,
                  images: [...prev.images, url],
                }))
                e.target.value = ''
              }}
              onBlur={(e) => {
                const url = e.target.value.trim()
                if (!url) return
                setForm((prev) => ({
                  ...prev,
                  image: prev.image || url,
                  images: prev.images.includes(url) ? prev.images : [...prev.images, url],
                }))
                e.target.value = ''
              }}
            />
            {fieldErrors.image && <span className="field-error">{fieldErrors.image}</span>}
          </div>
          <div className="admin-image-preview">
            {form.images.map((img, idx) => (
              <div key={`${img}-${idx}`} className={`preview-item ${idx === 0 ? 'is-main' : ''}`}>
                <img src={img} alt="" />
                <div className="preview-actions">
                  {idx !== 0 && (
                    <button type="button" onClick={() => setMainImage(idx)}>
                      Ảnh chính
                    </button>
                  )}
                  <button type="button" onClick={() => removeImage(idx)}>
                    Xóa
                  </button>
                </div>
                {idx === 0 && <span className="main-tag">Ảnh chính</span>}
              </div>
            ))}
          </div>
        </section>

        <section className="admin-card">
          <h2>Trạng thái</h2>
          <div className="admin-form-grid">
            <label>
              Trạng thái
              <select value={form.status} onChange={(e) => setField('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setField('isFeatured', e.target.checked)}
              />
              Sản phẩm nổi bật
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.isNew}
                onChange={(e) => setField('isNew', e.target.checked)}
              />
              Sản phẩm mới
            </label>
          </div>
        </section>

        <section className="admin-card">
          <h2>SEO cơ bản</h2>
          <div className="admin-form-grid">
            <label>
              Slug
              <input value={form.slug} onChange={(e) => setField('slug', e.target.value)} />
            </label>
            <label>
              Meta title
              <input value={form.metaTitle} onChange={(e) => setField('metaTitle', e.target.value)} />
            </label>
            <label className="full">
              Meta description
              <textarea
                rows={3}
                value={form.metaDescription}
                onChange={(e) => setField('metaDescription', e.target.value)}
              />
            </label>
          </div>
        </section>

        <div className="admin-form-actions">
          <Link to="/admin/products" className="btn btn-outline">
            Hủy
          </Link>
          {!isEdit && (
            <button type="button" className="btn btn-outline" disabled={saving} onClick={() => save(true)}>
              Lưu nháp
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm sản phẩm'}
          </button>
          {isEdit && (
            <button type="button" className="btn btn-danger" onClick={() => setShowDelete(true)}>
              Xóa
            </button>
          )}
        </div>
      </form>

      <ConfirmModal
        open={showDelete}
        danger
        title="Xóa sản phẩm"
        message="Bạn có chắc chắn muốn xóa sản phẩm này?"
        confirmText="Xóa"
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

export default ProductFormPage
