import { useParams, Link, useNavigate } from 'react-router-dom'
import { Container, Row, Col, Badge, Button, Spinner, Alert, Card } from 'react-bootstrap'
import { useFetch } from '../hooks/useFetch'
import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect } from 'react'
import axios from 'axios'
import ReviewSection from '../components/ReviewSection'
import { ShowtimeSkeleton } from '../components/LoadingSkeleton'
import TrailerModal from '../components/TrailerModal'

export default function MovieDetailPage() {
  const { id } = useParams()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const { data: movie, loading: loadingMovie, error } = useFetch(`http://localhost:8080/api/movies/${id}`)

  const [showtimes, setShowtimes] = useState([])
  const [loadingShowtimes, setLoadingShowtimes] = useState(true)
  const [showtimeError, setShowtimeError] = useState(null)
  const [showTrailerModal, setShowTrailerModal] = useState(false)
  useEffect(() => {
    console.log('Fetching showtimes for movie:', id)
    axios.get('http://localhost:8080/api/showtimes')
      .then(res => {
        console.log('All showtimes:', res.data)
        const filtered = res.data.filter(st => String(st.movieId) === String(id))
        console.log('Filtered showtimes for movie:', filtered)
        setShowtimes(filtered)
      })
      .catch(err => {
        console.error('Error fetching showtimes:', err)
        setShowtimeError('Không thể tải lịch chiếu. Vui lòng kiểm tra server.')
      })
      .finally(() => setLoadingShowtimes(false))
  }, [id])

  const groupedShowtimes = showtimes?.reduce((acc, st) => {
    if (!acc[st.date]) acc[st.date] = []
    acc[st.date].push(st)
    return acc
  }, {}) || {}

  if (loadingMovie) return (
    <div className="text-center py-5 mt-5 animate-fade-in">
      <div className="animate-float" style={{ fontSize: 60 }}>🎬</div>
      <Spinner variant="warning" style={{ width: 60, height: 60, marginTop: '2rem' }} />
      <p className="mt-3 text-muted">Đang tải thông tin phim...</p>
    </div>
  )
  if (error) return <Alert variant="danger" className="m-4 animate-fade-in">Không tìm thấy phim.</Alert>
  if (!movie) return null

  const handleBook = (showtimeId, availableSeats, showtimeDate, showtimeTime) => {
    console.log('handleBook called:', { showtimeId, availableSeats, currentUser })
    
    const now = new Date()
    const showtimeDateTime = new Date(`${showtimeDate}T${showtimeTime}`)
    
    if (showtimeDateTime < now) {
      alert('❌ Suất chiếu này đã qua. Vui lòng chọn suất chiếu khác.')
      return
    }
    
    if (!currentUser) {
      console.log('User not logged in, redirecting to login')
      navigate('/login', { state: { from: `/booking/${showtimeId}` } })
      return
    }
    if (availableSeats <= 0) {
      console.log('No available seats')
      return
    }
    console.log('Navigating to booking page:', `/booking/${showtimeId}`)
    navigate(`/booking/${showtimeId}`)
  }

  const isShowtimePassed = (date, time) => {
    const now = new Date()
    const showtimeDateTime = new Date(`${date}T${time}`)
    return showtimeDateTime < now
  }

  return (
    <div className="page-wrapper">
      
      <div className="movie-detail-banner">
        <div className="movie-detail-overlay"></div>
        <Container className="position-relative py-5">
          <Row className="align-items-start g-4">
            <Col xs={12} md={3} className="text-center text-md-start animate-fade-in-left">
              <img
                src={movie.poster}
                alt={movie.title}
                className="detail-poster shadow-lg"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/300x450?text=No+Image' }}
              />
            </Col>
            <Col xs={12} md={9} className="text-white animate-fade-in-right">
              <Badge bg="warning" text="dark" className="mb-2">{movie.ageRating}</Badge>
              <h1 className="fw-bold mb-2" style={{ fontSize: '2.5rem' }}>{movie.title}</h1>
              <div className="d-flex flex-wrap gap-3 mb-3 movie-meta">
                <span className="badge bg-warning text-dark">⭐ <strong>{movie.rating}</strong>/10</span>
                <span className="badge bg-secondary">⏱ {movie.duration} phút</span>
                <span className="badge bg-info">🎭 {movie.genre}</span>
                <span className="badge bg-purple">🌐 {movie.language}</span>
              </div>
              <p className="movie-desc-text mb-3" style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
                {movie.description}
              </p>
              <div className="movie-info-grid mb-4" style={{ fontSize: '1rem' }}>
                <div><span className="info-label">Đạo diễn:</span> {movie.director}</div>
                <div><span className="info-label">Diễn viên:</span> {movie.cast}</div>
                <div><span className="info-label">Khởi chiếu:</span> {movie.releaseDate}</div>
              </div>
              {movie.trailerUrl && (
                <Button
                  variant="warning"
                  size="lg"
                  className="fw-bold animate-fade-in-up"
                  onClick={() => setShowTrailerModal(true)}
                  style={{ 
                    boxShadow: '0 4px 15px rgba(255, 193, 7, 0.4)',
                    transition: 'all 0.3s ease',
                    animationDelay: '0.5s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)'
                    e.target.style.boxShadow = '0 8px 25px rgba(255, 193, 7, 0.6)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = '0 4px 15px rgba(255, 193, 7, 0.4)'
                  }}
                >
                  ▶️ Xem Trailer
                </Button>
              )}
            </Col>
          </Row>
        </Container>
      </div>

      
      <Container className="py-5">
        <h3 className="fw-bold mb-4 animate-fade-in-up">🎟️ Lịch Chiếu</h3>
        {showtimeError && (
          <Alert variant="danger" className="animate-fade-in-up">
            {showtimeError}
            <div className="mt-2 small">
              Hãy chắc chắn rằng bạn đã chạy server backend: <code>npm run server</code>
            </div>
          </Alert>
        )}
        {loadingShowtimes ? (
          <ShowtimeSkeleton count={6} />
        ) : Object.keys(groupedShowtimes).length === 0 ? (
          <Alert variant="info" className="animate-fade-in-up">Chưa có lịch chiếu cho phim này.</Alert>
        ) : (
          Object.entries(groupedShowtimes).sort(([a], [b]) => a.localeCompare(b)).map(([date, times], dateIndex) => (
            <div key={date} className="mb-4 animate-fade-in-up" style={{ animationDelay: `${0.2 + dateIndex * 0.1}s` }}>
              <h5 className="date-heading">
                📅 {new Date(date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
              </h5>
              <div className="d-flex flex-wrap gap-3">
                {times.map((st, timeIndex) => {
                  const available = st.totalSeats - st.bookedSeats
                  const percent = Math.round((st.bookedSeats / st.totalSeats) * 100)
                  const isPassed = isShowtimePassed(st.date, st.time)
                  
                  return (
                    <Card key={st.id} className="showtime-card animate-fade-in-up" style={{ 
                      minWidth: 170,
                      animationDelay: `${0.3 + dateIndex * 0.1 + timeIndex * 0.05}s`,
                      opacity: isPassed ? 0.6 : 1
                    }}>
                      <Card.Body className="text-center p-3">
                        <div className="showtime-time">{st.time}</div>
                        <div className="text-muted small">{st.room}</div>
                        <div className="seat-bar my-2">
                          <div className="seat-bar-fill" style={{ width: `${percent}%` }}></div>
                        </div>
                        <div className="small mb-2">
                          {isPassed ? (
                            <span className="text-muted fw-semibold">⏰ Đã chiếu</span>
                          ) : available > 0 ? (
                            <span className="text-success fw-semibold">{available} ghế trống</span>
                          ) : (
                            <span className="text-danger fw-semibold">Hết ghế</span>
                          )}
                        </div>
                        <div className="fw-bold text-warning mb-2" style={{ fontSize: '1.1rem' }}>
                          {st.price?.toLocaleString()}đ
                        </div>
                        <Button
                          id={`book-${st.id}`}
                          size="sm"
                          className="btn-primary-custom w-100"
                          disabled={available <= 0 || isPassed}
                          onClick={() => handleBook(st.id, available, st.date, st.time)}
                        >
                          {isPassed ? '⏰ Đã chiếu' : available > 0 ? '🎟️ Đặt vé ngay' : 'Hết'}
                        </Button>
                      </Card.Body>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))
        )}
        <div className="mt-4 animate-fade-in-up">
          <Button as={Link} to="/movies" variant="outline-secondary" className="btn-primary-custom">
            ← Quay lại danh sách phim
          </Button>
        </div>

        <hr className="my-5" style={{ borderColor: 'var(--border)' }} />
        <ReviewSection movieId={id} movie={movie} />
      </Container>

      
      <TrailerModal
        show={showTrailerModal}
        onHide={() => setShowTrailerModal(false)}
        trailerUrl={movie.trailerUrl}
        movieTitle={movie.title}
      />
    </div>
  )
}
