import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../context/AuthContext'
import Login from './Login'

// Mock authService để kiểm soát kết quả login mà không cần API thật.
vi.mock('../services/authService', () => ({
  authService: {
    isAdmin: (u) => String(u?.role || '').toLowerCase() === 'admin',
    login: vi.fn(),
    register: vi.fn(),
    changePassword: vi.fn(),
    getStoreSettings: vi.fn(),
    saveStoreSettings: vi.fn(),
  },
}))

import { authService } from '../services/authService'

function renderLogin() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<div>TRANG_CHU</div>} />
          <Route path="/admin" element={<div>TRANG_ADMIN</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  )
}

const fill = (labelText, value) => {
  fireEvent.change(screen.getByLabelText(labelText), { target: { value } })
}

describe('Trang Login', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('đăng nhập thành công: chuyển trang, không hiện lỗi', async () => {
    authService.login.mockResolvedValue({
      success: true,
      user: { id: 'u1', email: 'admin@devshop.com', role: 'admin' },
      token: 'jwt-token',
    })

    renderLogin()

    fill('Email', 'admin@devshop.com')
    fill('Mật khẩu', '123456')
    fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }))

    await waitFor(() => expect(authService.login).toHaveBeenCalledTimes(1))
    expect(authService.login).toHaveBeenCalledWith('admin@devshop.com', '123456')

    // Nếu thiếu await, result.success === undefined -> form báo lỗi và KHÔNG chuyển trang.
    await waitFor(() => expect(screen.getByText('TRANG_CHU')).toBeInTheDocument())
    expect(screen.queryByText(/Email hoặc mật khẩu không đúng/)).not.toBeInTheDocument()
  })

  it('đăng nhập thất bại: hiện thông báo lỗi và không chuyển trang', async () => {
    authService.login.mockResolvedValue({
      success: false,
      user: null,
      token: null,
      message: 'Email hoặc mật khẩu không đúng',
    })

    renderLogin()

    fill('Email', 'admin@devshop.com')
    fill('Mật khẩu', 'sai-mat-khau')
    fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }))

    await waitFor(() =>
      expect(screen.getByText('Email hoặc mật khẩu không đúng')).toBeInTheDocument()
    )
    expect(screen.queryByText('TRANG_CHU')).not.toBeInTheDocument()
  })

  it('bỏ trống email hoặc mật khẩu: không gọi API', () => {
    authService.login.mockResolvedValue({ success: true })

    renderLogin()

    fill('Email', 'admin@devshop.com')
    fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }))

    expect(authService.login).not.toHaveBeenCalled()
    expect(screen.getByText('Vui lòng nhập đầy đủ email và mật khẩu')).toBeInTheDocument()
  })

  it('login() ném lỗi: vẫn hiện thông báo, không crash', async () => {
    authService.login.mockRejectedValue(new Error('Mạng không khả dụng'))

    renderLogin()

    fill('Email', 'admin@devshop.com')
    fill('Mật khẩu', '123456')
    fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }))

    await waitFor(() => expect(screen.getByText('Mạng không khả dụng')).toBeInTheDocument())
    expect(screen.queryByText('TRANG_CHU')).not.toBeInTheDocument()
  })

  it('nút bị disable khi đang gửi yêu cầu', async () => {
    let resolveLogin
    authService.login.mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve
      })
    )

    renderLogin()

    fill('Email', 'admin@devshop.com')
    fill('Mật khẩu', '123456')
    fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /đang đăng nhập/i })).toBeDisabled()
    )

    resolveLogin({ success: true, user: { id: 'u1', email: 'a@b.com' }, token: 't' })
    await waitFor(() => expect(screen.getByText('TRANG_CHU')).toBeInTheDocument())
  })
})
