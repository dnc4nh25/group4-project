import { useState, useEffect } from 'react'
import { Container, Table, Button, Alert, Spinner, Badge, Row, Col, Card, InputGroup, Form } from 'react-bootstrap'
import axios from 'axios'
import './AdminCommon.css'
import './AdminReviewsPage.css'

const API = 'http://localhost:3001'

function StarDisplay({ value }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} style={{ color: s <= value ? '#f5a623' : '#444', fontSize: '1rem' }}>★</span>
      ))}
    </span>
  )
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [movies, setMovies] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [movieFilter, setMovieFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [reviewsRes, moviesRes, usersRes] = await Promise.all([
        axios.get(`${API}/reviews`),
        axios.get(`${API}/movies`),
        axios.get(`${API}/users`)
      ])
      setReviews(reviewsRes.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
      setMovies(moviesRes.data)
      setUsers(usersRes.data)
    } catch { 
      setError('Lỗi tải dữ liệu') 
    }
    finally { 
      setLoading(false) 
    }
  }

  useEffect(() => { load() }, [])

  const getMovieTitle = (movieId) => {
    const movie = movies.find(m => String(m.id) === String(movieId))
    return movie ? movie.title : `Phim #${String(movieId).slice(-4)}`
  }

  const getUserName = (userId) => {
    const user = users.find(u => String(u.id) === String(userId))
    return user ? (user.fullName || user.username) : `User #${String(userId).slice(-4)}`
  }

  const handleToggleHidden = async (reviewId, currentHidden) => {
    try {
      const review = reviews.find(r => r.id === reviewId)
      await axios.put(`${API}/reviews/${reviewId}`, {
        ...review,
        hidden: !currentHidden
      })
      setReviews(reviews.map(r => 
        r.id === reviewId ? { ...r, hidden: !currentHidden } : r
      ))
    } catch {
      setError('Cập nhật trạng thái thất bại.')
    }
  }

  const filtered = reviews.filter(r => {
    const matchSearch = getMovieTitle(r.movieId).toLowerCase().includes(search.toLowerCase()) ||
                       getUserName(r.userId).toLowerCase().includes(search.toLowerCase()) ||
                       r.comment.toLowerCase().includes(search.toLowerCase())
    const matchMovie = !movieFilter || String(r.movieId) === movieFilter
    const matchStatus = !statusFilter || 
                       (statusFilter === 'hidden' && r.hidden) ||
                       (statusFilter === 'visible' && !r.hidden)
    return matchSearch && matchMovie && matchStatus
  })

  const totalReviews = reviews.length
  const hiddenReviews = reviews.filter(r => r.hidden).length
  return (
    <div className="page-wrapper">
      
      <div className="page-header-banner py-4">
        <Container>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="fw-bold mb-1">💬 Quản lý Đánh giá</h1>
              <p className="text-muted mb-0">Quản lý và kiểm duyệt đánh giá của người dùng</p>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-4">
        
        <Row className="admin-stats-row g-3">
          <Col xs={12} lg={4}>
            <div className="admin-stat-card-custom">
              <div className="stat-card-icon primary">💬</div>
              <div className="stat-card-value">{totalReviews}</div>
              <div className="stat-card-label">Tổng đánh giá</div>
            </div>
          </Col>
          <Col xs={6} lg={4}>
            <div className="admin-stat-card-custom">
              <div className="stat-card-icon warning">👁️</div>
              <div className="stat-card-value">{totalReviews - hiddenReviews}</div>
              <div className="stat-card-label">Đánh giá hiển thị</div>
            </div>
          </Col>
          <Col xs={6} lg={4}>
            <div className="admin-stat-card-custom">
              <div className="stat-card-icon danger">🙈</div>
              <div className="stat-card-value">{hiddenReviews}</div>
              <div className="stat-card-label">Đánh giá ẩn</div>
            </div>
          </Col>
        </Row>

        
        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

        
        <Card className="filter-card mb-4">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0 text-light">🔍 Bộ lọc</h6>
            </div>
            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small text-muted">Tìm kiếm</Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="search-addon">🔍</InputGroup.Text>
                    <Form.Control
                      type="text"
                      className="filter-input"
                      placeholder="Tìm theo phim, người dùng, nội dung..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small text-muted">Phim</Form.Label>
                  <Form.Select
                    className="filter-input"
                    value={movieFilter}
                    onChange={e => setMovieFilter(e.target.value)}
                  >
                    <option value="">Tất cả phim</option>
                    {movies.map(m => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small text-muted">Trạng thái</Form.Label>
                  <Form.Select
                    className="filter-input"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                  >
                    <option value="">Tất cả</option>
                    <option value="visible">Hiển thị</option>
                    <option value="hidden">Đã ẩn</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        
        {loading ? (
          <div className="loading-spinner-wrapper">
            <div className="loading-spinner"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <div className="empty-state-title">Không tìm thấy đánh giá nào</div>
            <div className="empty-state-text">
              {search || movieFilter || statusFilter
                ? 'Thử thay đổi bộ lọc để xem kết quả khác'
                : 'Chưa có đánh giá nào từ người dùng'}
            </div>
          </div>
        ) : (
          <Card className="table-card">
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table className="admin-table modern-table" hover responsive>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Phim</th>
                      <th>Người dùng</th>
                      <th>Đánh giá</th>
                      <th>Nội dung</th>
                      <th>Ngày tạo</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((review, index) => (
                      <tr key={review.id} className={review.hidden ? 'table-row-muted' : ''}>
                        <td className="text-muted">{index + 1}</td>
                        <td>
                          <div className="movie-cell">
                            <strong>{getMovieTitle(review.movieId)}</strong>
                          </div>
                        </td>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar">
                              {getUserName(review.userId).charAt(0).toUpperCase()}
                            </div>
                            <span>{getUserName(review.userId)}</span>
                          </div>
                        </td>
                        <td>
                          <div className="rating-cell">
                            <StarDisplay value={review.rating} />
                            <span className="ms-2">{review.rating}/5</span>
                          </div>
                        </td>
                        <td>
                          <div className="comment-cell">
                            {review.hidden ? (
                              <span className="text-muted fst-italic">
                                [Nội dung đã bị ẩn]
                              </span>
                            ) : (
                              <span>"{review.comment.length > 100 
                                ? review.comment.substring(0, 100) + '...' 
                                : review.comment}"</span>
                            )}
                          </div>
                        </td>
                        <td className="text-muted">
                          {review.createdAt}
                          {review.updatedAt && review.updatedAt !== review.createdAt && (
                            <div className="small">
                              <em>Sửa: {review.updatedAt}</em>
                            </div>
                          )}
                        </td>
                        <td>
                          <Badge 
                            bg={review.hidden ? 'danger' : 'success'} 
                            className="status-badge"
                          >
                            {review.hidden ? '🙈 Ẩn' : '👁️ Hiển thị'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            size="sm"
                            variant={review.hidden ? 'outline-success' : 'outline-warning'}
                            className="action-btn"
                            onClick={() => handleToggleHidden(review.id, review.hidden)}
                            title={review.hidden ? 'Hiển thị comment' : 'Ẩn comment'}
                          >
                            {review.hidden ? '👁️' : '🙈'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        )}
      </Container>
    </div>
  )
}