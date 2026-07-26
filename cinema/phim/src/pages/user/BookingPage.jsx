import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Container, Card, Button, Alert, Spinner, Row, Col, Badge } from 'react-bootstrap'
import axios from 'axios'
import { useAuth } from '../../contexts/AuthContext'
import SeatMap from '../../components/SeatMap'

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
        const stRes = await axios.get(`http://localhost:8080/api/showtimes/${showtimeId}`)
        const showtimeData = stRes.data

        const showtimeDateTime = new Date(`${showtimeData.date}T${showtimeData.time}`)
        const now = new Date()

        if (showtimeDateTime < now) {
          setError('? Su?t chi?u này dã qua. Không th? d?t vé.')
          setShowtime(showtimeData)
          setLoading(false)
          return
        }

        setShowtime(showtimeData)
        const mvRes = await axios.get(`http://localhost:8080/api/movies/${showtimeData.movieId}`)
        setMovie(mvRes.data)
      } catch {
        setError('Không tìm th?y su?t chi?u.')
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

  const parsedBookedSeats = showtime?.bookedSeatNums 
    ? (typeof showtime.bookedSeatNums === 'string' 
        ? JSON.parse(showtime.bookedSeatNums) 
        : showtime.bookedSeatNums)
    : []
  
  const bookedCount = showtime ? parsedBookedSeats.length : 0
  const available = showtime ? showtime.totalSeats - bookedCount : 0
  const totalPrice = selectedSeats.length * (showtime?.price || 0)

  const handleConfirm = async () => {
    if (selectedSeats.length === 0) {
      setError('Vui lòng ch?n ít nh?t 1 gh?.')
      return
    }

    const showtimeDateTime = new Date(`${showtime.date}T${showtime.time}`)
    const now = new Date()

    if (showtimeDateTime < now) {
      setError('? Su?t chi?u này dã qua. Không th? d?t vé.')
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
          <div style={{ fontSize: 64 }}>?</div>
          <h4 className="fw-bold mt-3 mb-2">Su?t chi?u dã qua</h4>
          <p className="text-muted">Su?t chi?u này dã k?t thúc. Vui lòng ch?n su?t chi?u khác.</p>
          <div className="mt-3">
            <div className="mb-2"><strong>Phim:</strong> {movie?.title || 'N/A'}</div>
            <div className="mb-2"><strong>Ngày gi?:</strong> {showtime?.date} {showtime?.time}</div>
            <div className="mb-2"><strong>Phòng:</strong> {showtime?.room}</div>
          </div>
          <Button className="btn-primary-custom mt-3" onClick={() => navigate('/movies')}>
            ? Ch?n su?t chi?u khác
          </Button>
        </Card>
      </Container>
    </div>
  )

  if (isAdmin) return (
    <div className="page-wrapper d-flex align-items-center min-vh-100">
      <Container style={{ maxWidth: 500 }} className="mx-auto">
        <Card className="booking-info-card text-center p-5">
          <div style={{ fontSize: 64 }}>??</div>
          <h4 className="fw-bold mt-3 mb-2">Tài kho?n admin không th? d?t vé</h4>
          <p className="text-muted">Vui lòng s? d?ng tài kho?n ngu?i dùng thông thu?ng d? d?t vé.</p>
          <Button className="btn-primary-custom mt-3" onClick={() => navigate('/admin')}>? V? trang Admin</Button>
        </Card>
      </Container>
    </div>
  )

  if (success) {
    return (
      <div className="page-wrapper d-flex align-items-center min-vh-100">
        <Container style={{ maxWidth: 500 }} className="mx-auto">
          <Card className="booking-success-card text-center p-5">
            <div style={{ fontSize: 64 }}>??</div>
            <h3 className="fw-bold mt-3 mb-2">Ð?t vé thành công!</h3>
            <p className="text-muted">Chúc b?n xem phim vui v?!</p>
            <div className="booking-confirm-info my-3 p-3 rounded text-start">
              <div><strong>Phim:</strong> {movie?.title}</div>
              <div><strong>Ngày chi?u:</strong> {showtime?.date} lúc {showtime?.time}</div>
              <div><strong>Phòng:</strong> {showtime?.room}</div>
              <div><strong>Gh?:</strong> <span className="text-warning fw-bold">{selectedSeats.join(', ')}</span></div>
              <div><strong>T?ng ti?n:</strong> <span className="text-warning fw-bold">{totalPrice.toLocaleString()}d</span></div>
            </div>
            <div className="d-flex gap-2 justify-content-center mt-3">
              <Button className="btn-primary-custom" onClick={() => navigate('/my-bookings')}>?? Xem vé c?a tôi</Button>
              <Button variant="outline-secondary" onClick={() => navigate('/movies')}>Ð?t vé khác</Button>
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
          <h1 className="fw-bold">??? Ch?n Gh?</h1>
          {movie && <p className="text-muted mb-0">{movie.title} · {showtime?.date} · {showtime?.time} · {showtime?.room}</p>}
        </Container>
      </div>

      <Container className="py-4">
        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

        <Row className="g-4">
          
          <Col lg={8}>
            <Card className="booking-info-card">
              <Card.Body className="p-3 p-md-4">
                <h5 className="fw-bold mb-3">So d? gh? ng?i</h5>
                <p className="text-muted small mb-3">
                  Còn tr?ng: <strong className="text-success">{available} gh?</strong> · T?i da ch?n {available} gh?
                </p>
                <SeatMap
                  totalSeats={showtime?.totalSeats || 0}
                  bookedSeatNums={parsedBookedSeats}
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
                <div className="booking-detail-row"><span>?? Ngày:</span><strong>{showtime?.date}</strong></div>
                <div className="booking-detail-row"><span>? Gi?:</span><strong>{showtime?.time}</strong></div>
                <div className="booking-detail-row"><span>??? Phòng:</span><strong>{showtime?.room}</strong></div>
                <div className="booking-detail-row"><span>?? Giá/gh?:</span><strong className="text-warning">{showtime?.price?.toLocaleString()}d</strong></div>
                <hr />

                
                <div className="mb-3">
                  <div className="text-muted small mb-2">Gh? dã ch?n:</div>
                  {selectedSeats.length === 0 ? (
                    <span className="text-muted fst-italic small">Chua ch?n gh? nào — click vào gh? trên so d?</span>
                  ) : (
                    <div className="d-flex flex-wrap gap-1">
                      {selectedSeats.sort().map(s => (
                        <Badge
                          key={s}
                          bg="danger"
                          style={{ cursor: 'pointer', fontSize: '0.8rem' }}
                          onClick={() => handleToggleSeat(s)}
                          title="Click d? b? ch?n"
                        >
                          {s} ?
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                
                <div className="total-price-box p-3 rounded mb-3">
                  <div className="d-flex justify-content-between small">
                    <span>S? gh? dã ch?n:</span><span>{selectedSeats.length}</span>
                  </div>
                  <hr className="my-2" />
                  <div className="d-flex justify-content-between fw-bold fs-5">
                    <span>T?ng c?ng:</span>
                    <span className="text-warning">{totalPrice.toLocaleString()}d</span>
                  </div>
                </div>

                <Button
                  id="confirm-booking-btn"
                  className="w-100 btn-primary-custom"
                  disabled={submitting || selectedSeats.length === 0}
                  onClick={handleConfirm}
                  size="lg"
                >
                  {submitting ? <Spinner size="sm" /> : `??? Ð?t ${selectedSeats.length} gh?`}
                </Button>

                <div className="text-center mt-2">
                  <small className="text-muted">Click vào gh? dang ch?n (d?) d? b? ch?n</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}
