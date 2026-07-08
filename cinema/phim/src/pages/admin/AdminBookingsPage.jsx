import { useState, useEffect, useMemo } from 'react'
import { Container, Table, Badge, Button, Alert, Spinner, Modal, Card, Row, Col, Form, InputGroup } from 'react-bootstrap'
import axios from 'axios'
import './AdminBookingsPage.css'
import './AdminCommon.css'
import './AdminProfessional.css'

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [users, setUsers] = useState([])
  const [movies, setMovies] = useState([])
  const [showtimes, setShowtimes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserDetailModal, setShowUserDetailModal] = useState(false)

  const [filterDate, setFilterDate] = useState('')
  const [filterMovie, setFilterMovie] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [searchText, setSearchText] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [bookingsRes, usersRes, moviesRes, showtimesRes] = await Promise.all([
        axios.get('http://localhost:8080/api/bookings'),
        axios.get('http://localhost:8080/api/users'),
        axios.get('http://localhost:8080/api/movies'),
        axios.get('http://localhost:8080/api/showtimes')
      ])
      
      setBookings(bookingsRes.data)
      setUsers(usersRes.data)
      setMovies(moviesRes.data)
      setShowtimes(showtimesRes.data)
    } catch { 
      setError('Lỗi tải dữ liệu') 
    }
    finally { 
      setLoading(false) 
    }
  }

  useEffect(() => { load() }, [])

  const userBookingStats = useMemo(() => {
    const userStats = {}
    
    users.forEach(user => {
      const userBookings = bookings.filter(b => String(b.userId) === String(user.id))
      const confirmedBookings = userBookings.filter(b => b.status !== 'cancelled')
      const cancelledBookings = userBookings.filter(b => b.status === 'cancelled')
      
      const totalSpent = confirmedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0)
      const totalBookings = userBookings.length
      const totalConfirmed = confirmedBookings.length
      const totalCancelled = cancelledBookings.length
      const lastBooking = userBookings.length > 0 
        ? userBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
        : null
      
      userStats[user.id] = {
        user,
        bookings: userBookings,
        totalSpent,
        totalBookings,
        totalConfirmed,
        totalCancelled,
        lastBooking
      }
    })
    
    return Object.values(userStats).filter(stat => stat.totalBookings > 0)
  }, [users, bookings])

  const filteredUserStats = useMemo(() => {
    return userBookingStats.filter(userStat => {
      const matchSearch = !searchText || 
        userStat.user.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
        userStat.user.username?.toLowerCase().includes(searchText.toLowerCase())
      
      const matchDate = !filterDate || 
        userStat.bookings.some(b => b.createdAt?.split('T')[0] === filterDate)
      
      const matchMovie = !filterMovie || 
        userStat.bookings.some(b => {
          const movie = movies.find(m => String(m.id) === String(showtimes.find(s => String(s.id) === String(b.showtimeId))?.movieId))
          return movie?.title === filterMovie
        })
      
      const matchStatus = !filterStatus || 
        userStat.bookings.some(b => b.status === filterStatus)
      
      return matchSearch && matchDate && matchMovie && matchStatus
    })
  }, [userBookingStats, searchText, filterDate, filterMovie, filterStatus, movies, showtimes])

  const uniqueMovies = useMemo(() => {
    const movieTitles = new Set()
    bookings.forEach(booking => {
      const showtime = showtimes.find(s => String(s.id) === String(booking.showtimeId))
      if (showtime) {
        const movie = movies.find(m => String(m.id) === String(showtime.movieId))
        if (movie) {
          movieTitles.add(movie.title)
        }
      }
    })
    return Array.from(movieTitles)
  }, [bookings, showtimes, movies])

  const handleViewUserDetail = (userStat) => {
    setSelectedUser(userStat)
    setShowUserDetailModal(true)
  }

  const getEnrichedUserBookings = (userBookings) => {
    return userBookings.map(booking => {
      const showtime = showtimes.find(s => String(s.id) === String(booking.showtimeId))
      
      let movie = null
      if (showtime && showtime.movieId) {
        movie = movies.find(m => 
          String(m.id) === String(showtime.movieId) || 
          m.id === showtime.movieId ||
          Number(m.id) === Number(showtime.movieId)
        )
      }
      
      return {
        ...booking,
        showtime,
        movie
      }
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  const canDeleteBooking = (booking) => {
    if (booking.status === 'cancelled') return false
    
    const showtime = showtimes.find(s => String(s.id) === String(booking.showtimeId))
    if (!showtime?.date) return false
    const showtimeDate = new Date(showtime.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return showtimeDate >= today
  }

  const today = new Date().toISOString().split('T')[0]
  const todayBookings = bookings.filter(b => b.createdAt?.split('T')[0] === today)
  const todayRevenue = todayBookings.reduce((s, b) => s + (b.totalPrice || 0), 0)
  const cancelRate = bookings.length > 0 ? 
    (bookings.filter(b => b.status === 'cancelled').length / bookings.length) * 100 : 0

  const handleDeleteClick = (id) => { 
    setDeletingId(id); 
    setShowDeleteConfirm(true) 
  }
  
  const handleConfirmDelete = async () => {
    try {
      const booking = bookings.find(b => b.id === deletingId)
      
      await axios.put(`http://localhost:8080/api/bookings/${deletingId}`, {
        ...booking,
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      })
      
      if (booking?.showtimeId) {
        const showtime = showtimes.find(s => String(s.id) === String(booking.showtimeId))
        if (showtime) {
          const seatNumsToRestore = booking.seatNums || []
          const currentBooked = showtime.bookedSeatNums || []
          const newBookedSeatNums = currentBooked.filter(s => !seatNumsToRestore.includes(s))
          await axios.patch(`http://localhost:8080/api/showtimes/${booking.showtimeId}`, {
            bookedSeats: newBookedSeatNums.length,
            bookedSeatNums: newBookedSeatNums
          })
        }
      }
      
      setShowDeleteConfirm(false)
      load()
      
      if (selectedUser) {
        const updatedBookings = selectedUser.bookings.map(b => 
          b.id === deletingId ? { ...b, status: 'cancelled', cancelledAt: new Date().toISOString() } : b
        )
        setSelectedUser({
          ...selectedUser,
          bookings: updatedBookings
        })
      }
    } catch { 
      setError('Hủy vé thất bại.') 
    }
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case 'confirmed': return { label: '✓ Đã xác nhận', variant: 'success', icon: '✅' }
      case 'pending': return { label: '⏳ Đang chờ', variant: 'warning', icon: '⏳' }
      case 'cancelled': return { label: '❌ Đã hủy', variant: 'danger', icon: '❌' }
      case 'refunded': return { label: '💸 Đã hoàn tiền', variant: 'info', icon: '💸' }
      default: return { label: '❓ Không xác định', variant: 'secondary', icon: '❓' }
    }
  }

  const formatSeats = (seatNums, seats) => {
    if (seatNums && seatNums.length > 0) {
      return seatNums.sort().map(s => `[${s}]`).join('')
    }
    return `[${seats} ghế]`
  }

  const clearFilters = () => {
    setFilterDate('')
    setFilterMovie('')
    setFilterStatus('')
    setSearchText('')
  }

  const hasActiveFilters = filterDate || filterMovie || filterStatus || searchText

  return (
    <div className="page-wrapper">
      <div className="page-header-banner py-4">
        <Container>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h1 className="fw-bold mb-1">🎟️ Quản lý Đặt Vé</h1>
              <p className="text-muted mb-0">Xem, lọc và quản lý tất cả đơn đặt vé trong hệ thống</p>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-4">
        
        <Row className="g-4 mb-4">
          <Col md={4}>
            <div className="admin-stat-professional">
              <div className="stat-icon">🎟️</div>
              <div className="stat-value">{bookings.length}</div>
              <div className="stat-label">Tổng số vé đã đặt</div>
            </div>
          </Col>
          <Col md={4}>
            <div className="admin-stat-professional">
              <div className="stat-icon">💰</div>
              <div className="stat-value" style={{ color: 'var(--admin-primary)' }}>
                {todayRevenue.toLocaleString()}đ
              </div>
              <div className="stat-label">Doanh thu hôm nay</div>
            </div>
          </Col>
          <Col md={4}>
            <div className="admin-stat-professional">
              <div className="stat-icon">📊</div>
              <div className="stat-value" style={{ color: cancelRate > 10 ? 'var(--admin-danger)' : 'var(--admin-success)' }}>
                {cancelRate.toFixed(1)}%
              </div>
              <div className="stat-label">Tỷ lệ hủy vé</div>
            </div>
          </Col>
        </Row>

        {error && (
          <Alert className="alert-professional alert-danger" onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        )}

        
        <Card className="filter-card mb-4">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0 text-light">🔍 Bộ lọc và tìm kiếm</h6>
              {hasActiveFilters && (
                <Button variant="link" size="sm" className="text-muted p-0" onClick={clearFilters}>
                  Xóa bộ lọc
                </Button>
              )}
            </div>
            <Row className="g-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small text-muted">Ngày đặt vé</Form.Label>
                  <Form.Control 
                    type="date" 
                    value={filterDate} 
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="filter-input"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small text-muted">Phim</Form.Label>
                  <Form.Select 
                    value={filterMovie} 
                    onChange={(e) => setFilterMovie(e.target.value)}
                    className="filter-input"
                  >
                    <option value="">Tất cả phim</option>
                    {uniqueMovies.map(m => <option key={m} value={m}>{m}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label className="small text-muted">Trạng thái</Form.Label>
                  <Form.Select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="filter-input"
                  >
                    <option value="">Tất cả</option>
                    <option value="confirmed">✅ Đã xác nhận</option>
                    <option value="cancelled">❌ Đã hủy</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small text-muted">Tìm kiếm</Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="search-addon">🔍</InputGroup.Text>
                    <Form.Control 
                      type="text" 
                      placeholder="Tìm theo tên khách hàng hoặc phim..." 
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="filter-input"
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {loading ? (
          <div className="text-center py-5">
            <Spinner variant="warning" />
            <div className="mt-3 text-muted">Đang tải dữ liệu đặt vé...</div>
          </div>
        ) : (
          <Card className="table-card mb-4">
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table className="admin-table modern-table" hover responsive>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Khách hàng</th>
                      <th>Vé xác nhận</th>
                      <th>Vé đã hủy</th>
                      <th>Tổng chi tiêu</th>
                      <th>Lần đặt cuối</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUserStats.map((userStat, i) => (
                      <tr 
                        key={userStat.user.id} 
                        className="table-row-hover"
                        onClick={() => handleViewUserDetail(userStat)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="text-muted">{i + 1}</td>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            <div 
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: '40px',
                                height: '40px',
                                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                color: '#000',
                                fontWeight: '700',
                                fontSize: '0.9rem'
                              }}
                            >
                              {(userStat.user.fullName?.charAt(0) || userStat.user.username?.charAt(0) || 'U').toUpperCase()}
                            </div>
                            <div>
                              <div className="movie-cell">
                                <strong>{userStat.user.fullName || userStat.user.username}</strong>
                              </div>
                              <small className="text-muted">
                                @{userStat.user.username}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge bg="success" className="time-badge">
                            ✅ {userStat.totalConfirmed} vé
                          </Badge>
                        </td>
                        <td>
                          <Badge bg="danger" className="time-badge">
                            ❌ {userStat.totalCancelled} vé
                          </Badge>
                        </td>
                        <td className="price-cell">
                          {userStat.totalSpent.toLocaleString()}đ
                        </td>
                        <td className="text-light">
                          {userStat.lastBooking ? userStat.lastBooking.createdAt.split('T')[0] : 'N/A'}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <Button 
                              size="sm" 
                              variant="outline-primary" 
                              className="action-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewUserDetail(userStat)
                              }}
                              title="Xem chi tiết đặt vé"
                            >
                              👁️
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUserStats.length === 0 && (
                      <tr>
                        <td colSpan="7" className="text-center py-5 text-muted">
                          <div className="empty-state">
                            <span className="empty-icon">📭</span>
                            <p>Không tìm thấy khách hàng nào có đặt vé</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        )}
      </Container>

      
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered className="modal-professional">
        <Modal.Header closeButton>
          <Modal.Title>⚠️ Xác nhận hủy vé</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ color: 'var(--admin-text-primary)', lineHeight: '1.6' }}>
            <p style={{ marginBottom: 'var(--admin-spacing-md)' }}>
              Bạn có chắc chắn muốn hủy vé đặt này không?
            </p>
            <div style={{ 
              background: 'var(--admin-bg-surface)', 
              padding: 'var(--admin-spacing-md)',
              borderRadius: 'var(--admin-radius-md)',
              border: '1px solid var(--admin-border)'
            }}>
              <small style={{ color: 'var(--admin-text-muted)', fontWeight: '500' }}>
                ℹ️ Lưu ý: Ghế ngồi sẽ được tự động hoàn trả và có thể được đặt lại bởi khách hàng khác.
              </small>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            className="btn-admin-professional btn-secondary" 
            onClick={() => setShowDeleteConfirm(false)}
          >
            Hủy bỏ
          </Button>
          <Button 
            className="btn-admin-professional btn-danger" 
            onClick={handleConfirmDelete}
          >
            🗑️ Xác nhận hủy vé
          </Button>
        </Modal.Footer>
      </Modal>

      
      <Modal 
        show={showUserDetailModal} 
        onHide={() => setShowUserDetailModal(false)} 
        centered 
        size="xl" 
        className="modal-professional"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            👤 Chi tiết đặt vé - {selectedUser?.user.fullName || selectedUser?.user.username}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <>
              
              <Row className="g-3 mb-4">
                <Col md={2}>
                  <div className="text-center p-3 rounded" style={{ background: 'var(--admin-bg-surface)' }}>
                    <div className="h4 mb-1 text-primary">🎟️</div>
                    <div className="fw-bold">{selectedUser.totalBookings}</div>
                    <small className="text-muted">Tổng vé đã đặt</small>
                  </div>
                </Col>
                <Col md={2}>
                  <div className="text-center p-3 rounded" style={{ background: 'var(--admin-bg-surface)' }}>
                    <div className="h4 mb-1 text-success">✅</div>
                    <div className="fw-bold">{selectedUser.totalConfirmed}</div>
                    <small className="text-muted">Vé xác nhận</small>
                  </div>
                </Col>
                <Col md={2}>
                  <div className="text-center p-3 rounded" style={{ background: 'var(--admin-bg-surface)' }}>
                    <div className="h4 mb-1 text-danger">❌</div>
                    <div className="fw-bold">{selectedUser.totalCancelled}</div>
                    <small className="text-muted">Vé đã hủy</small>
                  </div>
                </Col>
                <Col md={2}>
                  <div className="text-center p-3 rounded" style={{ background: 'var(--admin-bg-surface)' }}>
                    <div className="h4 mb-1 text-warning">💰</div>
                    <div className="fw-bold">{selectedUser.totalSpent.toLocaleString()}đ</div>
                    <small className="text-muted">Tổng chi tiêu</small>
                  </div>
                </Col>
                <Col md={2}>
                  <div className="text-center p-3 rounded" style={{ background: 'var(--admin-bg-surface)' }}>
                    <div className="h4 mb-1 text-info">📅</div>
                    <div className="fw-bold">
                      {selectedUser.lastBooking ? selectedUser.lastBooking.createdAt.split('T')[0] : 'N/A'}
                    </div>
                    <small className="text-muted">Lần đặt cuối</small>
                  </div>
                </Col>
                <Col md={2}>
                  <div className="text-center p-3 rounded" style={{ background: 'var(--admin-bg-surface)' }}>
                    <div className="h4 mb-1 text-success">📞</div>
                    <div className="fw-bold">
                      {selectedUser.user.email && selectedUser.user.phone ? '✅' : '⚠️'}
                    </div>
                    <small className="text-muted">Thông tin liên hệ</small>
                  </div>
                </Col>
              </Row>

              
              <div className="mb-4 p-3 rounded" style={{ background: 'var(--admin-bg-surface)' }}>
                <h6 className="mb-3">📞 Thông tin liên hệ</h6>
                <Row>
                  <Col md={6}>
                    <small className="text-muted">Email:</small>
                    <div className="fw-semibold">{selectedUser.user.email || 'Chưa cập nhật'}</div>
                  </Col>
                  <Col md={6}>
                    <small className="text-muted">Số điện thoại:</small>
                    <div className="fw-semibold">{selectedUser.user.phone || 'Chưa cập nhật'}</div>
                  </Col>
                </Row>
              </div>

              
              <h6 className="mb-3">🎬 Lịch sử đặt vé (sắp xếp theo ngày đặt)</h6>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Row className="g-3">
                  {getEnrichedUserBookings(selectedUser.bookings).map((booking, index) => {
                    const statusInfo = getStatusInfo(booking.status)
                    return (
                      <Col md={6} key={booking.id}>
                        <div 
                          className="border rounded p-3 h-100"
                          style={{ background: 'var(--admin-bg-surface)' }}
                        >
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="flex-grow-1">
                              <h6 className="mb-1">
                                {booking.movie?.title || (booking.showtimeId ? 'Phim không tồn tại' : 'Vé cũ (không có suất chiếu)')}
                              </h6>
                              <small className="text-muted">
                                {booking.showtime ? (
                                  <>
                                    {booking.showtime.date} • {booking.showtime.time} • {booking.showtime.room}
                                  </>
                                ) : (
                                  'Thông tin suất chiếu không có'
                                )}
                              </small>
                            </div>
                            <Badge 
                              bg={statusInfo.variant} 
                              className={`status-badge status-${statusInfo.variant} ms-2`}
                            >
                              {statusInfo.icon}
                            </Badge>
                          </div>
                          
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <div>
                              <Badge bg="info" className="me-2">
                                {formatSeats(booking.seatNums, booking.seats)}
                              </Badge>
                              <span className="fw-bold text-warning">
                                {booking.totalPrice?.toLocaleString()}đ
                              </span>
                            </div>
                          </div>

                          <div className="d-flex justify-content-between align-items-center">
                            <small className="text-muted">
                              Đặt ngày: {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                            </small>
                            <div className="d-flex gap-2">
                              {canDeleteBooking(booking) ? (
                                <Button 
                                  size="sm" 
                                  variant="outline-danger" 
                                  onClick={() => handleDeleteClick(booking.id)}
                                  title="Hủy vé"
                                >
                                  🗑️
                                </Button>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="outline-secondary" 
                                  disabled
                                  title="Không thể hủy vé đã qua ngày chiếu"
                                >
                                  🔒
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Col>
                    )
                  })}
                  
                  {selectedUser.bookings.length === 0 && (
                    <Col xs={12}>
                      <div className="text-center py-4 text-muted">
                        <div className="mb-2">📭</div>
                        <p>Người dùng này chưa có đặt vé nào</p>
                      </div>
                    </Col>
                  )}
                </Row>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            className="btn-admin-professional btn-secondary" 
            onClick={() => setShowUserDetailModal(false)}
          >
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}