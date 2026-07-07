import { useMemo, useState } from 'react'
import { Card, Badge } from 'react-bootstrap'
import { Link } from 'react-router-dom'

export default function MovieCard({ movie }) {
  const [isHovered, setIsHovered] = useState(false)

  const genreBadgeColor = {
    'Hành động': 'danger',
    'Giật gân': 'warning',
    'Khoa học viễn tưởng': 'info',
    'Hoạt hình': 'success',
    'Lịch sử': 'secondary',
    'Tình cảm': 'pink',
  }

  const trailerVideoId = useMemo(() => {
    if (!movie?.trailerUrl) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = movie.trailerUrl.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }, [movie?.trailerUrl])

  const shouldShowTrailerPreview = isHovered && Boolean(trailerVideoId)

  return (
    <Card
      className={`movie-card h-100 ${shouldShowTrailerPreview ? 'trailer-preview-active' : ''}`}
      as={Link}
      to={`/movies/${movie.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="movie-poster-wrapper">
        {shouldShowTrailerPreview ? (
          <iframe
            src={`https://www.youtube.com/embed/${trailerVideoId}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1&rel=0`}
            title={`Trailer preview ${movie.title}`}
            className="movie-trailer-preview"
            allow="autoplay; encrypted-media; picture-in-picture"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <Card.Img
            variant="top"
            src={movie.poster}
            alt={movie.title}
            className="movie-poster"
            onError={(e) => { e.target.src = 'https://via.placeholder.com/300x450?text=No+Image' }}
          />
        )}
        <div className="movie-overlay">
          <span className="view-detail-btn">
            {shouldShowTrailerPreview ? 'Đang phát trailer' : 'Xem chi tiết →'}
          </span>
        </div>
        <div className="movie-rating-badge">⭐ {movie.rating}</div>
        <Badge className="age-badge" bg="dark">{movie.ageRating}</Badge>
      </div>
      <Card.Body className="d-flex flex-column">
        <Card.Title className="movie-title">{movie.title}</Card.Title>
        <div className="d-flex gap-2 mb-2 flex-wrap">
          
          {movie.genres && Array.isArray(movie.genres) ? (
            movie.genres.slice(0, 2).map((genre, index) => (
              <Badge key={index} bg={genreBadgeColor[genre] || 'primary'} className="genre-badge">
                {genre}
              </Badge>
            ))
          ) : (
            <Badge bg={genreBadgeColor[movie.genre] || 'primary'} className="genre-badge">
              {movie.genre}
            </Badge>
          )}
          {movie.genres && movie.genres.length > 2 && (
            <Badge bg="secondary" className="genre-badge" style={{ opacity: 0.7 }}>
              +{movie.genres.length - 2}
            </Badge>
          )}
          <span className="duration-text">⏱ {movie.duration} phút</span>
        </div>
        <Card.Text className="movie-description text-muted">
          {movie.description?.substring(0, 80)}...
        </Card.Text>
      </Card.Body>
    </Card>
  )
}
