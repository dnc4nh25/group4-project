import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Container, Card, Button, Alert, Spinner, Row, Col, Badge } from 'react-bootstrap'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import SeatMap from '../components/SeatMap'

export default function BookingPage() {
  const { showtimeId } = useParams()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const isAdmin = currentUser?.role === 'admin'

  const [showtime, setShowtime] = useState(null)
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [selectedSeats, setSelectedSeats] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const stRes = await axios.get(`http://localhost:3001/showtimes/${showtimeId}`)
        const showtimeData = stRes.data

        const showtimeDateTime = new Date(`${showtimeData.date}T${showtimeData.time}`)
        const now = new Date()

        if (showtimeDateTime < now) {
          setError('❌ Suất chiếu này đã qua. Không thể đặt vé.')
          setShowtime(showtimeData)
          setLoading(false)
          return
        }

        setShowtime(showtimeData)
        const mvRes = await axios.get(`http://localhost:3001/movies/${showtimeData.movieId}`)
        setMovie(mvRes.data)
      } catch {
        setError('Không tìm thấy suất chiếu.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [showtimeId])

  const handleToggleSeat = (seatId) => {
    setSelectedSeats(prev =>
      prev.includes(seatId) ? prev.filter(s => s !== seatId) : [...prev, seatId]
    )
  }

  const bookedCount = showtime ? (showtime.bookedSeatNums?.length ?? showtime.bookedSeats) : 0
  const available = showtime ? showtime.totalSeats - bookedCount : 0
  const totalPrice = selectedSeats.length * (showtime?.price || 0)

  const handleConfirm = async () => {
    if (selectedSeats.length === 0) {
      setError('Vui lòng chọn ít nhất 1 ghế.')
      return
    }

    const showtimeDateTime = new Date(`${showtime.date}T${showtime.time}`)
    const now = new Date()

    if (showtimeDateTime < now) {
      setError('❌ Suất chiếu này đã qua. Không thể đặt vé.')
      return
    }

    navigate('/payment', {
      state: {
        showtimeId,
        selectedSeats,
        subtotal: totalPrice,
        seatCount: selectedSeats.length,
        showtime,
        movie
      }
    })
  }

  if (loading) return (
    <div className="text-center py-5 mt-5">
      <Spinner variant="warning" style={{ width: 60, height: 60 }} />
    </div>
  )

  if (error && !showtime) return <Alert variant="danger" className="m-4">{error}</Alert>

  const isShowtimePassed = showtime && new Date(`${showtime.date}T${showtime.time}`) < new Date()

  if (isShowtimePassed) return (
    <div className="page-wrapper d-flex align-items-center min-vh-100">
      <Container style={{ maxWidth: 500 }} className="mx-auto">
        <Card className="booking-info-card text-center p-5">
          <div style={{ fontSize: 64 }}>⏰</div>
          <h4 className="fw-bold mt-3 mb-2">Suất chiếu đã qua</h4>
          <p className="text-muted">Suất chiếu này đã kết thúc. Vui lòng chọn suất chiếu khác.</p>
          <div className="mt-3">
            <div className="mb-2"><strong>Phim:</strong> {movie?.title || 'N/A'}</div>
            <div className="mb-2"><strong>Ngày giờ:</strong> {showtime?.date} {showtime?.time}</div>
            <div className="mb-2"><strong>Phòng:</strong> {showtime?.room}</div>
          </div>
          <Button className="btn-primary-custom mt-3" onClick={() => navigate('/movies')}>
            ← Chọn suất chiếu khác
          </Button>
        </Card>
      </Container>
    </div>
  )

  if (isAdmin) return (
    <div className="page-wrapper d-flex align-items-center min-vh-100">
      <Container style={{ maxWidth: 500 }} className="mx-auto">
        <Card className="booking-info-card text-center p-5">
          <div style={{ fontSize: 64 }}>🚫</div>
          <h4 className="fw-bold mt-3 mb-2">Tài khoản admin không thể đặt vé</h4>
          <p className="text-muted">Vui lòng sử dụng tài khoản người dùng thông thường để đặt vé.</p>
          <Button className="btn-primary-custom mt-3" onClick={() => navigate('/admin')}>← Về trang Admin</Button>
        </Card>
      </Container>
    </div>
  )

  if (success) {
    return (
      <div className="page-wrapper d-flex align-items-center min-vh-100">
        <Container style={{ maxWidth: 500 }} className="mx-auto">
          <Card className="booking-success-card text-center p-5">
            <div style={{ fontSize: 64 }}>🎉</div>
            <h3 className="fw-bold mt-3 mb-2">Đặt vé thành công!</h3>
            <p className="text-muted">Chúc bạn xem phim vui vẻ!</p>
            <div className="booking-confirm-info my-3 p-3 rounded text-start">
              <div><strong>Phim:</strong> {movie?.title}</div>
              <div><strong>Ngày chiếu:</strong> {showtime?.date} lúc {showtime?.time}</div>
              <div><strong>Phòng:</strong> {showtime?.room}</div>
              <div><strong>Ghế:</strong> <span className="text-warning fw-bold">{selectedSeats.join(', ')}</span></div>
              <div><strong>Tổng tiền:</strong> <span className="text-warning fw-bold">{totalPrice.toLocaleString()}đ</span></div>
            </div>
            <div className="d-flex gap-2 justify-content-center mt-3">
              <Button className="btn-primary-custom" onClick={() => navigate('/my-bookings')}>🎫 Xem vé của tôi</Button>
              <Button variant="outline-secondary" onClick={() => navigate('/movies')}>Đặt vé khác</Button>
            </div>
          </Card>
        </Container>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <div className="page-header-banner py-4 text-center">
        <Container>
          <h1 className="fw-bold">🎟️ Chọn Ghế</h1>
          {movie && <p className="text-muted mb-0">{movie.title} · {showtime?.date} · {showtime?.time} · {showtime?.room}</p>}
        </Container>
      </div>

      <Container className="py-4">
        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

        <Row className="g-4">
          
          <Col lg={8}>
            <Card className="booking-info-card">
              <Card.Body className="p-3 p-md-4">
                <h5 className="fw-bold mb-3">Sơ đồ ghế ngồi</h5>
                <p className="text-muted small mb-3">
                  Còn trống: <strong className="text-success">{available} ghế</strong> · Tối đa chọn {available} ghế
                </p>
                <SeatMap
                  totalSeats={showtime?.totalSeats || 0}
                  bookedSeatNums={showtime?.bookedSeatNums || []}
                  selectedSeats={selectedSeats}
                  onToggleSeat={handleToggleSeat}
                  maxSelect={available}
                />
              </Card.Body>
            </Card>
          </Col>

          
          <Col lg={4}>
            <Card className="booking-form-card sticky-top" style={{ top: 90 }}>
              <Card.Body className="p-3 p-md-4">
                
                {movie && (
                  <div className="d-flex gap-3 mb-3">
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      style={{ width: 55, borderRadius: 8, objectFit: 'cover' }}
                      onError={e => e.target.src = 'https://via.placeholder.com/55x80?text=?'}
                    />
                    <div>
                      <h6 className="fw-bold mb-1" style={{ fontSize: '0.9rem' }}>{movie.title}</h6>
                      <div className="text-muted small">{movie.genre} · {movie.duration} phút</div>
                    </div>
                  </div>
                )}
                <hr />
                <div className="booking-detail-row"><span>📅 Ngày:</span><strong>{showtime?.date}</strong></div>
                <div className="booking-detail-row"><span>⏰ Giờ:</span><strong>{showtime?.time}</strong></div>
                <div className="booking-detail-row"><span>🏟️ Phòng:</span><strong>{showtime?.room}</strong></div>
                <div className="booking-detail-row"><span>💰 Giá/ghế:</span><strong className="text-warning">{showtime?.price?.toLocaleString()}đ</strong></div>
                <hr />

                
                <div className="mb-3">
                  <div className="text-muted small mb-2">Ghế đã chọn:</div>
                  {selectedSeats.length === 0 ? (
                    <span className="text-muted fst-italic small">Chưa chọn ghế nào — click vào ghế trên sơ đồ</span>
                  ) : (
                    <div className="d-flex flex-wrap gap-1">
                      {selectedSeats.sort().map(s => (
                        <Badge
                          key={s}
                          bg="danger"
                          style={{ cursor: 'pointer', fontSize: '0.8rem' }}
                          onClick={() => handleToggleSeat(s)}
                          title="Click để bỏ chọn"
                        >
                          {s} ✕
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                
                <div className="total-price-box p-3 rounded mb-3">
                  <div className="d-flex justify-content-between small">
                    <span>Số ghế đã chọn:</span><span>{selectedSeats.length}</span>
                  </div>
                  <hr className="my-2" />
                  <div className="d-flex justify-content-between fw-bold fs-5">
                    <span>Tổng cộng:</span>
                    <span className="text-warning">{totalPrice.toLocaleString()}đ</span>
                  </div>
                </div>

                <Button
                  id="confirm-booking-btn"
                  className="w-100 btn-primary-custom"
                  disabled={submitting || selectedSeats.length === 0}
                  onClick={handleConfirm}
                  size="lg"
                >
                  {submitting ? <Spinner size="sm" /> : `🎟️ Đặt ${selectedSeats.length} ghế`}
                </Button>

                <div className="text-center mt-2">
                  <small className="text-muted">Click vào ghế đang chọn (đỏ) để bỏ chọn</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}
