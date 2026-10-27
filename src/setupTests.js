import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Dọn DOM và localStorage sau mỗi test để các test không ảnh hưởng lẫn nhau.
afterEach(() => {
  cleanup()
  localStorage.clear()
})
