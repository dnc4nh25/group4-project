import { useState, useEffect } from 'react'
import { Container, Badge, Button, Alert, Spinner, Modal, Card } from 'react-bootstrap'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import './MyBookingsPage.css'

export default function MyBookingsPage() {
  const { currentUser } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState('upcoming')

  const loadBookings = async () => {
    setLoading(true)
    try {
      const res = await axios.get('http://localhost:3001/bookings')
      const allBookings = res.data
      const myBookings = allBookings.filter(
        b => String(b.userId) === String(currentUser.id)
      )

      const indexMap = new Map(allBookings.map((b, i) => [b.id, i]))

      const enriched = await Promise.all(myBookings.map(async (b) => {
        try {
          const stRes = await axios.get(`http://localhost:3001/showtimes/${b.showtimeId}`)
          const mvRes = await axios.get(`http://localhost:3001/movies/${stRes.data.movieId}`)
          return { ...b, showtime: stRes.data, movie: mvRes.data }
        } catch {
          return { ...b, showtime: null, movie: null }
        }
      }))

      setBookings(
        enriched.sort((a, b) => {
          const dateDiff = new Date(b.createdAt) - new Date(a.createdAt)
          if (dateDiff !== 0) return dateDiff
          return (indexMap.get(b.id) ?? 0) - (indexMap.get(a.id) ?? 0)
        })
      )
    } catch {
      setError('Không thể tải dữ liệu.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadBookings() }, [currentUser.id])

  const handleCancelClick = (id) => { setDeletingId(id); setShowConfirm(true) }

  const handleConfirmCancel = async () => {
    setDeleting(true)
    try {
      const booking = bookings.find(b => b.id === deletingId)

      await axios.put(`http://localhost:3001/bookings/${deletingId}`, {
        ...booking,
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      })

      if (booking?.showtimeId) {
        const seatNumsToRestore = booking.seatNums || []
        
        const showtimeRes = await axios.get(`http://localhost:3001/showtimes/${booking.showtimeId}`)
        const currentShowtime = showtimeRes.data
        
        const currentBooked = currentShowtime.bookedSeatNums || []
        const newBookedSeatNums = currentBooked.filter(s => !seatNumsToRestore.includes(s))
        
        await axios.patch(`http://localhost:3001/showtimes/${booking.showtimeId}`, {
          bookedSeats: newBookedSeatNums.length,
          bookedSeatNums: newBookedSeatNums
        })
      }

      setShowConfirm(false)
      setDeletingId(null)
      loadBookings()
    } catch (err) {
      console.error('Cancel booking error:', err)
      setError('Hủy vé thất bại. Vui lòng thử lại.')
    } finally {
      setDeleting(false)
    }
  }

  const isShowtimePast = (showtime) => {
    if (!showtime) return false
    return new Date(`${showtime.date}T${showtime.time}:00`) < new Date()
  }

  const upcomingBookings = bookings.filter(b => b.status !== 'cancelled' && !isShowtimePast(b.showtime))
  const pastBookings = bookings.filter(b => b.status === 'cancelled' || isShowtimePast(b.showtime))

  const activeBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  return (
    <div className="my-bookings-page">
    
      

      
      <Container className="py-4">
        {error && (
          <Alert variant="danger" onClose={() => setError('')} dismissible className="custom-alert">
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner">
              <Spinner animation="border" role="status" />
            </div>
            <p className="loading-text">Đang tải vé của bạn...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎭</div>
            <h3 className="empty-title">Bạn chưa đặt vé nào</h3>
            <p className="empty-text">Hãy bắt đầu đặt vé phim đầu tiên của bạn!</p>
            <Button as={Link} to="/movies" className="btn-explore">
              🎬 Khám phá phim
            </Button>
          </div>
        ) : (
          <>
            <div className="bookings-tabs-container mb-4">
              <div className="bookings-tabs">
                <button 
                  className={`booking-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
                  onClick={() => setActiveTab('upcoming')}
                >
                  Vé sắp chiếu 
                  <span className="tab-badge">{upcomingBookings.length}</span>
                </button>
                <button 
                  className={`booking-tab ${activeTab === 'past' ? 'active' : ''}`}
                  onClick={() => setActiveTab('past')}
                >
                  Lịch sử vé
                  <span className="tab-badge text-muted">{pastBookings.length}</span>
                </button>
              </div>
            </div>

            {activeBookings.length === 0 ? (
              <div className="text-center py-5 text-muted">
                {activeTab === 'upcoming' ? 'Bạn không có vé nào sắp chiếu.' : 'Chưa có lịch sử vé.'}
              </div>
            ) : (
              <div className="bookings-grid">
                {activeBookings.map((b, i) => {
                const isPast = isShowtimePast(b.showtime)
                return (
                  <div key={b.id} className="booking-card" style={{ animationDelay: `${i * 0.1}s` }}>
                    
                    <div className="booking-card-header">
                      {b.movie?.poster && (
                        <div className="movie-poster-container">
                          <img
                            src={b.movie.poster}
                            alt={b.movie.title}
                            className="movie-poster-thumb"
                            onError={(e) => { e.target.style.display = 'none' }}
                          />
                        </div>
                      )}
                      <div className="movie-info">
                        <h3 className="movie-name">{b.movie?.title || 'Phim không rõ'}</h3>
                        <span className="movie-genre">{b.movie?.genre}</span>
                      </div>
                    </div>

                    
                    <div className="booking-card-body">
                      <div className="booking-detail-row">
                        <span className="detail-label">📅 Ngày giờ</span>
                        <span className="detail-value">{b.showtime?.date} | {b.showtime?.time}</span>
                      </div>
                      <div className="booking-detail-row">
                        <span className="detail-label">🎪 Phòng chiếu</span>
                        <span className="detail-value room-tag">{b.showtime?.room || 'N/A'}</span>
                      </div>
                      <div className="booking-detail-row">
                        <span className="detail-label">💺 Ghế</span>
                        <div className="seats-list">
                          {b.seatNums && b.seatNums.length > 0 ? (
                            b.seatNums.sort().map(s => (
                              <span key={s} className="seat-tag">{s}</span>
                            ))
                          ) : (
                            <span className="detail-value">{b.seats} ghế</span>
                          )}
                        </div>
                      </div>
                      <div className="booking-detail-row">
                        <span className="detail-label">📆 Ngày đặt</span>
                        <span className="detail-value booking-date">{b.createdAt}</span>
                      </div>
                    </div>

                    
                    <div className="booking-card-footer">
                      <div className="price-section">
                        <span className="price-label">Tổng cộng</span>
                        <span className="price-value">{b.totalPrice?.toLocaleString()}đ</span>
                      </div>
                      <div className="action-section">
                        {b.status === 'cancelled' ? (
                          <span className="status-badge status-cancelled">
                            ❌ Đã hủy
                          </span>
                        ) : (
                          <>
                            <span className={`status-badge ${isPast ? 'status-past' : 'status-confirmed'}`}>
                              {isPast ? '🎬 Đã chiếu' : '✓ Xác nhận'}
                            </span>
                            {!isPast && (
                              <Button
                                className="btn-cancel"
                                onClick={() => handleCancelClick(b.id)}
                              >
                                Hủy vé
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </Container>

      
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered className="dark-modal-custom">
        <div className="modal-custom-content">
          <div className="modal-custom-header">
            <div className="modal-icon">⚠️</div>
            <Modal.Title>Xác nhận hủy vé</Modal.Title>
          </div>
          <Modal.Body>
            <p>Bạn có chắc chắn muốn hủy vé này không?</p>
            <p className="modal-warning">Các ghế sẽ được giải phóng và thao tác này không thể hoàn tác.</p>
          </Modal.Body>
          <div className="modal-custom-footer">
            <Button variant="secondary" className="btn-modal-secondary" onClick={() => setShowConfirm(false)}>
              Giữ lại
            </Button>
            <Button variant="danger" className="btn-modal-danger" onClick={handleConfirmCancel} disabled={deleting}>
              {deleting ? <><Spinner size="sm" animation="border" /> Đang hủy...</> : '🗑️ Hủy vé'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}