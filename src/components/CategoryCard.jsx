import { Link } from 'react-router-dom'

function CategoryCard({ category }) {
  return (
    <Link
      to={`/products?category=${encodeURIComponent(category.name)}`}
      className="category-card"
    >
      <span className="category-icon" aria-hidden="true">
        {category.icon}
      </span>
      <span className="category-name">{category.name}</span>
    </Link>
  )
}

export default CategoryCard
