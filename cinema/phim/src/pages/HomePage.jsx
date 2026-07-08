import { Link } from 'react-router-dom'
import { Container, Button, Row, Col, Badge } from 'react-bootstrap'
import { useState, useEffect } from 'react'
import MovieCard from '../components/MovieCard'
import { useAuth } from '../contexts/AuthContext'
import { MovieGridSkeleton } from '../components/LoadingSkeleton'
import { VoucherValidator } from '../utils/voucherValidation'
import { movieApi, voucherApi } from '../services/api'
import '../components/HeroBannerV2.css'
import '../components/VoucherCard.css'

export default function HomePage() {
  const { currentUser } = useAuth()
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)

  const [currentSlide, setCurrentSlide] = useState(0)
  
  const [vouchers, setVouchers] = useState([])
  const [vouchersLoading, setVouchersLoading] = useState(true)

  // Load movies
  useEffect(() => {
    const loadMovies = async () => {
      try {
        const res = await movieApi.getAll()
        setMovies(res.data)
      } catch (err) {
        console.error('Lỗi tải phim:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadMovies()
  }, [])

  const hotMovies = movies 
    ? [...movies].sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0)).slice(0, 5) 
    : []

  useEffect(() => {
    if (hotMovies.length === 0) return

    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % hotMovies.length)
    }, 4000) // Chuyển slide mỗi 4 giây

    return () => clearInterval(interval)
  }, [hotMovies.length])

  useEffect(() => {
    const loadVouchers = async () => {
      try {
        const res = await voucherApi.getActive()
        setVouchers(res.data.slice(0, 4)) // Chỉ lấy 4 voucher đầu tiên
      } catch (err) {
        console.error('Lỗi tải voucher:', err)
      } finally {
        setVouchersLoading(false)
      }
    }
    
    loadVouchers()
  }, [])

  const featuredMovies = movies 
    ? [...movies].sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0)).slice(0, 4) 
    : []

  const currentMovie = hotMovies[currentSlide]

  return (
    <div className="home-page">
      
      <section
        className="cinemaXP-cinematic-banner"
        style={{
          backgroundImage: currentMovie?.poster ? `url(${currentMovie.poster})` : 'none',
        }}
      >
        <div className="cinematic-overlay" />
        <Container fluid className="cinematic-content-wrap">
          <div className="cinematic-content">
            <div className="award-section">
              <span className="award-badge">
                <span className="star">★</span>
                <span>PHIM ĐỈNH CAO</span>
                <span className="star">★</span>
              </span>
            </div>

            {currentMovie && (
              <h2 className="movie-title">
                {currentMovie.title.toUpperCase()}
              </h2>
            )}

            <p className="movie-description">
              "{currentMovie?.description || 'Đang cập nhật nội dung phim...'}"
            </p>

            {currentMovie && (
              <div className="movie-meta">
                <span className="meta-item">
                  <span className="icon">⭐</span>
                  <span>{currentMovie.rating} IMDb</span>
                </span>
                <span className="divider">|</span>
                <span className="meta-item">{currentMovie.ageRating || 'T13'}</span>
                <span className="divider">|</span>
                <span className="meta-item">{currentMovie.duration}p</span>
                <span className="divider">|</span>
                <span className="meta-item">{currentMovie.genre}</span>
              </div>
            )}

            <div className="action-buttons">
              <Button as={Link} to="/movies" className="btn-watch-now">
                Xem phim ngay
              </Button>
              {!currentUser && (
                <Button as={Link} to="/register" className="btn-register">
                  Đăng ký miễn phí
                </Button>
              )}
            </div>

            {hotMovies.length > 1 && (
              <div className="navigation-dots">
                {hotMovies.map((_, index) => (
                  <button
                    key={index}
                    className={`nav-dot ${index === currentSlide ? 'active' : ''}`}
                    onClick={() => setCurrentSlide(index)}
                    aria-label={`Phim ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {hotMovies.length > 0 && (
            <div className="cinematic-thumbs">
              {hotMovies.map((movie, index) => (
                <button
                  key={movie.id}
                  className={`cinematic-thumb ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Chọn phim ${movie.title}`}
                >
                  <img src={movie.poster} alt={movie.title} />
                </button>
              ))}
            </div>
          )}
        </Container>
      </section>

      
      <section className="featured-section py-5">
        <Container>
          <div className="section-header d-flex justify-content-between align-items-center mb-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div>
              <h2 className="section-title">🔥 Phim Nổi Bật</h2>
              <p className="text-muted mb-0">Những bộ phim có điểm số cao nhất</p>
            </div>
            <Button
              as={Link}
              to="/movies"
              variant="outline-warning"
              className="btn-primary-custom"
            >
              Xem tất cả →
            </Button>
          </div>
          {loading ? (
            <MovieGridSkeleton count={4} />
          ) : (
            <Row xs={1} sm={2} lg={4} className="g-4">
              {featuredMovies.map((movie, index) => (
                <Col key={movie.id}>
                  <div className="animate-fade-in-up" style={{ animationDelay: `${0.3 + index * 0.1}s` }}>
                    <MovieCard movie={movie} />
                  </div>
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>

      
      <section className="hot-deals-section py-5">
        <Container>
          <div className="text-center mb-4">
            <h2 className="section-title mb-2">🔥 ƯU ĐÃI HOT</h2>
            <p className="text-muted mb-0">Nhận ngay voucher giảm giá hấp dẫn!</p>
          </div>
          {vouchersLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-warning" style={{ width: '2rem', height: '2rem' }}></div>
              <p className="mt-2 text-muted">Đang tải ưu đãi...</p>
            </div>
          ) : (
            <Row xs={1} sm={2} lg={4} className="g-3">
              {vouchers.map((voucher, index) => {
                const remainingUses = voucher.usageLimit - (voucher.usedCount || 0)
                const discountText = voucher.type === 'percentage' 
                  ? `${voucher.value}%` 
                  : `${voucher.value / 1000}K`
                
                return (
                  <Col key={voucher.id}>
                    <div className="voucher-card animate-float" style={{ animationDelay: `${0.1 + index * 0.1}s` }}>
                      <div className="voucher-header">
                        <span className="voucher-discount">{discountText}</span>
                        <span className="voucher-type">OFF</span>
                      </div>
                      <div className="voucher-body">
                        <h6 className="voucher-title">{voucher.title}</h6>
                        <p className="voucher-desc">{voucher.description}</p>
                        <div className="voucher-code">{voucher.code}</div>
                        <div className="voucher-remaining">
                          <Badge bg="success" className="mt-2">
                            🎫 Còn {remainingUses} lượt
                          </Badge>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className="voucher-btn" 
                        onClick={() => navigator.clipboard.writeText(voucher.code)}
                      >
                        📋 Sao chép mã
                      </Button>
                    </div>
                  </Col>
                )
              })}
            </Row>
          )}
          
          {!vouchersLoading && vouchers.length === 0 && (
            <div className="text-center py-4">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😔</div>
              <h5>Hiện tại chưa có ưu đãi nào</h5>
              <p className="text-muted">Vui lòng quay lại sau để xem các ưu đãi mới nhất!</p>
            </div>
          )}
          
          <div className="text-center mt-4">
            <Button
              as={Link}
              to="/offers"
              variant="outline-warning"
              className="btn-primary-custom"
            >
              Xem tất cả ưu đãi →
            </Button>
          </div>
        </Container>
      </section>

      
      <section className="cta-section py-5" style={{
        background: 'linear-gradient(135deg, #1a0533 0%, #0a1628 100%)',
        borderTop: '1px solid rgba(255,255,255,0.05)'
      }}>
        <Container className="text-center">
          <div className="animate-fade-in-up">
            <h2 className="section-title mb-3" style={{ fontSize: '2rem' }}>
              🎬 Sẵn sàng trải nghiệm?
            </h2>
            <p className="text-muted mb-4" style={{ maxWidth: '500px', margin: '0 auto' }}>
              Đặt vé ngay hôm nay và nhận ưu đãi hấp dẫn cho lần đặt đầu tiên
            </p>
            <Button
              as={Link}
              to="/movies"
              size="lg"
              className="btn-hero-primary animate-float"
            >
              Khám phá ngay
            </Button>
          </div>
        </Container>
      </section>
    </div>
  )
}
