/**
 * In-memory adapter cho test API.
 *
 * MỤC ĐÍCH: chạy được API thật (Express + routes + middleware + schema
 * mongoose) mà KHÔNG cần MongoDB/Docker.
 *
 * Ràng buộc:
 *  - Chỉ dùng trong môi trường test (`NODE_ENV=test`).
 *  - Không được import từ code production.
 *  - Chỉ thay lớp lưu trữ (mongoose Model -> bộ nhớ), GIỮ NGUYÊN:
 *      routes, middleware/auth.js, utils/helpers.js và schema mongoose
 *      (default, enum, validate, timestamps) để hành vi khớp production.
 */

let mongoose
let models = {}

let idCounter = 0
function nextId() {
  idCounter += 1
  return `mem-${idCounter}`
}

function nowIso() {
  return new Date().toISOString()
}

/** So khớp filter mongoose (chỉ cần các toán tử dùng trong routes hiện tại) */
function matches(doc, filter = {}) {
  return Object.entries(filter).every(([key, cond]) => {
    const value = doc[key]
    if (cond && typeof cond === 'object' && !Array.isArray(cond)) {
      // toán tử so sánh chuỗi (vd. Product.findOne({ numericId: Number(id) }))
      if ('$in' in cond) return cond.$in.some((v) => String(v) === String(value))
      if ('$ne' in cond) return String(value) !== String(cond.$ne)
      if ('$gt' in cond) return Number(value) > Number(cond.$gt)
      if ('$lt' in cond) return Number(value) < Number(cond.$lt)
      return String(value) === String(cond)
    }
    if (typeof value === 'number' || typeof cond === 'number') {
      return Number(value) === Number(cond)
    }
    return String(value) === String(cond)
  })
}

/** Sắp xếp theo chuỗi sort của mongoose, ví dụ .sort({ createdAt: -1 }) */
function applySort(list, sortSpec) {
  if (!sortSpec) return list
  const entries = Object.entries(sortSpec)
  return [...list].sort((a, b) => {
    for (const [key, dir] of entries) {
      const av = a[key]
      const bv = b[key]
      if (av === bv) continue
      const cmp = av > bv ? 1 : -1
      return dir < 0 ? -cmp : cmp
    }
    return 0
  })
}

/**
 * Tạo một Model giả từ schema mongoose thật.
 * Dùng schema để áp dụng default/enum/required -> hành vi gần với production.
 */
function createStubModel(modelName, schema) {
  const paths = schema.paths || {}

  function buildDoc(obj = {}) {
    const doc = { _id: obj._id || nextId(), ...obj }
    // áp dụng default từ schema
    for (const [path, def] of Object.entries(paths)) {
      if (path === '_id') continue
      if (doc[path] !== undefined) continue
      const hasDefault =
        def && def.defaultValue !== undefined && typeof def.defaultValue !== 'function'
      if (hasDefault) doc[path] = def.defaultValue
      else if (def && typeof def.defaultValue === 'function') {
        doc[path] = def.defaultValue()
      }
    }
    // timestamps
    if (schema.options?.timestamps && !doc.createdAt) doc.createdAt = nowIso()
    if (schema.options?.timestamps && !doc.updatedAt) doc.updatedAt = nowIso()
    doc.__v = 0

    doc.toObject = function () {
      const { toObject: _toObject, save: _save, __v: _v, ...rest } = doc
      return { ...rest }
    }
    doc.toJSON = function () {
      return doc.toObject()
    }
    doc.save = async function () {
      const idx = store.findIndex((d) => d._id === doc._id)
      if (idx >= 0) store[idx] = doc
      else store.push(doc)
      return doc
    }
    doc.remove = async function () {
      const idx = store.findIndex((d) => d._id === doc._id)
      if (idx >= 0) store.splice(idx, 1)
      return doc
    }
    return doc
  }

  const store = []

  function applyDefaults(obj) {
    // enum -> lấy giá trị đầu tiên hợp lệ nếu thiếu
    for (const [path, def] of Object.entries(paths)) {
      if (path === '_id') continue
      if (obj[path] !== undefined) continue
      const enums = def?.enumValues
      if (enums && enums.length) {
        obj[path] = enums[0]
        continue
      }
      if (def && def.defaultValue !== undefined && typeof def.defaultValue !== 'function') {
        obj[path] = def.defaultValue
      } else if (def && typeof def.defaultValue === 'function') {
        obj[path] = def.defaultValue()
      }
    }
    return obj
  }

  const Model = {
    modelName,
    schema,

    async create(obj) {
      const doc = buildDoc(applyDefaults({ ...obj }))
      // unique check cho các field có unique:true
      for (const [path, def] of Object.entries(paths)) {
        if (def?.options?.unique) {
          const dup = store.find((d) => String(d[path]) === String(doc[path]))
          if (dup) {
            const err = new Error(
              `E11000 duplicate key error collection: ${modelName} index: ${path}`
            )
            err.code = 11000
            throw err
          }
        }
      }
      store.push(doc)
      return doc
    },

    async insertMany(arr) {
      const docs = []
      for (const o of arr) {
        const doc = buildDoc(applyDefaults({ ...o }))
        store.push(doc)
        docs.push(doc)
      }
      return docs
    },

    find(filter = {}) {
      const result = store.filter((d) => matches(d, filter))
      // Query-like object: hỗ trợ .sort().limit().lean() và await trực tiếp,
      // đúng như Query của mongoose (dùng .sort() rồi .limit()).
      const build = (list) => {
        const q = {
          sort: (spec) => build(applySort(list, spec)),
          limit: (n) => build(list.slice(0, n)),
          skip: (n) => build(list.slice(n)),
          select: () => q,
          lean: async () => list.map((d) => d.toObject()),
          then: (fn, rej) => Promise.resolve(fn(list)).catch(rej),
          catch: (rej) => Promise.reject(rej),
        }
        return q
      }
      return build(result)
    },

    findOne(filter = {}) {
      // Hỗ trợ .sort(spec) trên query (dùng bởi nextNumericId trong routes/products.js:
      // Product.findOne().sort({ numericId: -1 }).lean()).
      let result = store.filter((d) => matches(d, filter))
      const build = (list) => {
        const q = {
          sort: (spec) => build(applySort(list, spec)),
          limit: (n) => build(list.slice(0, n)),
          select: () => q,
          lean: async () => (list[0] ? list[0].toObject() : null),
          then: (fn, rej) => Promise.resolve(fn(list[0] || null)).catch(rej),
          catch: (rej) => Promise.reject(rej),
        }
        return q
      }
      return build(result)
    },

    findById(id) {
      const found = store.find((d) => String(d._id) === String(id)) || null
      return {
        then: (fn, rej) => Promise.resolve(fn(found)).catch(rej),
        catch: (rej) => Promise.reject(rej),
        lean: async () => (found ? found.toObject() : null),
      }
    },
    findOneAndDelete(filter = {}) {
      const idx = store.findIndex((d) => matches(d, filter))
      const removed = idx >= 0 ? store.splice(idx, 1)[0] : null
      return {
        then: (fn, rej) => Promise.resolve(fn(removed)).catch(rej),
        catch: (rej) => Promise.reject(rej),
      }
    },

    findOneAndUpdate(filter = {}, update = {}) {
      const found = store.find((d) => matches(d, filter))
      if (found) Object.assign(found, applyDefaults(update))
      return {
        then: (fn, rej) => Promise.resolve(fn(found)).catch(rej),
        catch: (rej) => Promise.reject(rej),
      }
    },

    async countDocuments(filter = {}) {
      return store.filter((d) => matches(d, filter)).length
    },

    async deleteMany(filter = {}) {
      const keep = store.filter((d) => !matches(d, filter))
      const removed = store.length - keep.length
      store.length = 0
      store.push(...keep)
      return { deletedCount: removed }
    },

    /** Truy cập trực tiếp store (chỉ dùng trong test) */
    __store: store,
  }

  return Model
}

