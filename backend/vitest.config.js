import { defineConfig } from 'vite'

/**
 * Config vitest riêng cho backend API test.
 *
 * Chạy: npm run test:api  (từ thư mục gốc)
 *
 * - environment: 'node'  -> test API thật (không cần DOM)
 * - không setupFiles của frontend (setupTests.js phụ thuộc localStorage/jsdom)
 * - KHÔNG thêm dependency: dùng vitest đã có ở node_modules gốc
 */
export default defineConfig({
  test: {
    name: 'backend-api',
    environment: 'node',
    globals: true,
    include: ['backend/test/**/*.test.js'],
    testTimeout: 20000,
    hookTimeout: 20000,
  },
})
