import { useState, useEffect, useMemo } from 'react'
import { Container, Card, Row, Col, Badge, Table, Form, Alert, Spinner } from 'react-bootstrap'
import axios from 'axios'
import './AdminCommon.css'

const AVAILABLE_ROOMS = [
  { value: 'Phòng 1', label: 'Phòng 1', seats: 100 },
  { value: 'Phòng 2', label: 'Phòng 2', seats: 80 },
  { value: 'Phòng 3', label: 'Phòng 3', seats: 90 },
  { value: 'Phòng 4', label: 'Phòng 4', seats: 60 },
  { value: 'Phòng 5', label: 'Phòng 5', seats: 70 }
]

export default function AdminRoomStatsPage() {
  const [showtimes, setShowtimes] = useState([])
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [stRes, mvRes] = await Promise.all([
          axios.get('http://localhost:8080/api/showtimes'),
          axios.get('http://localhost:8080/api/movies')
        ])
        setShowtimes(stRes.data)
        setMovies(mvRes.data)
      } catch {
        setError('Lỗi tải dữ liệu')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const getMovieTitle = (id) => movies.find(m => String(m.id) === String(id))?.title || 'N/A'

  const filteredShowtimes = useMemo(() => {
    if (!selectedDate) return showtimes
    return showtimes.filter(st => st.date === selectedDate)
  }, [showtimes, selectedDate])

  const roomStats = useMemo(() => {
    return AVAILABLE_ROOMS.map(room => {
      const roomShowtimes = filteredShowtimes.filter(st => st.room === room.value)
      
      const totalShowtimes = roomShowtimes.length
      const totalSeatsAvailable = roomShowtimes.reduce((sum, st) => sum + st.totalSeats, 0)
      const totalSeatsBooked = roomShowtimes.reduce((sum, st) => sum + st.bookedSeats, 0)
      const totalSeatsRemaining = totalSeatsAvailable - totalSeatsBooked
      const occupancyRate = totalSeatsAvailable > 0 
        ? Math.round((totalSeatsBooked / totalSeatsAvailable) * 100) 
        : 0
      const totalRevenue = roomShowtimes.reduce((sum, st) => sum + (st.bookedSeats * st.price), 0)

      return {
        ...room,
        totalShowtimes,
        totalSeatsAvailable,
        totalSeatsBooked,
        totalSeatsRemaining,
        occupancyRate,
        totalRevenue,
        showtimes: roomShowtimes.sort((a, b) => a.time.localeCompare(b.time))
      }
    })
  }, [filteredShowtimes])

  const getOccupancyColor = (rate) => {
    if (rate > 80) return 'danger'
    if (rate >= 40) return 'warning'
    return 'success'
  }

  const getOccupancyIcon = (rate) => {
    if (rate > 80) return '🔴'
    if (rate >= 40) return '🟡'
    return '🟢'
  }

  const availableDates = useMemo(() => {
    const dates = [...new Set(showtimes.map(st => st.date))].sort()
    return dates
  }, [showtimes])

  const overallStats = useMemo(() => {
    const totalShowtimes = filteredShowtimes.length
    const totalSeatsAvailable = filteredShowtimes.reduce((sum, st) => sum + st.totalSeats, 0)
    const totalSeatsBooked = filteredShowtimes.reduce((sum, st) => sum + st.bookedSeats, 0)
    const totalSeatsRemaining = totalSeatsAvailable - totalSeatsBooked
    const overallOccupancy = totalSeatsAvailable > 0 
      ? Math.round((totalSeatsBooked / totalSeatsAvailable) * 100) 
      : 0
    const totalRevenue = filteredShowtimes.reduce((sum, st) => sum + (st.bookedSeats * st.price), 0)

    return {
      totalShowtimes,
      totalSeatsAvailable,
      totalSeatsBooked,
      totalSeatsRemaining,
      overallOccupancy,
      totalRevenue
    }
  }, [filteredShowtimes])

  if (loading) {
    return (
      <div className="text-center py-5 mt-5">
        <Spinner variant="warning" style={{ width: 60, height: 60 }} />
        <p className="mt-3 text-muted">Đang tải dữ liệu...</p>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <div className="page-header-banner py-4">
        <Container>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h1 className="fw-bold mb-1">🎬 Thống Kê Phòng Chiếu</h1>
              <p className="text-muted mb-0">Xem số ghế còn trống theo phòng và suất chiếu</p>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-4">
        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

        
        <Card className="filter-card mb-4">
          <Card.Body>
            <Row className="align-items-center">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small text-muted">Chọn ngày chiếu</Form.Label>
                  <Form.Select 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="filter-input"
                  >
                    <option value="">Tất cả các ngày</option>
                    {availableDates.map(date => (
                      <option key={date} value={date}>
                        {new Date(date).toLocaleDateString('vi-VN', { 
                          weekday: 'long', 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric' 
                        })}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={8}>
                <div className="text-end">
                  <h6 className="text-muted mb-1">
                    {selectedDate 
                      ? `Ngày: ${new Date(selectedDate).toLocaleDateString('vi-VN')}` 
                      : 'Tất cả các ngày'}
                  </h6>
                  <p className="text-muted small mb-0">
                    {overallStats.totalShowtimes} suất chiếu
                  </p>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        
        <Row className="g-3 mb-4">
          <Col md={3}>
            <Card className="admin-stat-card h-100">
              <Card.Body className="text-center">
                <div className="stat-icon-lg mb-2">🎬</div>
                <h3 className="fw-bold text-primary mb-1">{overallStats.totalShowtimes}</h3>
                <p className="text-muted small mb-0">Tổng suất chiếu</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="admin-stat-card h-100">
              <Card.Body className="text-center">
                <div className="stat-icon-lg mb-2">💺</div>
                <h3 className="fw-bold text-info mb-1">{overallStats.totalSeatsAvailable.toLocaleString()}</h3>
                <p className="text-muted small mb-0">Tổng ghế</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="admin-stat-card h-100">
              <Card.Body className="text-center">
                <div className="stat-icon-lg mb-2">✅</div>
                <h3 className="fw-bold text-success mb-1">{overallStats.totalSeatsRemaining.toLocaleString()}</h3>
                <p className="text-muted small mb-0">Ghế còn trống</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="admin-stat-card h-100">
              <Card.Body className="text-center">
                <div className="stat-icon-lg mb-2">
                  {getOccupancyIcon(overallStats.overallOccupancy)}
                </div>
                <h3 className="fw-bold text-warning mb-1">{overallStats.overallOccupancy}%</h3>
                <p className="text-muted small mb-0">Tỷ lệ lấp đầy</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        
        {roomStats.map((room, index) => (
          <Card key={room.value} className="mb-4 animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-1">
                  🎬 {room.label}
                  <Badge bg="secondary" className="ms-2">{room.seats} ghế/suất</Badge>
                </h5>
                <small className="text-muted">{room.totalShowtimes} suất chiếu</small>
              </div>
              <div className="text-end">
                <Badge bg={getOccupancyColor(room.occupancyRate)} className="fs-6">
                  {getOccupancyIcon(room.occupancyRate)} {room.occupancyRate}%
                </Badge>
                <div className="text-muted small mt-1">
                  {room.totalSeatsBooked}/{room.totalSeatsAvailable} ghế đã đặt
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              {room.totalShowtimes === 0 ? (
                <div className="text-center py-4 text-muted">
                  <span style={{ fontSize: '3rem' }}>📭</span>
                  <p className="mb-0">Không có suất chiếu nào</p>
                </div>
              ) : (
                <>
                  
                  <Row className="g-3 mb-3">
                    <Col xs={6} md={3}>
                      <div className="stat-box">
                        <div className="stat-value text-info">{room.totalSeatsAvailable}</div>
                        <div className="stat-label">Tổng ghế</div>
                      </div>
                    </Col>
                    <Col xs={6} md={3}>
                      <div className="stat-box">
                        <div className="stat-value text-danger">{room.totalSeatsBooked}</div>
                        <div className="stat-label">Đã đặt</div>
                      </div>
                    </Col>
                    <Col xs={6} md={3}>
                      <div className="stat-box">
                        <div className="stat-value text-success">{room.totalSeatsRemaining}</div>
                        <div className="stat-label">Còn trống</div>
                      </div>
                    </Col>
                    <Col xs={6} md={3}>
                      <div className="stat-box">
                        <div className="stat-value text-warning">{room.totalRevenue.toLocaleString()}đ</div>
                        <div className="stat-label">Doanh thu</div>
                      </div>
                    </Col>
                  </Row>

                  
                  <div className="table-responsive">
                    <Table size="sm" className="admin-table mb-0">
                      <thead>
                        <tr>
                          <th>Giờ</th>
                          <th>Phim</th>
                          <th>Tổng ghế</th>
                          <th>Đã đặt</th>
                          <th>Còn trống</th>
                          <th>Tỷ lệ</th>
                          <th>Giá vé</th>
                        </tr>
                      </thead>
                      <tbody>
                        {room.showtimes.map(st => {
                          const remaining = st.totalSeats - st.bookedSeats
                          const rate = Math.round((st.bookedSeats / st.totalSeats) * 100)
                          return (
                            <tr key={st.id}>
                              <td>
                                <Badge bg="info">{st.time}</Badge>
                              </td>
                              <td className="text-light">{getMovieTitle(st.movieId)}</td>
                              <td className="text-center">{st.totalSeats}</td>
                              <td className="text-center text-danger">{st.bookedSeats}</td>
                              <td className="text-center">
                                <strong className="text-success">{remaining}</strong>
                              </td>
                              <td>
                                <Badge bg={getOccupancyColor(rate)}>
                                  {getOccupancyIcon(rate)} {rate}%
                                </Badge>
                              </td>
                              <td className="text-end">{st.price.toLocaleString()}đ</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </Table>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        ))}
      </Container>
    </div>
  )
}