/**
 * Cài đặt stub cho mongoose.Model -> dùng để import các route/model hiện có.
 * Phải gọi TRƯỚC khi import các module route (vì chúng gọi mongoose.model lúc load).
 */
export async function installInMemoryMongo() {
  mongoose = mongoose || (await import('mongoose')).default

  const originalModel = mongoose.model
  mongoose.model = function (name, schema) {
    if (!schema) {
      // mongoose.model('Name') -> trả về model đã tạo
      return models[name]
    }
    if (!models[name]) {
      models[name] = createStubModel(name, schema)
    }
    return models[name]
  }
  mongoose.__originalModel = originalModel
  mongoose.__inMemoryInstalled = true
  return mongoose
}

/** Đặt dữ liệu mẫu vào store của một model (dùng trong test) */
export function seedModel(name, docs) {
  const model = models[name]
  if (!model) throw new Error(`Model ${name} chưa được khởi tạo`)
  for (const d of docs) {
    const doc = { _id: d._id || nextId(), ...d }
    const paths = model.schema.paths || {}
    for (const [path, def] of Object.entries(paths)) {
      if (path === '_id') continue
      if (doc[path] !== undefined) continue
      const enums = def?.enumValues
      if (enums && enums.length) doc[path] = enums[0]
      else if (def && def.defaultValue !== undefined && typeof def.defaultValue !== 'function') {
        doc[path] = def.defaultValue
      } else if (def && typeof def.defaultValue === 'function') {
        doc[path] = def.defaultValue()
      }
    }
    if (model.schema.options?.timestamps) {
      doc.createdAt = doc.createdAt || nowIso()
      doc.updatedAt = doc.updatedAt || nowIso()
    }
    doc.toObject = function () {
      const {
        toObject: _toObject,
        toJSON: _toJSON,
        save: _save,
        remove: _remove,
        __v: _v,
        ...rest
      } = doc
      return { ...rest }
    }
    doc.save = async function () {
      const idx = model.__store.findIndex((x) => x._id === doc._id)
      if (idx >= 0) model.__store[idx] = doc
      else model.__store.push(doc)
      return doc
    }
    model.__store.push(doc)
  }
}

/** Lấy store in-memory của một model (để assert trong test) */
export function getStore(name) {
  const model = models[name]
  if (!model) throw new Error(`Model ${name} chưa được khởi tạo`)
  return model.__store
}

/** Xóa toàn bộ dữ liệu trong các store (giữa các test case) */
export function clearStores() {
  for (const model of Object.values(models)) {
    model.__store.length = 0
  }
  idCounter = 0
}

/** Danh sách model đã đăng ký (để debug) */
export function listModels() {
  return Object.keys(models)
}

export default {
  installInMemoryMongo,
  seedModel,
  getStore,
  clearStores,
  listModels,
}
