import { useState, useEffect, useMemo } from 'react'
import { Container, Table, Button, Modal, Form, Alert, Spinner, Badge, Card, Row, Col, InputGroup, ToggleButtonGroup, ToggleButton } from 'react-bootstrap'
import axios from 'axios'
import './AdminShowtimesPage.css'
import './AdminCommon.css'
import './AdminShowtimesEnhanced.css'

const EMPTY_FORM = { movieId: '', date: '', time: '', room: '', totalSeats: 100, price: 80000 }

const AVAILABLE_ROOMS = [
  { value: 'Phòng 1', label: 'Phòng 1', seats: 100 },
  { value: 'Phòng 2', label: 'Phòng 2', seats: 80 },
  { value: 'Phòng 3', label: 'Phòng 3', seats: 90 },
  { value: 'Phòng 4', label: 'Phòng 4', seats: 60 },
  { value: 'Phòng 5', label: 'Phòng 5', seats: 70 }
]

export default function AdminShowtimesPage() {
  const [showtimes, setShowtimes] = useState([])
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [filterDate, setFilterDate] = useState('')
  const [filterMovie, setFilterMovie] = useState('')
  const [filterRoom, setFilterRoom] = useState('')
  const [searchText, setSearchText] = useState('')
  const [viewMode, setViewMode] = useState('table') // 'table' or 'calendar'
  const [bookingCounts, setBookingCounts] = useState({})

  const load = async () => {
    setLoading(true)
    try {
      const [stRes, mvRes, bookingsRes] = await Promise.all([
        axios.get('http://localhost:8080/api/showtimes'),
        axios.get('http://localhost:8080/api/movies'),
        axios.get('http://localhost:8080/api/bookings')
      ])
      setShowtimes(stRes.data)
      setMovies(mvRes.data)
      
      // Count bookings per showtime
      const counts = {}
      bookingsRes.data.forEach(booking => {
        counts[booking.showtimeId] = (counts[booking.showtimeId] || 0) + 1
      })
      setBookingCounts(counts)
    } catch { setError('Lỗi tải dữ liệu') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const getMovieTitle = (id) => movies.find(m => String(m.id) === String(id))?.title || 'N/A'

  const filteredShowtimes = useMemo(() => {
    return showtimes.filter(st => {
      const movieTitle = getMovieTitle(st.movieId).toLowerCase()
      const matchDate = !filterDate || st.date === filterDate
      const matchMovie = !filterMovie || String(st.movieId) === filterMovie
      const matchRoom = !filterRoom || st.room === filterRoom
      const matchSearch = !searchText || movieTitle.includes(searchText.toLowerCase())
      return matchDate && matchMovie && matchRoom && matchSearch
    }).sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date)
      if (dateCompare !== 0) return dateCompare
      return a.time.localeCompare(b.time)
    })
  }, [showtimes, filterDate, filterMovie, filterRoom, searchText, movies])

  const getOccupancyStatus = (booked, total) => {
    const percentage = (booked / total) * 100
    if (percentage > 80) return { label: 'Sắp full', variant: 'danger', icon: '🔴' }
    if (percentage >= 40) return { label: 'Trung bình', variant: 'warning', icon: '🟡' }
    return { label: 'Còn nhiều ghế', variant: 'success', icon: '🟢' }
  }

  const OccupancyBar = ({ booked, total }) => {
    const percentage = Math.round((booked / total) * 100)
    const status = getOccupancyStatus(booked, total)
    return (
      <div className="occupancy-bar-wrapper">
        <div className="occupancy-bar">
          <div 
            className={`occupancy-bar-fill status-${status.variant}`} 
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="occupancy-info">
          <span className={`status-badge status-${status.variant}`}>
            {status.icon} {percentage}%
          </span>
          <span className="text-muted small">{booked}/{total}</span>
        </div>
      </div>
    )
  }

  const calendarData = useMemo(() => {
    const data = {}
    filteredShowtimes.forEach(st => {
      if (!data[st.date]) data[st.date] = []
      data[st.date].push(st)
    })
    return data
  }, [filteredShowtimes])

  const handleOpenAdd = () => {
    setForm({ ...EMPTY_FORM, movieId: movies[0]?.id || '', bookedSeatNums: [] })
    setEditingId(null); setError(''); setShowModal(true)
  }
  const handleOpenEdit = (st) => {
    setForm({ 
      movieId: st.movieId,
      date: st.date,
      time: st.time.substring(0, 5), // Convert HH:MM:SS to HH:MM
      room: st.room,
      totalSeats: st.totalSeats,
      bookedSeats: st.bookedSeats,
      price: st.price,
      bookedSeatNums: st.bookedSeatNums || []
    })
    setEditingId(st.id); setError(''); setShowModal(true)
  }
  const handleChange = (e) => {
    const { name, value } = e.target
    
    if (name === 'room') {
      const selectedRoom = AVAILABLE_ROOMS.find(r => r.value === value)
      if (selectedRoom) {
        setForm({ 
          ...form, 
          room: value,
          totalSeats: selectedRoom.seats 
        })
        return
      }
    }
    
    setForm({ ...form, [name]: value })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!form.movieId) {
      setError('❌ Vui lòng chọn phim.'); return
    }
    
    if (!form.date) {
      setError('❌ Ngày chiếu không được để trống.'); return
    }
    
    if (!form.time) {
      setError('❌ Giờ chiếu không được để trống.'); return
    }
    
    if (!form.room?.trim()) {
      setError('❌ Vui lòng chọn phòng chiếu.'); return
    }
    
    const isValidRoom = AVAILABLE_ROOMS.some(r => r.value === form.room)
    if (!isValidRoom) {
      setError('❌ Phòng chiếu không hợp lệ. Vui lòng chọn từ danh sách.'); return
    }
    
    const showtimeDate = new Date(form.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (showtimeDate < today) {
      setError('❌ Ngày chiếu không được là ngày trong quá khứ.'); return
    }
    
    const maxDate = new Date()
    maxDate.setFullYear(maxDate.getFullYear() + 1)
    
    if (showtimeDate > maxDate) {
      setError('❌ Ngày chiếu không được quá 1 năm trong tương lai.'); return
    }
    
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/
    if (!timeRegex.test(form.time)) {
      setError('❌ Giờ chiếu không hợp lệ (định dạng HH:MM hoặc HH:MM:SS).'); return
    }
    
    const totalSeats = Number(form.totalSeats)
    
    if (isNaN(totalSeats) || totalSeats <= 0) {
      setError('❌ Tổng số ghế phải là số dương.'); return
    }
    
    if (totalSeats > 500) {
      setError('❌ Tổng số ghế không được quá 500.'); return
    }
    
    // Only validate bookedSeats if editing (not when adding new)
    if (editingId) {
      const bookedSeats = Number(form.bookedSeats)
      
      if (isNaN(bookedSeats) || bookedSeats < 0) {
        setError('❌ Số ghế đã đặt không được âm.'); return
      }
      
      if (bookedSeats > totalSeats) {
        setError('❌ Số ghế đã đặt không được lớn hơn tổng số ghế.'); return
      }
    }
    
    const price = Number(form.price)
    if (isNaN(price) || price < 0) {
      setError('❌ Giá vé phải là số không âm.'); return
    }
    
    if (price > 1000000) {
      setError('❌ Giá vé không hợp lệ (tối đa 1,000,000đ).'); return
    }
    
    if (!editingId) {
      const duplicate = showtimes.find(st => 
        String(st.movieId) === String(form.movieId) &&
        st.date === form.date &&
        st.time === form.time &&
        st.room.toLowerCase() === form.room.trim().toLowerCase()
      )
      
      if (duplicate) {
        setError('❌ Suất chiếu này đã tồn tại (trùng phim, ngày, giờ và phòng).'); return
      }
    }
    
    setSaving(true)
    try {
      const payload = {
        movieId: form.movieId,
        date: form.date,
        time: form.time,
        room: form.room.trim(),
        totalSeats: Number(form.totalSeats),
        price: Number(form.price),
        bookedSeatNums: form.bookedSeatNums || []
      }
      
      if (editingId) {
        await axios.put(`http://localhost:8080/api/showtimes/${editingId}`, payload)
      } else {
        await axios.post('http://localhost:8080/api/showtimes', payload)
      }
      setShowModal(false); load()
    } catch (err) { 
      setError('❌ Lưu thất bại. Vui lòng thử lại.')
      console.error('Save error:', err)
    }
    finally { setSaving(false) }
  }

  const handleDeleteClick = (id) => { 
    setDeletingId(id)
    setShowDeleteConfirm(true)
  }
  const handleConfirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:8080/api/showtimes/${deletingId}`)
      setShowDeleteConfirm(false)
      load()
    } catch (err) {
      setShowDeleteConfirm(false)
      
      // Check if error response has specific message
      if (err.response?.data?.error) {
        setError(`❌ ${err.response.data.error}`)
      } else if (err.response?.status === 400) {
        setError('❌ Không thể xóa suất chiếu này vì đã có người đặt vé.')
      } else {
        setError('❌ Xóa thất bại. Vui lòng thử lại.')
      }
    }
  }

  const handleDuplicate = async (showtime) => {
    const newDate = prompt('Nhập ngày mới (YYYY-MM-DD):', showtime.date)
    if (!newDate) return
    try {
      await axios.post('http://localhost:8080/api/showtimes', {
        movieId: showtime.movieId,
        date: newDate,
        time: showtime.time,
        room: showtime.room,
        totalSeats: showtime.totalSeats,
        price: showtime.price,
        bookedSeatNums: []
      })
      load()
    } catch { setError('Sao chép thất bại.') }
  }

  const clearFilters = () => {
    setFilterDate('')
    setFilterMovie('')
    setFilterRoom('')
    setSearchText('')
  }

  const hasActiveFilters = filterDate || filterMovie || filterRoom || searchText

  return (
    <div className="page-wrapper">
      <div className="page-header-banner py-4">
        <Container>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h1 className="fw-bold mb-1">📅 Quản lý Suất Chiếu</h1>
              <p className="text-muted mb-0">Thêm, sửa, xóa suất chiếu</p>
            </div>
            <div className="d-flex gap-2 align-items-center">
              <div className="view-toggle">
                <ToggleButtonGroup
                  type="radio"
                  name="viewMode"
                  value={viewMode}
                  onChange={setViewMode}
                  className="bg-transparent"
                >
                  <ToggleButton 
                    id="table-view" 
                    value="table" 
                    variant="outline-light"
                    className="me-1"
                  >
                    📋 Bảng
                  </ToggleButton>
                  <ToggleButton 
                    id="calendar-view" 
                    value="calendar" 
                    variant="outline-light"
                  >
                    📆 Lịch
                  </ToggleButton>
                </ToggleButtonGroup>
              </div>
              <Button id="add-showtime-btn" className="btn-primary-custom" onClick={handleOpenAdd}>
                ➕ Thêm suất chiếu
              </Button>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-4">
        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

        
        <Card className="filter-card mb-4">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0 text-light">🔍 Bộ lọc</h6>
              {hasActiveFilters && (
                <Button variant="link" size="sm" className="text-muted p-0" onClick={clearFilters}>
                  Xóa bộ lọc
                </Button>
              )}
            </div>
            <Row className="g-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small text-muted">Ngày chiếu</Form.Label>
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
                    {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label className="small text-muted">Phòng</Form.Label>
                  <Form.Select 
                    value={filterRoom} 
                    onChange={(e) => setFilterRoom(e.target.value)}
                    className="filter-input"
                  >
                    <option value="">Tất cả phòng</option>
                    {AVAILABLE_ROOMS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
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
                      placeholder="Tìm theo tên phim..." 
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
          <div className="text-center py-5"><Spinner variant="warning" /></div>
        ) : viewMode === 'table' ? (
          <Card className="table-card">
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table className="admin-table modern-table" hover responsive>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Phim</th>
                      <th>Ngày</th>
                      <th>Giờ</th>
                      <th>Phòng</th>
                      <th>Trạng thái ghế</th>
                      <th>Giá vé</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredShowtimes.map((st, i) => {
                      const status = getOccupancyStatus(st.bookedSeats, st.totalSeats)
                      return (
                        <tr key={st.id} className="table-row-hover">
                          <td className="text-muted">{i + 1}</td>
                          <td>
                            <div className="movie-cell">
                              <strong>{getMovieTitle(st.movieId)}</strong>
                            </div>
                          </td>
                          <td className="text-light">{st.date}</td>
                          <td>
                            <Badge bg="info" className="time-badge">{st.time}</Badge>
                          </td>
                          <td className="text-light">{st.room}</td>
                          <td>
                            <OccupancyBar booked={st.bookedSeats} total={st.totalSeats} />
                          </td>
                          <td className="price-cell">{Number(st.price).toLocaleString()}đ</td>
                          <td>
                            <div className="action-buttons">
                              <Button 
                                size="sm" 
                                variant="outline-primary" 
                                className="action-btn"
                                onClick={() => handleOpenEdit(st)}
                                title="Sửa"
                              >
                                ✏️
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline-info" 
                                className="action-btn"
                                onClick={() => handleDuplicate(st)}
                                title="Sao chép"
                              >
                                📋
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline-danger" 
                                className="action-btn"
                                onClick={() => handleDeleteClick(st.id)}
                                title={bookingCounts[st.id] > 0 ? `Có ${bookingCounts[st.id]} vé đã đặt - Không thể xóa` : 'Xóa'}
                              >
                                {bookingCounts[st.id] > 0 ? '🔒' : '🗑️'}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {filteredShowtimes.length === 0 && (
                      <tr>
                        <td colSpan="8" className="text-center py-5 text-muted">
                          <div className="empty-state">
                            <span className="empty-icon">📭</span>
                            <p>Không tìm thấy suất chiếu nào</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        ) : (
          /* Calendar View */
          <div className="calendar-view">
            {Object.keys(calendarData).sort().map(date => (
              <Card key={date} className="calendar-day-card mb-3">
                <Card.Header className="calendar-day-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">📅 {date}</h6>
                    <Badge bg="secondary">{calendarData[date].length} suất</Badge>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Row className="g-3">
                    {calendarData[date].map(st => {
                      const status = getOccupancyStatus(st.bookedSeats, st.totalSeats)
                      return (
                        <Col key={st.id} md={4} lg={3}>
                          <Card className="calendar-showtime-card">
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <span className="showtime-time">{st.time}</span>
                                <Badge bg={status.variant} className="status-badge-small">
                                  {status.icon}
                                </Badge>
                              </div>
                              <h6 className="showtime-movie-title mb-2">
                                {getMovieTitle(st.movieId)}
                              </h6>
                              <div className="showtime-meta mb-2">
                                <span className="meta-item">🎬 {st.room}</span>
                                <span className="meta-item">💰 {Number(st.price).toLocaleString()}đ</span>
                              </div>
                              <div className="mb-3">
                                <div className="occupancy-bar small-bar">
                                  <div 
                                    className={`occupancy-bar-fill status-${status.variant}`} 
                                    style={{ width: `${Math.round((st.bookedSeats / st.totalSeats) * 100)}%` }}
                                  />
                                </div>
                                <small className="text-muted">
                                  {st.bookedSeats}/{st.totalSeats} ghế đã đặt
                                </small>
                              </div>
                              <div className="d-flex gap-1">
                                <Button 
                                  size="sm" 
                                  variant="outline-primary" 
                                  className="flex-fill"
                                  onClick={() => handleOpenEdit(st)}
                                >
                                  ✏️
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline-danger" 
                                  className="flex-fill"
                                  onClick={() => handleDeleteClick(st.id)}
                                  title={bookingCounts[st.id] > 0 ? `Có ${bookingCounts[st.id]} vé đã đặt` : 'Xóa'}
                                >
                                  {bookingCounts[st.id] > 0 ? '🔒' : '🗑️'}
                                </Button>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      )
                    })}
                  </Row>
                </Card.Body>
              </Card>
            ))}
            {Object.keys(calendarData).length === 0 && (
              <div className="text-center py-5 text-muted">
                <span className="empty-icon">📭</span>
                <p>Không tìm thấy suất chiếu nào</p>
              </div>
            )}
          </div>
        )}
      </Container>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingId ? '✏️ Sửa suất chiếu' : '➕ Thêm suất chiếu'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>Phim <span className="text-danger">*</span></Form.Label>
              <Form.Select name="movieId" value={form.movieId} onChange={handleChange} required>
                <option value="">-- Chọn phim --</option>
                {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
              </Form.Select>
            </Form.Group>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <Form.Label>Ngày chiếu <span className="text-danger">*</span></Form.Label>
                <Form.Control name="date" type="date" value={form.date} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <Form.Label>Giờ chiếu <span className="text-danger">*</span></Form.Label>
                <Form.Control name="time" type="time" value={form.time} onChange={handleChange} required />
              </div>
            </div>
            <Form.Group className="mb-3">
              <Form.Label>Phòng chiếu <span className="text-danger">*</span></Form.Label>
              <Form.Select 
                name="room" 
                value={form.room} 
                onChange={handleChange} 
                required
              >
                <option value="">-- Chọn phòng --</option>
                {AVAILABLE_ROOMS.map(room => (
                  <option key={room.value} value={room.value}>
                    {room.label}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Số ghế sẽ tự động cập nhật theo phòng được chọn
              </Form.Text>
            </Form.Group>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <Form.Label>Tổng ghế</Form.Label>
                <Form.Control name="totalSeats" type="number" value={form.totalSeats} onChange={handleChange} />
              </div>
              {editingId && (
                <div className="col-md-6">
                  <Form.Label>Đã đặt</Form.Label>
                  <Form.Control 
                    name="bookedSeats" 
                    type="number" 
                    value={form.bookedSeats || 0} 
                    onChange={handleChange}
                    readOnly
                    className="bg-secondary bg-opacity-25"
                  />
                  <Form.Text className="text-muted">
                    Chỉ xem, được tính tự động từ đặt vé
                  </Form.Text>
                </div>
              )}
            </div>
            <div className="row g-3 mb-3">
              <div className="col-md-12">
                <Form.Label>Giá vé (đ)</Form.Label>
                <Form.Control name="price" type="number" value={form.price} onChange={handleChange} />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button>
            <Button id="save-showtime-btn" type="submit" className="btn-primary-custom" disabled={saving}>
              {saving ? <Spinner size="sm" /> : (editingId ? 'Lưu' : 'Thêm')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>🗑️ Xác nhận xóa suất chiếu</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deletingId && (() => {
            const showtime = showtimes.find(st => st.id === deletingId)
            const bookingCount = bookingCounts[deletingId] || 0
            
            return (
              <div>
                {bookingCount > 0 ? (
                  <Alert variant="warning" className="mb-3">
                    <strong>⚠️ Cảnh báo:</strong> Suất chiếu này đã có <strong>{bookingCount} vé</strong> được đặt. 
                    Không thể xóa!
                  </Alert>
                ) : (
                  <p>Bạn có chắc chắn muốn xóa suất chiếu này?</p>
                )}
                
                {showtime && (
                  <div className="mt-3 p-3 bg-dark bg-opacity-25 rounded">
                    <div className="mb-2"><strong>Phim:</strong> {getMovieTitle(showtime.movieId)}</div>
                    <div className="mb-2"><strong>Ngày giờ:</strong> {showtime.date} {showtime.time}</div>
                    <div className="mb-2"><strong>Phòng:</strong> {showtime.room}</div>
                    <div><strong>Ghế đã đặt:</strong> {showtime.bookedSeats}/{showtime.totalSeats}</div>
                  </div>
                )}
                
                {bookingCount === 0 && (
                  <p className="text-muted small mt-3 mb-0">
                    ⚠️ Hành động này không thể hoàn tác.
                  </p>
                )}
              </div>
            )
          })()}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
            Hủy
          </Button>
          <Button 
            variant="danger" 
            onClick={handleConfirmDelete}
            disabled={bookingCounts[deletingId] > 0}
          >
            {bookingCounts[deletingId] > 0 ? '🔒 Không thể xóa' : '🗑️ Xác nhận xóa'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}