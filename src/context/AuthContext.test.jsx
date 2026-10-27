import { act, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { AuthProvider, useAuth } from './AuthContext'

/**
 * Test AuthContext: đảm bảo login() trả về hình dạng nhất quán
 * { success, user, token, message } và session được lưu/khôi phục đúng.
 */
function Probe() {
  const { user, isAuthenticated, isAdmin, login } = useAuth()
  return (
    <div>
      <span data-testid="authed">{String(isAuthenticated)}</span>
      <span data-testid="admin">{String(isAdmin)}</span>
      <span data-testid="email">{user?.email || ''}</span>
      <button type="button" onClick={() => login('admin@devshop.com', '123456')}>
        login
      </button>
    </div>
  )
}

const seedUser = () => {
  localStorage.setItem(
    'devshop_users',
    JSON.stringify([
      {
        id: 'u1',
        name: 'Admin',
        email: 'admin@devshop.com',
        phone: '09',
        password: '123456',
        role: 'admin',
        status: 'active',
        address: '',
        avatar: '',
      },
    ])
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('không có user thì isAuthenticated=false, isAdmin=false', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    )

    await waitFor(() => expect(screen.getByTestId('authed')).toHaveTextContent('false'))
    expect(screen.getByTestId('admin')).toHaveTextContent('false')
  })

  it('login() thành công trả { success:true, user, token } và lưu session', async () => {
    seedUser()
    let captured = null

    function Capture() {
      const { login, isAuthenticated } = useAuth()
      return (
        <button
          type="button"
          onClick={async () => {
            captured = await login('admin@devshop.com', '123456')
          }}
        >
          {String(isAuthenticated)}
        </button>
      )
    }

    render(
      <AuthProvider>
        <Capture />
      </AuthProvider>
    )

    await act(async () => {
      screen.getByRole('button').click()
    })

    expect(captured).toBeTruthy()
    expect(captured.success).toBe(true)
    expect(captured.user.email).toBe('admin@devshop.com')
    expect(captured.user.role).toBe('admin')
    expect(captured.token).toBeNull()
    expect(captured.message).toBeUndefined()

    // Session phải được lưu lại để reload trang vẫn đăng nhập
    const saved = JSON.parse(localStorage.getItem('devshop_user'))
    expect(saved.email).toBe('admin@devshop.com')
  })

  it('login() thất bại trả { success:false, user:null, token:null, message }', async () => {
    seedUser()
    let captured = null

    function Capture() {
      const { login } = useAuth()
      return (
        <button
          type="button"
          onClick={async () => {
            captured = await login('admin@devshop.com', 'sai-mat-khau')
          }}
        >
          go
        </button>
      )
    }

    render(
      <AuthProvider>
        <Capture />
      </AuthProvider>
    )

    await act(async () => {
      screen.getByRole('button').click()
    })

    expect(captured.success).toBe(false)
    expect(captured.user).toBeNull()
    expect(captured.token).toBeNull()
    expect(captured.message).toBe('Email hoặc mật khẩu không đúng')
    expect(localStorage.getItem('devshop_user')).toBeNull()
  })

  it('khôi phục session từ localStorage khi mount', async () => {
    localStorage.setItem(
      'devshop_user',
      JSON.stringify({ id: 'u1', email: 'admin@devshop.com', role: 'admin', token: 'abc' })
    )

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    )

    await waitFor(() => expect(screen.getByTestId('email')).toHaveTextContent('admin@devshop.com'))
    expect(screen.getByTestId('authed')).toHaveTextContent('true')
    expect(screen.getByTestId('admin')).toHaveTextContent('true')
  })
})
