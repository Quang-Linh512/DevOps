import { useCart } from '../context/CartContext'

/** Hiển thị thông báo toast toàn cục */
function Toast() {
  const { toast } = useCart()

  if (!toast) return null

  return (
    <div className={`toast toast-${toast.type}`} role="status">
      {toast.message}
    </div>
  )
}

export default Toast
