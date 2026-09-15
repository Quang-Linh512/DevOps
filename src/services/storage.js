/**
 * Helper đọc/ghi localStorage an toàn.
 * Khi backend sẵn sàng, các service sẽ chuyển sang Axios thay vì storage này.
 */

export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function delay(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
