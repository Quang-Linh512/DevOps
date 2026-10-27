import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../context/AuthContext'
import Register from './Register'

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

function renderRegister() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<div>TRANG_DANG_NHAP</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  )
}

const fill = (labelText, value) => {
  fireEvent.change(screen.getByLabelText(labelText), { target: { value } })
}

const fillValidForm = () => {
  fill('Họ tên', 'Nguyễn Văn A')
  fill('Email', 'a@devshop.com')
  fill('Số điện thoại', '0900000000')
  fill('Mật khẩu', '123456')
  fill('Nhập lại mật khẩu', '123456')
}

describe('Trang Register', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('đăng ký thành công: hiện thông báo thành công rồi chuyển sang trang đăng nhập', async () => {
    authService.register.mockResolvedValue({
      success: true,
      message: 'Đăng ký thành công! Vui lòng đăng nhập.',
    })

    renderRegister()
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: /^đăng ký$/i }))

    await waitFor(() => expect(authService.register).toHaveBeenCalledTimes(1))
    expect(authService.register).toHaveBeenCalledWith({
      name: 'Nguyễn Văn A',
      email: 'a@devshop.com',
      phone: '0900000000',
      password: '123456',
    })

    await waitFor(() =>
      expect(screen.getByText('Đăng ký thành công! Vui lòng đăng nhập.')).toBeInTheDocument()
    )
    expect(screen.queryByText(/không được bỏ trống/)).not.toBeInTheDocument()
  })

  it('đăng ký thất bại: hiện lỗi và không chuyển trang', async () => {
    authService.register.mockResolvedValue({
      success: false,
      message: 'Email đã được sử dụng',
    })

    renderRegister()
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: /^đăng ký$/i }))

    await waitFor(() => expect(screen.getByText('Email đã được sử dụng')).toBeInTheDocument())
    expect(screen.queryByText('TRANG_DANG_NHAP')).not.toBeInTheDocument()
  })

  it('bỏ trống trường bắt buộc: không gọi API', () => {
    authService.register.mockResolvedValue({ success: true })

    renderRegister()
    fill('Email', 'a@devshop.com')
    fireEvent.click(screen.getByRole('button', { name: /^đăng ký$/i }))

    expect(authService.register).not.toHaveBeenCalled()
    expect(screen.getByText('Vui lòng không bỏ trống các trường')).toBeInTheDocument()
  })

  it('email sai định dạng: không gọi API', () => {
    authService.register.mockResolvedValue({ success: true })

    renderRegister()
    fill('Họ tên', 'A')
    fill('Email', 'khong-hop-le')
    fill('Số điện thoại', '09')
    fill('Mật khẩu', '123456')
    fill('Nhập lại mật khẩu', '123456')
    fireEvent.click(screen.getByRole('button', { name: /^đăng ký$/i }))

    expect(authService.register).not.toHaveBeenCalled()
    expect(screen.getByText('Email không đúng định dạng')).toBeInTheDocument()
  })

  it('mật khẩu ngắn hơn 6 ký tự: không gọi API', () => {
    authService.register.mockResolvedValue({ success: true })

    renderRegister()
    fill('Họ tên', 'A')
    fill('Email', 'a@devshop.com')
    fill('Số điện thoại', '09')
    fill('Mật khẩu', '12345')
    fill('Nhập lại mật khẩu', '12345')
    fireEvent.click(screen.getByRole('button', { name: /^đăng ký$/i }))

    expect(authService.register).not.toHaveBeenCalled()
    expect(screen.getByText('Mật khẩu tối thiểu 6 ký tự')).toBeInTheDocument()
  })

  it('hai mật khẩu không khớp: không gọi API', () => {
    authService.register.mockResolvedValue({ success: true })

    renderRegister()
    fill('Họ tên', 'A')
    fill('Email', 'a@devshop.com')
    fill('Số điện thoại', '09')
    fill('Mật khẩu', '123456')
    fill('Nhập lại mật khẩu', '654321')
    fireEvent.click(screen.getByRole('button', { name: /^đăng ký$/i }))

    expect(authService.register).not.toHaveBeenCalled()
    expect(screen.getByText('Hai mật khẩu phải giống nhau')).toBeInTheDocument()
  })

  it('register() ném lỗi: hiện thông báo, không crash', async () => {
    authService.register.mockRejectedValue(new Error('Mạng không khả dụng'))

    renderRegister()
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: /^đăng ký$/i }))

    await waitFor(() => expect(screen.getByText('Mạng không khả dụng')).toBeInTheDocument())
  })
})
