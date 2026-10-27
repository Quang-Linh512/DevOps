import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.js'],
    // Ép chế độ localStorage cho toàn bộ test để kết quả không phụ thuộc vào
    // file .env cục bộ của từng máy (có thể bật VITE_USE_REMOTE_API=true).
    env: {
      VITE_USE_REMOTE_API: 'false',
      VITE_API_URL: '/api',
    },
  },
})
