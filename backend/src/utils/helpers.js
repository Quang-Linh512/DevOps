export function slugify(text = '') {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function toUserResponse(user, token) {
  const obj = user.toObject ? user.toObject() : { ...user }
  delete obj.password
  delete obj.__v
  const payload = {
    id: String(obj._id || obj.id),
    name: obj.name,
    email: obj.email,
    phone: obj.phone || '',
    role: obj.role,
    status: obj.status || 'active',
    address: obj.address || '',
    avatar: obj.avatar || '',
    createdAt: obj.createdAt,
  }
  if (token) payload.token = token
  return payload
}

export function toProductResponse(doc) {
  const p = doc.toObject ? doc.toObject() : { ...doc }
  return {
    id: Number(p.numericId),
    name: p.name,
    sku: p.sku,
    price: p.price,
    oldPrice: p.oldPrice,
    image: p.image,
    images: p.images || (p.image ? [p.image] : []),
    category: p.category,
    description: p.description || '',
    rating: p.rating ?? 5,
    stock: p.stock ?? 0,
    isFeatured: Boolean(p.isFeatured),
    isNew: p.isNewItem !== false,
    status: p.status || 'active',
    slug: p.slug,
    metaTitle: p.metaTitle || p.name,
    metaDescription: p.metaDescription || '',
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    sold: p.sold || 0,
  }
}

export function toCategoryResponse(doc) {
  const c = doc.toObject ? doc.toObject() : { ...doc }
  return {
    id: c.slugId || String(c._id),
    name: c.name,
    icon: c.icon || '📦',
    slug: c.slug,
    description: c.description || '',
    status: c.status || 'active',
    createdAt: c.createdAt,
  }
}

export function toOrderResponse(doc) {
  const o = doc.toObject ? doc.toObject() : { ...doc }
  return {
    id: o.orderCode,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    items: o.items,
    subtotal: o.subtotal,
    shipping: o.shipping,
    total: o.total,
    status: o.status,
    paymentMethod: o.paymentMethod,
    customer: o.customer,
    userId: o.userId ? String(o.userId) : null,
    statusHistory: o.statusHistory || [],
  }
}
