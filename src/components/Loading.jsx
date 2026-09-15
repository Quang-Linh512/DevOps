function Loading({ text = 'Đang tải...' }) {
  return (
    <div className="loading" role="status" aria-live="polite">
      <div className="spinner" />
      <p>{text}</p>
    </div>
  )
}

export default Loading
