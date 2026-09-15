import ProductCard from './ProductCard'

function ProductList({ products, emptyMessage = 'Không tìm thấy sản phẩm' }) {
  if (!products || products.length === 0) {
    return (
      <div className="empty-state">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

export default ProductList
