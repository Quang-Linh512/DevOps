/**
 * HTTP client nhỏ cho test, dựa trên `app.listen(0)` + `fetch` native của Node.
 * Không thêm dependency (không dùng supertest) -> giữ nguyên package.json.
 */
import request from 'node:http'

/**
 * Khởi động app trên một cổng ngẫu nhiên.
 * @returns {Promise<{ baseUrl: string, close: () => Promise<void> }>}
 */
export async function startServer(app) {
  const server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  const { port } = server.address()

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise((resolve) => {
        server.close(() => resolve())
      }),
  }
}

/**
 * Gọi API và trả về { status, body, headers, text }.
 *
 * @param {string} baseUrl
 * @param {string} method
 * @param {string} path
 * @param {{ token?: string, body?: unknown }} [options]
 */
export async function apiCall(baseUrl, method, path, options = {}) {
  const url = new URL(baseUrl + path)
  const payload = options.body === undefined ? undefined : JSON.stringify(options.body)

  const headers = {}
  if (payload !== undefined) headers['Content-Type'] = 'application/json'
  if (options.token) headers.Authorization = `Bearer ${options.token}`

  return new Promise((resolve, reject) => {
    const req = request.request(
      {
        method,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        headers,
      },
      (res) => {
        let raw = ''
        res.setEncoding('utf8')
        res.on('data', (chunk) => (raw += chunk))
        res.on('end', () => {
          let body = raw
          const contentType = res.headers['content-type'] || ''
          if (contentType.includes('application/json')) {
            try {
              body = raw ? JSON.parse(raw) : null
            } catch {
              body = raw
            }
          }
          resolve({
            status: res.statusCode,
            body,
            headers: res.headers,
            text: raw,
          })
        })
      }
    )
    req.on('error', reject)
    if (payload !== undefined) req.write(payload)
    req.end()
  })
}

/**
 * Tạo một client gọn gàng cho test.
 * @param {string} baseUrl
 */
export function createClient(baseUrl) {
  const call = (method, path, options) => apiCall(baseUrl, method, path, options)
  return {
    baseUrl,
    get: (path, options) => call('GET', path, options),
    post: (path, options) => call('POST', path, options),
    put: (path, options) => call('PUT', path, options),
    patch: (path, options) => call('PATCH', path, options),
    delete: (path, options) => call('DELETE', path, options),
  }
}
