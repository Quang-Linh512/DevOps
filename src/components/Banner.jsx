import { Link } from 'react-router-dom'

function Banner({
  title,
  subtitle,
  ctaText = 'Mua ngay',
  ctaLink = '/products',
  image,
  variant = 'hero',
}) {
  return (
    <section
      className={`banner banner-${variant}`}
      style={image ? { '--banner-image': `url(${image})` } : undefined}
    >
      <div className="banner-overlay" />
      <div className="container banner-content">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
        <Link to={ctaLink} className="btn btn-accent">
          {ctaText}
        </Link>
      </div>
    </section>
  )
}

export default Banner
