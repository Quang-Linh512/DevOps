function AdminState({ type = 'empty', title, message, actionLabel, onAction }) {
  return (
    <div className={`admin-state admin-state-${type}`}>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {actionLabel && onAction && (
        <button type="button" className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default AdminState
