import { createContext, useContext, useEffect, useState } from 'react'

const CartContext = createContext(null)

const CART_KEY = 'devshop_cart'
const ORDERS_KEY = 'devshop_orders'
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

  /** Tạo đơn hàng và lưu localStorage */
  const placeOrder = (orderInfo) => {
    const order = {
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
      userId: orderInfo.userId,
    }

    const raw = localStorage.getItem(ORDERS_KEY)
    const orders = raw ? JSON.parse(raw) : []
    orders.unshift(order)
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
    clearCart()
    showToast('Đặt hàng thành công!')
    return order
  }

  const getOrdersByUser = (userId) => {
    try {
      const raw = localStorage.getItem(ORDERS_KEY)
      const orders = raw ? JSON.parse(raw) : []
      return orders.filter((o) => o.userId === userId)
    } catch {
      return []
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
