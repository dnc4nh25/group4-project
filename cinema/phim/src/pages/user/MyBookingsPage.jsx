import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Badge, Spinner, Alert, Button, Modal } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { bookingApi } from '../../services/api'
import './MyBookingsPage.css'


export default function MyBookingsPage() {
  const { currentUser, updateUser } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellingId, setCancellingId] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ show: false, bookingId: null, movieName: '' })
  const [toast, setToast] = useState({ show: false, message: '', type: '' })

  useEffect(() => {
    if (currentUser?.id) {
      fetchBookings(currentUser.id)
    } else {
      setLoading(false)
      setError('Vui lòng đăng nhập lại để xem lịch sử vé.')
    }
  }, [currentUser])

  const fetchBookings = async (userId) => {
    try {
      const res = await bookingApi.getHistory(userId)
      setBookings(res.data)
    } catch (err) {
      console.error('Error fetching bookings:', err)
      setError('Không thể tải lịch sử vé. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3500)
  }

  const openCancelModal = (bookingId, movieName) => {
    setConfirmModal({ show: true, bookingId, movieName })
  }

  const closeCancelModal = () => {
    setConfirmModal({ show: false, bookingId: null, movieName: '' })
  }

  const handleConfirmCancel = async () => {
    const bookingId = confirmModal.bookingId
    closeCancelModal()
    setCancellingId(bookingId)
    try {
      const res = await bookingApi.cancel(bookingId)
      // Cập nhật state local, không cần fetch lại
      setBookings(prev =>
        prev.map(b =>
          b.id === bookingId ? { ...b, status: 'CANCELLED' } : b
        )
      )

      // Cập nhật lại số dư điểm của user sau khi hủy vé
      const targetBooking = bookings.find(b => b.id === bookingId)
      if (targetBooking && updateUser && currentUser) {
        const pointsRefund = (targetBooking.totalPrice || 0) + (targetBooking.pointsUsed || 0) - (targetBooking.pointsEarned || 0)
        updateUser({
          points: (currentUser.points || 0) + pointsRefund
        })
      }

      showToast(res.data || 'Hủy vé thành công! Ghế đã được trả lại.', 'success')
    } catch (err) {
      const msg = err.response?.data || 'Không thể hủy vé. Vui lòng thử lại.'
      showToast(msg, 'error')
    } finally {
      setCancellingId(null)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge className="status-badge status-confirmed">✓ Đã xác nhận</Badge>
      case 'CANCELLED':
        return <Badge className="status-badge status-cancelled">✕ Đã hủy</Badge>
      default:
        return <Badge className="status-badge status-pending">{status}</Badge>
    }
  }

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const [year, month, day] = dateStr.split('-')
    return `${day}/${month}/${year}`
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    return timeStr.substring(0, 5)
  }

  const parseSeats = (seatStr) => {
    try {
      const seats = JSON.parse(seatStr)
      return Array.isArray(seats) ? seats.join(', ') : seatStr
    } catch (e) {
      return seatStr
    }
  }

  // Kiểm tra xem vé có thể hủy không (còn ít nhất 6 giờ trước suất chiếu)
  const canCancelBooking = (booking) => {
    if (booking.status !== 'CONFIRMED') return false

    try {
      // Parse showDate và showTime
      const [year, month, day] = booking.showDate.split('-').map(Number)
      const [hour, minute] = booking.showTime.split(':').map(Number)

      // Tạo datetime của suất chiếu
      const showtimeStart = new Date(year, month - 1, day, hour, minute)

      // Tính thời hạn hủy (6 giờ trước suất chiếu)
      const cancelDeadline = new Date(showtimeStart.getTime() - 6 * 60 * 60 * 1000)

      // So sánh với thời gian hiện tại
      const now = new Date()

      return now <= cancelDeadline
    } catch (e) {
      console.error('Error checking cancel eligibility:', e)
      return false
    }
  }

  if (loading) {
    return (
      <div className="bookings-page min-vh-100 d-flex justify-content-center align-items-center">
        <Spinner animation="border" variant="light" />
      </div>
    )
  }

  return (
    <div className="bookings-page min-vh-100 py-5">
      {/* Toast notification */}
      {toast.show && (
        <div className={`bookings-toast bookings-toast-${toast.type}`}>
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          {toast.message}
        </div>
      )}

      {/* Confirm Cancel Modal */}
      <Modal
        show={confirmModal.show}
        onHide={closeCancelModal}
        centered
        contentClassName="cancel-modal-content"
      >
        <Modal.Header className="cancel-modal-header border-0">
          <Modal.Title className="text-white fw-bold">Xác nhận hủy vé</Modal.Title>
        </Modal.Header>
        <Modal.Body className="cancel-modal-body">
          <div className="cancel-warning-icon mb-3">⚠️</div>
          <p className="text-white mb-1">Bạn có chắc muốn hủy vé xem phim</p>
          <p className="text-warning fw-bold mb-3">"{confirmModal.movieName}"?</p>
          <p className="text-white-50 small">
            Hành động này không thể hoàn tác. Ghế sẽ được trả lại cho suất chiếu.
            <br /><br />
            <strong style={{ color: '#00b0ff' }}>
              💡 Lưu ý: Số tiền bạn đã thanh toán sẽ được quy đổi thành Điểm tích lũy và hoàn trả đầy đủ vào tài khoản của bạn (1đ = 1 điểm). Điểm thưởng từ vé này sẽ bị thu hồi.
            </strong>
          </p>
        </Modal.Body>
        <Modal.Footer className="cancel-modal-footer border-0">
          <Button variant="outline-light" className="btn-modal-cancel" onClick={closeCancelModal}>
            Giữ vé
          </Button>
          <Button variant="danger" className="btn-modal-confirm" onClick={handleConfirmCancel}>
            Xác nhận hủy
          </Button>
        </Modal.Footer>
      </Modal>

      <Container>
        <div className="page-header mb-4">
          <h1 className="fw-bold text-white mb-2">Vé của tôi</h1>
          <p className="text-white-50">Quản lý lịch sử đặt vé xem phim của bạn</p>
        </div>

        {/* Thông báo chính sách hủy vé */}
        <Alert className="border-0 mb-4" style={{ 
          backgroundColor: 'rgba(23, 162, 184, 0.15)', 
          borderLeft: '4px solid #17a2b8' 
        }}>
          <div className="d-flex align-items-start">
            <span className="me-3" style={{ fontSize: '1.5rem' }}>ℹ️</span>
            <div>
              <h6 className="fw-bold mb-2" style={{ color: '#17a2b8' }}>Chính sách hủy vé</h6>
              <p className="mb-0" style={{ fontSize: '0.95rem', color: '#e0e0e0' }}>
                Bạn chỉ có thể hủy vé trước <strong style={{ color: '#ffc107' }}> 6 giờ</strong> so với giờ chiếu phim. 
                Ví dụ: Phim chiếu lúc <strong style={{ color: '#ffc107' }}>15:00</strong>, bạn phải hủy vé trước <strong style={{ color: '#ffc107' }}>09:00</strong> cùng ngày.
              </p>
            </div>
          </div>
        </Alert>

        {error && (
          <Alert variant="danger" className="border-0 bg-danger bg-opacity-25 text-white">
            {error}
          </Alert>
        )}

        {!error && bookings.length === 0 ? (
          <div className="empty-state text-center py-5">
            <div className="empty-icon mb-4">🎟️</div>
            <h3 className="text-white mb-3">Bạn chưa có vé nào</h3>
            <p className="text-white-50 mb-4">Hãy đặt vé ngay để thưởng thức những bộ phim hấp dẫn nhất!</p>
            <Link to="/" className="btn btn-primary-custom px-4 py-2">
              Xem lịch chiếu ngay
            </Link>
          </div>
        ) : (
          <Row className="g-4">
            {bookings.map((booking) => (
              <Col xs={12} lg={8} xl={7} key={booking.id}>
                <Card className={`booking-card h-100 bg-transparent border-0 ${booking.status === 'CANCELLED' ? 'booking-cancelled' : ''}`}>
                  <div className="d-flex flex-column flex-sm-row h-100 booking-card-inner">
                    {/* Poster Section */}
                    <div className="booking-poster-wrapper">
                      <img
                        src={booking.moviePoster || 'https://via.placeholder.com/200x300'}
                        alt={booking.movieName}
                        className="booking-poster"
                      />
                      <div className="booking-status-overlay">
                        {getStatusBadge(booking.status)}
                      </div>
                    </div>

                    {/* Details Section */}
                    <Card.Body className="d-flex flex-column justify-content-between p-4">
                      <div>
                        <h4 className="movie-title text-white fw-bold mb-3">{booking.movieName}</h4>

                        <div className="info-row mb-2">
                          <span className="info-icon">📍</span>
                          <span className="info-text text-white-50">{booking.theaterName} — {booking.roomName}</span>
                        </div>

                        <div className="info-row mb-2">
                          <span className="info-icon">🕒</span>
                          <span className="info-text text-white-50">
                            <span className="text-white fw-medium">{formatTime(booking.showTime)}</span>
                            {' '}•{' '}
                            {formatDate(booking.showDate)}
                          </span>
                        </div>

                        <div className="info-row mb-3">
                          <span className="info-icon">💺</span>
                          <span className="info-text">
                            Ghế: <span className="text-white fw-bold">{parseSeats(booking.seatNums)}</span>
                          </span>
                        </div>
                      </div>

                      <div className="booking-footer pt-3 mt-2">
                        <div className="d-flex justify-content-between align-items-end">
                          <div>
                            <small className="text-white-50 d-block mb-1">Mã vé</small>
                            <span className="font-monospace text-white-50">#{booking.id}</span>
                          </div>
                          <div className="text-end">
                            <small className="text-white-50 d-block mb-1">Tổng tiền</small>
                            <h5 className={`mb-0 fw-bold ${booking.status === 'CANCELLED' ? 'text-white-50 text-decoration-line-through' : 'text-success'}`}>
                              {formatCurrency(booking.totalPrice)}
                            </h5>
                          </div>
                        </div>

                        {/* Thông tin Điểm */}
                        {(booking.pointsUsed > 0 || booking.pointsEarned > 0) && (
                          <div className="d-flex justify-content-between mt-2 pt-2 border-top border-secondary border-opacity-25" style={{ fontSize: '0.85rem' }}>
                            {booking.pointsUsed > 0 ? (
                              <span className="text-warning">⭐ Đã dùng: {booking.pointsUsed.toLocaleString()}đ</span>
                            ) : <span></span>}
                            {booking.pointsEarned > 0 && booking.status !== 'CANCELLED' && (
                              <span style={{ color: '#00b0ff' }}>🎁 Nhận: +{booking.pointsEarned.toLocaleString()} điểm</span>
                            )}
                          </div>
                        )}

                        {/* Cancel Button — chỉ hiện khi vé còn CONFIRMED và đủ thời gian */}
                        {canCancelBooking(booking) && (
                          <div className="mt-3">
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="btn-cancel-booking w-100"
                              disabled={cancellingId === booking.id}
                              onClick={() => openCancelModal(booking.id, booking.movieName)}
                            >
                              {cancellingId === booking.id ? (
                                <><Spinner animation="border" size="sm" className="me-2" />Đang hủy...</>
                              ) : (
                                '🗑 Hủy vé'
                              )}
                            </Button>
                          </div>
                        )}
                        
                        {/* Thông báo khi không thể hủy vé */}
                        {booking.status === 'CONFIRMED' && !canCancelBooking(booking) && (
                          <div className="mt-3">
                            <div className="py-2 px-3" style={{ 
                              fontSize: '0.85rem',
                              backgroundColor: 'rgba(255, 193, 7, 0.15)',
                              borderRadius: '6px',
                              borderLeft: '3px solid #ffc107'
                            }}>
                              <span className="me-2">⏰</span>
                              <small style={{ color: '#ffd966' }}>Không thể hủy vé (đã quá thời hạn 6 giờ trước suất chiếu)</small>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card.Body>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  )
}