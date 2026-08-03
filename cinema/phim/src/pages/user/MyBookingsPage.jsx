import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Badge, Spinner, Alert, Button, Modal, Tab, Nav } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { bookingApi, foodOrderApi } from '../../services/api'
import './MyBookingsPage.css'

const FOOD_STATUS_MAP = {
  PENDING: { label: 'Đã đặt hàng', cls: 'status-confirmed', icon: '✅' },
  PREPARING: { label: 'Đang chuẩn bị', cls: 'status-pending', icon: '👨‍🍳' },
  READY: { label: 'Sẵn sàng lấy', cls: 'status-confirmed', icon: '✅' },
  COMPLETED: { label: 'Đã lấy', cls: 'status-confirmed', icon: '🎉' },
  CANCELLED: { label: 'Đã hủy', cls: 'status-cancelled', icon: '✕' },
}

export default function MyBookingsPage() {
  const { currentUser, updateUser } = useAuth()
  const [bookings, setBookings] = useState([])
  const [foodOrders, setFoodOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('tickets')
  const [cancellingId, setCancellingId] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ show: false, bookingId: null, movieName: '' })
  const [toast, setToast] = useState({ show: false, message: '', type: '' })
  const [qrModal, setQrModal] = useState({ show: false, code: '', title: '', hint: '' })
  const [cancelFoodModal, setCancelFoodModal] = useState({ show: false, orderId: null })

  useEffect(() => {
    if (currentUser?.id) {
      fetchAll(currentUser.id)
    } else {
      setLoading(false)
      setError('Vui lòng đăng nhập lại để xem lịch sử.')
    }
  }, [currentUser])

  const fetchAll = async (userId) => {
    try {
      const [ticketRes, foodRes] = await Promise.all([
        bookingApi.getHistory(userId),
        foodOrderApi.getByUser(userId),
      ])
      setBookings(ticketRes.data)
      setFoodOrders(foodRes.data)
    } catch (err) {
      console.error('Error fetching bookings:', err)
      setError('Không thể tải lịch sử. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3500)
  }

  // ─── Ticket cancel ─────────────────────────────────
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
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'CANCELLED' } : b))
      const targetBooking = bookings.find(b => b.id === bookingId)
      if (targetBooking && updateUser && currentUser) {
        const pointsRefund = (targetBooking.totalPrice || 0) + (targetBooking.pointsUsed || 0) - (targetBooking.pointsEarned || 0)
        updateUser({ points: (currentUser.points || 0) + pointsRefund })
      }
      showToast(res.data || 'Hủy vé thành công!', 'success')
    } catch (err) {
      const msg = err.response?.data || 'Không thể hủy vé. Vui lòng thử lại.'
      showToast(msg, 'error')
    } finally {
      setCancellingId(null)
    }
  }

  // ─── Food cancel ────────────────────────────────────
  const handleCancelFoodOrder = async () => {
    const orderId = cancelFoodModal.orderId
    setCancelFoodModal({ show: false, orderId: null })
    try {
      await foodOrderApi.cancel(orderId)
      setFoodOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o))
      showToast('Đã hủy đơn hàng thành công.', 'success')
    } catch (err) {
      const msg = err.response?.data || 'Không thể hủy đơn. Vui lòng thử lại.'
      showToast(typeof msg === 'string' ? msg : 'Lỗi hủy đơn', 'error')
    }
  }

  // ─── QR Modal ────────────────────────────────────────
  const openQrModal = (code, title, hint) => {
    setQrModal({ show: true, code, title, hint })
  }

  // ─── Helpers ─────────────────────────────────────────
  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED': return <Badge className="status-badge status-confirmed">✓ Đã xác nhận</Badge>
      case 'CANCELLED': return <Badge className="status-badge status-cancelled">✕ Đã hủy</Badge>
      case 'CHECKED_IN': return <Badge className="status-badge" style={{ background: '#10b981', color: '#fff' }}>🎬 Đã vào rạp</Badge>
      default: return <Badge className="status-badge status-pending">{status}</Badge>
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
    } catch (e) { return seatStr }
  }

  const canCancelBooking = (booking) => {
    if (booking.status !== 'CONFIRMED') return false
    try {
      const [year, month, day] = booking.showDate.split('-').map(Number)
      const [hour, minute] = booking.showTime.split(':').map(Number)
      const showtimeStart = new Date(year, month - 1, day, hour, minute)
      const cancelDeadline = new Date(showtimeStart.getTime() - 6 * 60 * 60 * 1000)
      return new Date() <= cancelDeadline
    } catch (e) { return false }
  }

  const getCancelFoodStatus = (order) => {
    if (order.status !== 'PENDING') return { canCancel: false }
    return { canCancel: true }
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
      {/* Toast */}
      {toast.show && (
        <div className={`bookings-toast bookings-toast-${toast.type}`}>
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          {toast.message}
        </div>
      )}

      {/* ─── QR Modal ─────────────────────────────────── */}
      <Modal show={qrModal.show} onHide={() => setQrModal(q => ({ ...q, show: false }))} centered contentClassName="cancel-modal-content">
        <Modal.Header className="cancel-modal-header border-0">
          <Modal.Title className="text-white fw-bold">{qrModal.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="cancel-modal-body text-center">
          {qrModal.code && (
            <>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrModal.code)}`}
                alt={qrModal.code}
                style={{ width: 220, height: 220, borderRadius: 12, border: '3px solid #f5a623', margin: '8px auto 16px' }}
              />
              <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: 2, color: '#f5a623', marginBottom: 8 }}>
                {qrModal.code}
              </div>
              <p style={{ fontSize: '0.85rem', color: '#a8a8b8' }}>{qrModal.hint}</p>
              <p style={{ fontSize: '0.78rem', color: '#666' }}>📲 Chụp màn hình để lưu mã QR</p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="cancel-modal-footer border-0">
          <Button variant="outline-light" onClick={() => setQrModal(q => ({ ...q, show: false }))}>Đóng</Button>
        </Modal.Footer>
      </Modal>

      {/* ─── Cancel Ticket Modal ────────────────────────── */}
      <Modal show={confirmModal.show} onHide={closeCancelModal} centered contentClassName="cancel-modal-content">
        <Modal.Header className="cancel-modal-header border-0">
          <Modal.Title className="text-white fw-bold">Xác nhận hủy vé</Modal.Title>
        </Modal.Header>
        <Modal.Body className="cancel-modal-body">
          <div className="cancel-warning-icon mb-3">⚠️</div>
          <p className="text-white mb-1">Bạn có chắc muốn hủy vé xem phim</p>
          <p className="text-warning fw-bold mb-3">"{confirmModal.movieName}"?</p>
          <p className="text-white-50 small">
            Hành động này không thể hoàn tác.<br /><br />
            <strong style={{ color: '#00b0ff' }}>
              💡 Số tiền sẽ được quy đổi thành Điểm tích lũy và hoàn trả vào tài khoản.
            </strong>
          </p>
        </Modal.Body>
        <Modal.Footer className="cancel-modal-footer border-0">
          <Button variant="outline-light" className="btn-modal-cancel" onClick={closeCancelModal}>Giữ vé</Button>
          <Button variant="danger" className="btn-modal-confirm" onClick={handleConfirmCancel}>Xác nhận hủy</Button>
        </Modal.Footer>
      </Modal>

      {/* ─── Cancel Food Modal ──────────────────────────── */}
      <Modal show={cancelFoodModal.show} onHide={() => setCancelFoodModal({ show: false, orderId: null })} centered contentClassName="cancel-modal-content">
        <Modal.Header className="cancel-modal-header border-0">
          <Modal.Title className="text-white fw-bold">Hủy đơn đồ ăn?</Modal.Title>
        </Modal.Header>
        <Modal.Body className="cancel-modal-body">
          <div className="cancel-warning-icon mb-3">🍿</div>
          <p className="text-white">Bạn có chắc muốn hủy đơn hàng này không?</p>
          <p className="text-white-50 small">Hàng sẽ được hoàn lại kho sau khi hủy.</p>
        </Modal.Body>
        <Modal.Footer className="cancel-modal-footer border-0">
          <Button variant="outline-light" onClick={() => setCancelFoodModal({ show: false, orderId: null })}>Giữ đơn</Button>
          <Button variant="danger" onClick={handleCancelFoodOrder}>Xác nhận hủy</Button>
        </Modal.Footer>
      </Modal>

      <Container>
        <div className="page-header mb-4">
          <h1 className="fw-bold text-white mb-2">Lịch sử của tôi</h1>
          <p className="text-white-50">Quản lý vé phim và đơn đồ ăn</p>
        </div>

        {error && (
          <Alert variant="danger" className="border-0 bg-danger bg-opacity-25 text-white">{error}</Alert>
        )}

        {/* ─── TABS ──────────────────────────────────────── */}
        <Nav variant="tabs" className="mb-4" activeKey={activeTab} onSelect={setActiveTab}
          style={{ borderBottom: '1px solid #2a2a4a' }}>
          <Nav.Item>
            <Nav.Link eventKey="tickets" style={{
              color: activeTab === 'tickets' ? '#f5a623' : '#a8a8b8',
              borderColor: activeTab === 'tickets' ? '#f5a623 #f5a623 #0d0d0d' : 'transparent',
              fontWeight: 600, background: 'transparent'
            }}>
              🎫 Vé phim {bookings.length > 0 && <span className="ms-1 badge bg-secondary">{bookings.length}</span>}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="food" style={{
              color: activeTab === 'food' ? '#f5a623' : '#a8a8b8',
              borderColor: activeTab === 'food' ? '#f5a623 #f5a623 #0d0d0d' : 'transparent',
              fontWeight: 600, background: 'transparent'
            }}>
              🍿 Đơn đồ ăn {foodOrders.length > 0 && <span className="ms-1 badge bg-secondary">{foodOrders.length}</span>}
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {/* ─── TICKETS TAB ─────────────────────────────── */}
        {activeTab === 'tickets' && (
          <>
            <Alert className="border-0 mb-4" style={{ backgroundColor: 'rgba(23,162,184,0.15)', borderLeft: '4px solid #17a2b8' }}>
              <div className="d-flex align-items-start">
                <span className="me-3" style={{ fontSize: '1.5rem' }}>ℹ️</span>
                <div>
                  <h6 className="fw-bold mb-2" style={{ color: '#17a2b8' }}>Chính sách hủy vé</h6>
                  <p className="mb-0" style={{ fontSize: '0.95rem', color: '#e0e0e0' }}>
                    Chỉ được hủy trước <strong style={{ color: '#ffc107' }}>6 giờ</strong> so với giờ chiếu phim.
                  </p>
                </div>
              </div>
            </Alert>

            {bookings.length === 0 ? (
              <div className="empty-state text-center py-5">
                <div className="empty-icon mb-4">🎟️</div>
                <h3 className="text-white mb-3">Bạn chưa có vé nào</h3>
                <p className="text-white-50 mb-4">Hãy đặt vé để thưởng thức những bộ phim hấp dẫn!</p>
                <Link to="/" className="btn btn-primary-custom px-4 py-2">Xem lịch chiếu ngay</Link>
              </div>
            ) : (
              <Row className="g-4">
                {bookings.map((booking) => (
                  <Col xs={12} lg={8} xl={7} key={booking.id}>
                    <Card className={`booking-card h-100 bg-transparent border-0 ${booking.status === 'CANCELLED' ? 'booking-cancelled' : ''}`}>
                      <div className="d-flex flex-column flex-sm-row h-100 booking-card-inner">
                        <div className="booking-poster-wrapper">
                          <img
                            src={booking.moviePoster || 'https://via.placeholder.com/200x300'}
                            alt={booking.movieName}
                            className="booking-poster"
                          />
                          <div className="booking-status-overlay">{getStatusBadge(booking.status)}</div>
                        </div>

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
                                {' '}•{' '}{formatDate(booking.showDate)}
                              </span>
                            </div>
                            <div className="info-row mb-3">
                              <span className="info-icon">💺</span>
                              <span className="info-text">Ghế: <span className="text-white fw-bold">{parseSeats(booking.seatNums)}</span></span>
                            </div>
                          </div>

                          <div className="booking-footer pt-3 mt-2">
                            <div className="d-flex justify-content-between align-items-end mb-2">
                              <div>
                                <small className="text-white-50 d-block mb-1">Mã vé</small>
                                <span className="font-monospace fw-bold" style={{ color: '#f5a623', fontSize: '0.85rem' }}>
                                  {booking.bookingCode || `#${booking.id}`}
                                </span>
                              </div>
                              <div className="text-end">
                                <small className="text-white-50 d-block mb-1">Tổng tiền</small>
                                <h5 className={`mb-0 fw-bold ${booking.status === 'CANCELLED' ? 'text-white-50 text-decoration-line-through' : 'text-success'}`}>
                                  {formatCurrency(booking.totalPrice)}
                                </h5>
                              </div>
                            </div>

                            {(booking.pointsUsed > 0 || booking.pointsEarned > 0) && (
                              <div className="d-flex justify-content-between mt-2 pt-2 border-top border-secondary border-opacity-25" style={{ fontSize: '0.85rem' }}>
                                {booking.pointsUsed > 0 ? (
                                  <span className="text-warning">⭐ Đã dùng: {booking.pointsUsed.toLocaleString()}đ</span>
                                ) : <span />}
                                {booking.pointsEarned > 0 && booking.status !== 'CANCELLED' && (
                                  <span style={{ color: '#00b0ff' }}>🎁 +{booking.pointsEarned.toLocaleString()} điểm</span>
                                )}
                              </div>
                            )}

                            {/* QR Button */}
                            {booking.bookingCode && booking.status !== 'CANCELLED' && (
                              <div className="mt-3">
                                <Button
                                  size="sm"
                                  className="w-100"
                                  style={{ background: 'rgba(245,166,35,0.15)', border: '1px solid #f5a623', color: '#f5a623', fontWeight: 600 }}
                                  onClick={() => openQrModal(booking.bookingCode, '🎫 Mã QR vé phim', 'Xuất trình mã QR này cho nhân viên tại cổng vào rạp')}
                                >
                                  📱 Xem QR vé
                                </Button>
                              </div>
                            )}

                            {canCancelBooking(booking) && (
                              <div className="mt-2">
                                <Button
                                  variant="outline-danger" size="sm"
                                  className="btn-cancel-booking w-100"
                                  disabled={cancellingId === booking.id}
                                  onClick={() => openCancelModal(booking.id, booking.movieName)}
                                >
                                  {cancellingId === booking.id ? (
                                    <><Spinner animation="border" size="sm" className="me-2" />Đang hủy...</>
                                  ) : '🗑 Hủy vé'}
                                </Button>
                              </div>
                            )}

                            {booking.status === 'CONFIRMED' && !canCancelBooking(booking) && (
                              <div className="mt-2">
                                <div className="py-2 px-3" style={{ fontSize: '0.85rem', backgroundColor: 'rgba(255,193,7,0.15)', borderRadius: '6px', borderLeft: '3px solid #ffc107' }}>
                                  <span className="me-2">⏰</span>
                                  <small style={{ color: '#ffd966' }}>Không thể hủy (đã quá 6 giờ trước suất chiếu)</small>
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
          </>
        )}

        {/* ─── FOOD TAB ─────────────────────────────────── */}
        {activeTab === 'food' && (
          <>
            {foodOrders.length === 0 ? (
              <div className="empty-state text-center py-5">
                <div className="empty-icon mb-4">🍿</div>
                <h3 className="text-white mb-3">Chưa có đơn đồ ăn nào</h3>
                <p className="text-white-50 mb-4">Đặt đồ ăn trước khi xem phim để tiết kiệm thời gian!</p>
                <Link to="/food" className="btn btn-primary-custom px-4 py-2">🍿 Đặt đồ ăn ngay</Link>
              </div>
            ) : (
              <Row className="g-4">
                {foodOrders.map((order) => {
                  const statusInfo = FOOD_STATUS_MAP[order.status] || { label: order.status, cls: 'status-pending', icon: '?' }
                  return (
                    <Col xs={12} lg={8} xl={7} key={order.id}>
                      <Card className={`booking-card h-100 bg-transparent border-0 ${order.status === 'CANCELLED' ? 'booking-cancelled' : ''}`}>
                        <div className="booking-card-inner p-4">
                          {/* Header */}
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <div>
                              <div className="fw-bold" style={{ color: '#f5a623', fontSize: '0.9rem', letterSpacing: 1 }}>
                                {order.orderCode}
                              </div>
                              <small className="text-white-50">
                                {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                              </small>
                            </div>
                            <Badge className={`status-badge ${statusInfo.cls}`}>
                              {statusInfo.icon} {statusInfo.label}
                            </Badge>
                          </div>

                          {/* Items */}
                          <div className="mb-3">
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="d-flex justify-content-between" style={{ fontSize: '0.9rem', padding: '4px 0', borderBottom: '1px solid #2a2a4a' }}>
                                <span className="text-white">
                                  {item.foodItemName}
                                  {item.sizeLabel && <span className="text-white-50 ms-1">(Size {item.sizeLabel})</span>}
                                  <span className="text-white-50"> × {item.quantity}</span>
                                </span>
                                <span className="fw-bold" style={{ color: '#f5a623' }}>
                                  {(item.unitPrice * item.quantity).toLocaleString('vi-VN')}đ
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Pickup info & Points */}
                          <div className="d-flex flex-column gap-1 mb-3" style={{ fontSize: '0.85rem', color: '#a8a8b8' }}>
                            <div className="d-flex gap-3">
                              {order.pickupDate && <span>📅 {new Date(order.pickupDate).toLocaleDateString('vi-VN')}</span>}
                              {order.pickupTime && <span>⏰ {order.pickupTime}</span>}
                              <span>💰 {order.totalAmount?.toLocaleString('vi-VN')}đ</span>
                            </div>
                            {order.pointsUsed > 0 && (
                              <div style={{ color: '#2ecc71', fontWeight: 600 }}>
                                ⭐ Dùng điểm: -{order.pointsUsed.toLocaleString('vi-VN')}đ
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="d-flex gap-2">
                            {order.orderCode && order.status !== 'CANCELLED' && (
                              <Button
                                size="sm" style={{ background: 'rgba(245,166,35,0.15)', border: '1px solid #f5a623', color: '#f5a623', fontWeight: 600 }}
                                onClick={() => openQrModal(order.orderCode, '🍿 Mã QR đồ ăn', 'Xuất trình mã QR này tại quầy F&B để nhận đồ ăn')}
                              >
                                📱 Xem QR
                              </Button>
                            )}
                            {(() => {
                              const cancelStatus = getCancelFoodStatus(order)
                              if (!cancelStatus.canCancel && !cancelStatus.isTimeRestricted) return null

                              if (cancelStatus.isTimeRestricted) {
                                return (
                                  <div className="py-1 px-2" style={{ fontSize: '0.8rem', backgroundColor: 'rgba(255,193,7,0.15)', borderRadius: '6px', borderLeft: '3px solid #ffc107', marginTop: 'auto', marginBottom: 'auto' }}>
                                    <span className="me-2">⏰</span>
                                    <small style={{ color: '#ffd966' }}>Không thể hủy (dưới 1h)</small>
                                  </div>
                                )
                              }

                              return (
                                <Button
                                  size="sm" variant="outline-danger"
                                  onClick={() => setCancelFoodModal({ show: true, orderId: order.id })}
                                >
                                  🗑 Hủy đơn
                                </Button>
                              )
                            })()}
                          </div>
                        </div>
                      </Card>
                    </Col>
                  )
                })}
              </Row>
            )}
          </>
        )}
      </Container>
    </div>
  )
}