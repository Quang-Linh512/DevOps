import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

const CART_KEY = 'devshop_cart'
const SHIPPING_FEE = 30000
const FREE_SHIPPING_THRESHOLD = 500000

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])
  const [toast, setToast] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    setCartItems(loadCart())
  }, [])

  // Đồng bộ giỏ hàng với localStorage
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems))
  }, [cartItems])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2800)
  }

  const addToCart = (product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
            : item
        )
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          stock: product.stock,
          quantity,
        },
      ]
    })
    showToast('Đã thêm sản phẩm vào giỏ hàng!')
  }

  const updateQuantity = (id, quantity) => {
    if (quantity < 1) return
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        return { ...item, quantity: Math.min(quantity, item.stock) }
      })
    )
  }

  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id))
    showToast('Đã xóa sản phẩm khỏi giỏ hàng', 'info')
  }

  const clearCart = () => {
    setCartItems([])
  }

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const shipping =
    cartItems.length === 0
      ? 0
      : subtotal >= FREE_SHIPPING_THRESHOLD
        ? 0
        : SHIPPING_FEE

  const total = subtotal + shipping

  /** Tạo đơn hàng */
  const placeOrder = async (orderInfo) => {
    // Import orderService dynamically to avoid circular dependency
    const { orderService } = await import('../services/orderService')

    // Transform cart items to order format
    const items = cartItems.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: item.quantity,
    }))

    try {
      const order = await orderService.create({
        ho_ten: orderInfo.name,
        so_dien_thoai: orderInfo.phone,
        dia_chi: orderInfo.address,
        ghi_chu: orderInfo.note || '',
        phuong_thuc_thanh_toan: orderInfo.paymentMethod,
        phi_ship: shipping,
        giam_gia: 0,
        items,
      })

      clearCart()
      showToast('Đặt hàng thành công!')
      return order
    } catch {
      // Fallback: vẫn tạo order local nếu API lỗi
      const localOrder = {
        id: `DH${Date.now()}`,
        createdAt: new Date().toISOString(),
        items: [...cartItems],
        subtotal,
        shipping,
        total,
        status: 'Chờ xác nhận',
        paymentMethod: orderInfo.paymentMethod,
        customer: {
          name: orderInfo.name,
          phone: orderInfo.phone,
          address: orderInfo.address,
          note: orderInfo.note || '',
        },
        userId: user?.id,
      }

      // Save to localStorage
      const raw = localStorage.getItem('devshop_orders')
      const orders = raw ? JSON.parse(raw) : []
      orders.unshift(localOrder)
      localStorage.setItem('devshop_orders', JSON.stringify(orders))

      clearCart()
      showToast('Đặt hàng thành công! (Lưu offline)')
      return localOrder
    }
  }

  const getOrdersByUser = async (userId) => {
    const { orderService } = await import('../services/orderService')

    try {
      const orders = await orderService.getAll()
      if (Array.isArray(orders)) {
        return orders.filter((o) => o.userId === userId || o.customer?.name)
      }
      return []
    } catch {
      // Fallback to localStorage
      try {
        const raw = localStorage.getItem('devshop_orders')
        const orders = raw ? JSON.parse(raw) : []
        return orders
      } catch {
        return []
      }
    }
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        subtotal,
        shipping,
        total,
        toast,
        showToast,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        placeOrder,
        getOrdersByUser,
        FREE_SHIPPING_THRESHOLD,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart phải dùng bên trong CartProvider')
  }
  return ctx
}
