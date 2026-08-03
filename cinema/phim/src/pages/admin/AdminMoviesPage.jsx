import { useState, useEffect, useCallback } from 'react'
import { Container, Table, Button, Modal, Form, Alert, Spinner, Badge, Row, Col, Card, InputGroup, ToggleButtonGroup, ToggleButton } from 'react-bootstrap'
import axios from 'axios'
import './AdminMoviesPage.css'
import './AdminCommon.css'

const API = 'http://localhost:8080/api'

const EMPTY_FORM = {
  title: '', genres: [], rating: 0.0, duration: '', description: '',
  poster: '', director: '', cast: '', language: 'Tiếng Anh', releaseDate: '', ageRating: 'T13', trailerUrl: '',
  posterFile: null
}
const GENRES = ['Hành động', 'Giật gân', 'Khoa học viễn tưởng', 'Hoạt hình', 'Lịch sử', 'Tình cảm']
const AGE_RATINGS = ['P', 'T13', 'T16', 'T18']

function StarDisplay({ value }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} style={{ color: s <= value ? '#f5a623' : '#444', fontSize: '1rem' }}>★</span>
      ))}
    </span>
  )
}

export default function AdminMoviesPage() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showHideModal, setShowHideModal] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [restoringId, setRestoringId] = useState(null)
  const [search, setSearch] = useState('')
  const [genreFilter, setGenreFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [viewMode, setViewMode] = useState('table') // 'table' or 'grid'

  const [selectedMovie, setSelectedMovie] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [users, setUsers] = useState([])

  const load = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/movies`)
      // Backend now returns genres as array, no need to parse
      setMovies(res.data)
    } catch { setError('Lỗi tải dữ liệu') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const loadMovieDetail = useCallback(async (movie) => {
    setSelectedMovie(movie)
    setLoadingReviews(true)
    try {
      const [revRes, usrRes] = await Promise.all([
        axios.get(`${API}/reviews`),
        axios.get(`${API}/users`)
      ])
      setReviews(revRes.data.filter(r => String(r.movieId) === String(movie.id))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
      // API /api/users trả về Page<UserDto> có dạng { content: [...] }, cần lấy .content
      const usersData = usrRes.data
      setUsers(Array.isArray(usersData) ? usersData : (usersData?.content ?? []))
    } catch { setReviews([]) }
    finally { setLoadingReviews(false) }
  }, [])

  const getUserName = (userId) => {
    const u = users.find(u => String(u.id) === String(userId))
    return u ? (u.fullName || u.username) : `#${String(userId).slice(-4)}`
  }

  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : null;

  const handleOpenAdd = () => {
    setForm(EMPTY_FORM); setEditingId(null); setError(''); setFieldErrors({}); setShowModal(true)
  }
  const handleOpenEdit = (movie, e) => {
    e.stopPropagation()
    const movieData = {
      ...movie,
      genres: movie.genres || (movie.genre ? [movie.genre] : ['Hành động']),
      posterFile: null
    }
    setForm(movieData); setEditingId(movie.id); setError(''); setFieldErrors({}); setShowModal(true)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    // Xoá lỗi của field khi user bắt đầu sửa
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleGenreChange = (genre) => {
    const currentGenres = form.genres || []
    if (currentGenres.includes(genre)) {
      setForm(prev => ({ ...prev, genres: currentGenres.filter(g => g !== genre) }))
    } else {
      setForm(prev => ({ ...prev, genres: [...currentGenres, genre] }))
    }
    // Xoá lỗi genres khi user chọn
    if (fieldErrors.genres) setFieldErrors(prev => ({ ...prev, genres: '' }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('❌ Vui lòng chọn file ảnh hợp lệ.')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('❌ Kích thước file không được vượt quá 5MB.')
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_WIDTH = 400
          const MAX_HEIGHT = 600
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }
          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
          setForm(prev => ({ ...prev, poster: dataUrl, posterFile: file }))
        }
        img.src = event.target.result
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')

    // ── Validate tất cả fields cùng lúc và hiển thị inline ──
    const errs = {}
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Tên phim
    const title = form.title?.trim() || ''
    if (!title) {
      errs.title = 'Tên phim không được để trống.'
    } else if (title.length < 4) {
      errs.title = 'Tên phim phải có ít nhất 4 ký tự.'
    } else if (title.length > 50) {
      errs.title = 'Tên phim không được quá 50 ký tự.'
    } else {
      // Kiểm tra tên phim trùng (bỏ qua chính nó khi edit)
      const duplicate = movies.find(m => 
        m.title.trim().toLowerCase() === title.toLowerCase() && 
        String(m.id) !== String(editingId)
      )
      if (duplicate) {
        errs.title = `Tên phim đã tồn tại. Vui lòng chọn tên khác.`
      }
    }

    // Thể loại
    if (!form.genres || form.genres.length === 0) {
      errs.genres = 'Vui lòng chọn ít nhất một thể loại.'
    }

    // Thời lượng
    if (!form.duration && form.duration !== 0) {
      errs.duration = 'Thời lượng không được để trống.'
    } else {
      const duration = parseInt(form.duration)
      if (isNaN(duration) || duration <= 0) {
        errs.duration = 'Thời lượng phải là số dương.'
      } else if (duration > 500) {
        errs.duration = 'Thời lượng không hợp lệ (tối đa 500 phút).'
      }
    }

    // URL Poster — bắt buộc (trừ khi đã upload file)
    if (!form.poster || !form.poster.trim()) {
      errs.poster = 'URL poster không được để trống.'
    } else if (!form.poster.startsWith('data:')) {
      try { new URL(form.poster) } catch { errs.poster = 'URL poster không hợp lệ (phải bắt đầu bằng https://).'; }
    }

    // Bỏ validation ngày khởi chiếu - không bắt buộc nữa

    // Đạo diễn — bắt buộc
    if (!form.director?.trim()) {
      errs.director = 'Tên đạo diễn không được để trống.'
    } else if (form.director.trim().length > 200) {
      errs.director = 'Tên đạo diễn không được quá 200 ký tự.'
    }

    // Diễn viên — bắt buộc
    if (!form.cast?.trim()) {
      errs.cast = 'Danh sách diễn viên không được để trống.'
    } else if (form.cast.trim().length > 500) {
      errs.cast = 'Danh sách diễn viên không được quá 500 ký tự.'
    }

    // URL Trailer — bắt buộc + hợp lệ
    if (!form.trailerUrl?.trim()) {
      errs.trailerUrl = 'URL trailer không được để trống.'
    } else {
      try { new URL(form.trailerUrl) } catch { errs.trailerUrl = 'URL trailer không hợp lệ (phải bắt đầu bằng https://).'; }
    }

    // Mô tả — bắt buộc
    if (!form.description?.trim()) {
      errs.description = 'Mô tả không được để trống.'
    } else if (form.description.trim().length > 1000) {
      errs.description = `Mô tả không được quá 1000 ký tự (hiện tại: ${form.description.trim().length}).`
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      
      // Scroll đến field lỗi đầu tiên
      setTimeout(() => {
        const firstErrorField = document.querySelector('.field-invalid')
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
          firstErrorField.focus()
        }
      }, 100)
      
      return
    }
    setFieldErrors({})

    setSaving(true)
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        rating: editingId ? parseFloat(form.rating || 0) : 0.0,
        duration: parseInt(form.duration),
        director: form.director?.trim() || '',
        cast: form.cast?.trim() || '',
        description: form.description?.trim() || '',
        poster: form.poster?.trim() || '',
        genres: form.genres
      }

      if (editingId) {
        await axios.put(`${API}/movies/${editingId}`, payload)
      } else {
        await axios.post(`${API}/movies`, payload)
      }
      setShowModal(false); load()
      if (selectedMovie && String(selectedMovie.id) === String(editingId)) {
        setSelectedMovie({ ...selectedMovie, ...payload })
      }
    } catch (err) {
      setError('Lưu thất bại. Vui lòng thử lại.')
      console.error('Save error:', err)
    }
    finally { setSaving(false) }
  }

  const handleToggleReviewVisibility = async (reviewId, isHidden) => {
    try {
      const review = reviews.find(r => r.id === reviewId)
      await axios.put(`${API}/reviews/${reviewId}`, {
        ...review,
        hidden: !isHidden
      })
      setReviews(reviews.map(r =>
        r.id === reviewId ? { ...r, hidden: !isHidden } : r
      ))
    } catch {
      setError('Cập nhật trạng thái đánh giá thất bại.')
    }
  }

  const handleDeleteClick = async (id, e) => {
    e.stopPropagation()
    setDeletingId(id)
    setError('')
    try {
      const res = await axios.get(`${API}/movies/${id}/check-delete`)
      const { status, message } = res.data
      setDeleteMessage(message)
      if (status === 'BLOCKED') {
        setShowBlockModal(true)
      } else if (status === 'HIDE') {
        setShowHideModal(true)
      } else {
        setShowDeleteConfirm(true)
      }
    } catch (err) {
      setError('Lỗi khi kiểm tra dữ liệu xóa phim.')
    }
  }

  const handleConfirmDelete = async () => {
    try {
      const res = await axios.delete(`${API}/movies/${deletingId}`)
      setShowDeleteConfirm(false)
      setShowHideModal(false)
      if (selectedMovie && String(selectedMovie.id) === String(deletingId)) setSelectedMovie(null)
      load()
    } catch { setError('Xóa/Ẩn thất bại.') }
  }

  const handleRestoreClick = (m, e) => {
    e.stopPropagation()
    setRestoringId(m.id)
    setShowRestoreConfirm(true)
  }

  const handleConfirmRestore = async () => {
    setError('')
    try {
      await axios.put(`${API}/movies/${restoringId}`, { status: 'ACTIVE' })
      load()
      setShowRestoreConfirm(false)
    } catch {
      setShowRestoreConfirm(false)
      setError('Khôi phục thất bại.')
    }
  }

  const filtered = movies.filter(m => {
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase())

    const matchGenre = !genreFilter ||
      (m.genres && m.genres.includes(genreFilter)) ||
      m.genre === genreFilter

    const matchStatus = !statusFilter || (m.status || 'ACTIVE') === statusFilter

    return matchSearch && matchGenre && matchStatus
  })

  const totalMovies = movies.length
  const avgMovieRating = totalMovies > 0
    ? (movies.reduce((sum, m) => sum + (parseFloat(m.rating) || 0), 0) / totalMovies).toFixed(1)
    : '0'
  const totalDuration = movies.reduce((sum, m) => sum + (parseInt(m.duration) || 0), 0)
  const hours = Math.floor(totalDuration / 60)
  const minutes = totalDuration % 60

  return (
    <div className="page-wrapper">
      
      <div className="page-header-banner py-4">
        <Container>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="fw-bold mb-1"> Quản lý Phim</h1>
              <p className="text-muted mb-0">Quản lý thông tin phim, suất chiếu và đánh giá từ khán giả</p>
            </div>
            <Button id="add-movie-btn" className="btn-primary-custom" onClick={handleOpenAdd}>
              ➕ Thêm phim mới
            </Button>
          </div>
        </Container>
      </div>

      <Container className="py-4">
        
        <Row className="admin-stats-row g-3">
          <Col xs={12} md={4}>
            <div className="admin-stat-card-custom">
              <div className="stat-card-icon primary">🎬</div>
              <div className="stat-card-value">{totalMovies}</div>
              <div className="stat-card-label">Tổng số phim</div>
            </div>
          </Col>
          <Col xs={12} md={4}>
            <div className="admin-stat-card-custom">
              <div className="stat-card-icon secondary">⭐</div>
              <div className="stat-card-value">{avgMovieRating}</div>
              <div className="stat-card-label">Rating trung bình</div>
            </div>
          </Col>
          {/* Bỏ stat card Tổng thời lượng */}
          <Col xs={12} md={4}>
            <div className="admin-stat-card-custom">
              <div className="stat-card-icon primary">📊</div>
              <div className="stat-card-value">{GENRES.length}</div>
              <div className="stat-card-label">Thể loại</div>
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
                      placeholder="Tìm kiếm phim theo tên..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      id="admin-movie-search"
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small text-muted">Thể loại</Form.Label>
                  <Form.Select
                    className="filter-input"
                    value={genreFilter}
                    onChange={e => setGenreFilter(e.target.value)}
                  >
                    <option value="">Tất cả thể loại</option>
                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label className="small text-muted">Trạng thái</Form.Label>
                  <Form.Select
                    className="filter-input"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                  >
                    <option value="">Tất cả</option>
                    <option value="ACTIVE">Đang hoạt động</option>
                    <option value="INACTIVE">Đã ẩn</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small text-muted">Chế độ xem</Form.Label>
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
                        Bảng
                      </ToggleButton>
                      <ToggleButton
                        id="grid-view"
                        value="grid"
                        variant="outline-light"
                      >
                        ⊞ Lưới
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </div>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        
        <Row className="g-4">
          
          <Col xs={12}>
            {loading ? (
              <div className="loading-spinner-wrapper">
                <div className="loading-spinner"></div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🎬</div>
                <div className="empty-state-title">Không tìm thấy phim nào</div>
                <div className="empty-state-text">
                  {search || genreFilter
                    ? 'Thử thay đổi bộ lọc hoặc tìm kiếm từ khóa khác'
                    : 'Bắt đầu bằng cách thêm phim mới'}
                </div>
                {!search && !genreFilter && (
                  <Button className="btn-primary-custom" onClick={handleOpenAdd}>
                    ➕ Thêm phim đầu tiên
                  </Button>
                )}
              </div>
            ) : viewMode === 'table' ? (
              /* ── Table View ── */
              <Card className="table-card">
                <Card.Body className="p-0">
                  <div className="table-responsive">
                    <Table className="admin-table modern-table" hover responsive>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Poster</th>
                          <th>Tên phim</th>
                          <th>Thể loại</th>
                          <th>Rating</th>
                          <th>Thời lượng</th>
                          <th>Độ tuổi</th>
                          <th>Trạng thái</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((m, i) => (
                          <tr key={m.id} className="table-row-hover">
                            <td className="text-muted">{i + 1}</td>
                            <td>
                              <img
                                src={m.poster}
                                alt={m.title}
                                className="movie-table-poster"
                                onError={e => e.target.src = 'https://via.placeholder.com/45x65?text=?'}
                              />
                            </td>
                            <td>
                              <div className="movie-cell">
                                <strong>{m.title}</strong>
                              </div>
                              <small className="text-muted">{m.director}</small>
                            </td>
                            <td>
                              {(m.genres && m.genres.length > 0) ? (
                                <div className="genres-badges">
                                  {m.genres.slice(0, 2).map((genre, idx) => (
                                    <Badge key={idx} bg="secondary" className="time-badge me-1 mb-1">
                                      {genre}
                                    </Badge>
                                  ))}
                                  {m.genres.length > 2 && (
                                    <Badge bg="secondary" className="time-badge" style={{ opacity: 0.7 }}>
                                      +{m.genres.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <Badge bg="secondary" className="time-badge">{m.genre}</Badge>
                              )}
                            </td>
                            <td>
                              <span className="price-cell">⭐ {m.rating}</span>
                            </td>
                            <td className="text-light">{m.duration} phút</td>
                            <td>
                              <Badge bg="info" className="time-badge">{m.ageRating}</Badge>
                            </td>
                            <td>
                              <Badge bg={m.status === 'INACTIVE' ? 'secondary' : 'success'}>
                                {m.status === 'INACTIVE' ? 'Đã ẩn' : 'Đang hoạt động'}
                              </Badge>
                            </td>
                            <td>
                              <div className="action-buttons">
                                <Button
                                  size="sm"
                                  variant="outline-info"
                                  className="action-btn me-1"
                                  onClick={() => loadMovieDetail(m)}
                                  title="Xem chi tiết"
                                >
                                  👁️
                                </Button>
                                  <Button
                                    size="sm"
                                    variant="outline-primary"
                                    className="action-btn me-1"
                                    onClick={(e) => handleOpenEdit(m, e)}
                                    title="Sửa"
                                  >
                                    ✏️
                                  </Button>
                                  {m.status === 'INACTIVE' ? (
                                    <Button
                                      size="sm"
                                      variant="outline-success"
                                      className="action-btn"
                                      onClick={(e) => handleRestoreClick(m, e)}
                                      title="Khôi phục"
                                    >
                                      🔄
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant={m.canBeDeleted ? "outline-danger" : "outline-warning"}
                                      className="action-btn"
                                      onClick={(e) => handleDeleteClick(m.id, e)}
                                      title={m.canBeDeleted ? "Xóa" : "Ẩn phim"}
                                    >
                                      {m.canBeDeleted ? "🗑️" : "🙈"}
                                    </Button>
                                  )}
                                </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            ) : (
              /* ── Grid View ── */
              <div className="movies-grid">
                {filtered.map((m, i) => (
                  <div key={m.id} className="movie-grid-card">
                    <div className="movie-grid-poster-wrapper">
                      <img
                        src={m.poster}
                        alt={m.title}
                        className="movie-grid-poster"
                        onError={e => e.target.src = 'https://via.placeholder.com/220x300?text=?'}
                      />
                      <div className="movie-grid-overlay">
                        <div className="movie-grid-actions">
                          <button
                            className="movie-grid-action-btn view"
                            onClick={() => loadMovieDetail(m)}
                          >
                            👁️ Chi tiết
                          </button>
                          <button
                            className="movie-grid-action-btn edit"
                            onClick={(e) => handleOpenEdit(m, e)}
                          >
                            ✏️ Sửa
                          </button>
                          {m.status === 'INACTIVE' ? (
                            <button
                              className="movie-grid-action-btn view"
                              style={{ backgroundColor: 'rgba(25, 135, 84, 0.9)' }}
                              onClick={(e) => handleRestoreClick(m, e)}
                            >
                              🔄 Khôi phục
                            </button>
                          ) : (
                            <button
                              className="movie-grid-action-btn delete"
                              style={m.canBeDeleted ? {} : { backgroundColor: 'rgba(255, 193, 7, 0.9)' }}
                              onClick={(e) => handleDeleteClick(m.id, e)}
                            >
                              {m.canBeDeleted ? "🗑️ Xóa" : "🙈 Ẩn"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="movie-grid-info">
                      <div className="movie-grid-title" title={m.title}>{m.title}</div>
                      <div className="movie-grid-meta">
                        <span className="movie-grid-rating">⭐ {m.rating}</span>
                        <span className="movie-grid-duration">{m.duration} phút</span>
                      </div>
                      <div className="movie-grid-badges">
                        {(m.genres && m.genres.length > 0) ? (
                          m.genres.slice(0, 2).map((genre, idx) => (
                            <span key={idx} className="movie-detail-badge genre">{genre}</span>
                          ))
                        ) : (
                          <span className="movie-detail-badge genre">{m.genre}</span>
                        )}
                        <span className="movie-detail-badge age">{m.ageRating}</span>
                        <span className={`movie-detail-badge ${m.status === 'INACTIVE' ? 'genre' : 'rating'}`}>{m.status === 'INACTIVE' ? 'Đã ẩn' : 'Đang hoạt động'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Col>
        </Row>
      </Container>

      
      <Modal
        show={!!selectedMovie}
        onHide={() => setSelectedMovie(null)}
        size="lg"
        centered
        className="movie-detail-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            🎬 Chi tiết phim: {selectedMovie?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedMovie && (
            <div className="movie-detail-content">
              
              <div className="movie-detail-poster-section">
                <img
                  src={selectedMovie.poster}
                  alt={selectedMovie.title}
                  className="movie-detail-poster"
                  onError={e => e.target.src = 'https://via.placeholder.com/120x170?text=?'}
                />
                <div className="movie-detail-info">
                  <h5 className="movie-detail-title">{selectedMovie.title}</h5>
                  <div className="movie-detail-badges">
                    {(selectedMovie.genres && selectedMovie.genres.length > 0) ? (
                      selectedMovie.genres.map((genre, idx) => (
                        <span key={idx} className="movie-detail-badge genre">{genre}</span>
                      ))
                    ) : (
                      <span className="movie-detail-badge genre">{selectedMovie.genre}</span>
                    )}
                    <span className="movie-detail-badge age">{selectedMovie.ageRating}</span>
                    <span className="movie-detail-badge rating">⭐ {selectedMovie.rating}/10</span>
                  </div>
                  <div className="movie-detail-meta-list">
                    <div className="movie-detail-meta-item">
                      <span className="movie-detail-meta-icon">⏱️</span>
                      <span>{selectedMovie.duration} phút</span>
                    </div>
                    <div className="movie-detail-meta-item">
                      <span className="movie-detail-meta-icon">🌐</span>
                      <span>{selectedMovie.language}</span>
                    </div>
                    <div className="movie-detail-meta-item">
                      <span className="movie-detail-meta-icon">🎥</span>
                      <span>{selectedMovie.director}</span>
                    </div>
                    <div className="movie-detail-meta-item">
                      <span className="movie-detail-meta-icon">🎭</span>
                      <span>{selectedMovie.cast}</span>
                    </div>
                    <div className="movie-detail-meta-item">
                      <span className="movie-detail-meta-icon">📅</span>
                      <span>Khởi chiếu: {selectedMovie.releaseDate}</span>
                    </div>
                    {selectedMovie.trailerUrl && (
                      <div className="movie-detail-meta-item">
                        <span className="movie-detail-meta-icon">🎬</span>
                        <a
                          href={selectedMovie.trailerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="trailer-link"
                        >
                          ▶️ Xem Trailer
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              
              {selectedMovie.description && (
                <div className="movie-detail-description">
                  <h6>📝 Mô tả</h6>
                  <p>{selectedMovie.description}</p>
                </div>
              )}

              
              <div className="movie-detail-reviews">
                <div className="movie-detail-section-title">
                  <span>💬 Đánh giá của khán giả</span>
                  {avgRating && (
                    <span className="review-summary">
                      ⭐ {avgRating}/5 ({reviews.length})
                    </span>
                  )}
                </div>

                {loadingReviews ? (
                  <div className="text-center py-3">
                    <div className="loading-spinner" style={{ width: 32, height: 32 }}></div>
                  </div>
                ) : reviews.length === 0 ? (
                  <p className="review-empty">Chưa có đánh giá nào cho phim này.</p>
                ) : (
                  <div>
                    {reviews.map(r => (
                      <div key={r.id} className="review-card">
                        <div className="review-header">
                          <div className="review-user">
                            <div className="review-avatar">
                              {getUserName(r.userId).charAt(0).toUpperCase()}
                            </div>
                            <div className="review-user-info">
                              <span className="review-user-name">{getUserName(r.userId)}</span>
                              <div className="review-stars">
                                <StarDisplay value={r.rating} />
                              </div>
                            </div>
                          </div>
                          <span className="review-date">{r.createdAt}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mt-2">
                          <p className="review-comment mb-0" style={{ flex: 1, marginRight: '1rem', fontStyle: r.hidden ? 'italic' : 'normal', color: r.hidden ? '#888' : 'inherit' }}>
                            {r.hidden ? '[Nội dung đã bị ẩn]' : `"${r.comment}"`}
                          </p>
                          <Button
                            variant={r.hidden ? "outline-success" : "outline-warning"}
                            size="sm"
                            onClick={() => handleToggleReviewVisibility(r.id, r.hidden)}
                            title={r.hidden ? "Hiển thị bình luận" : "Ẩn bình luận"}
                          >
                            {r.hidden ? '👁️ Hiện' : '🙈 Ẩn'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSelectedMovie(null)}>
            Đóng
          </Button>
          {selectedMovie && (
            <Button
              variant="primary"
              onClick={(e) => {
                handleOpenEdit(selectedMovie, e)
                setSelectedMovie(null)
              }}
            >
              Chỉnh sửa phim
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
        className="admin-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editingId ? 'Chỉnh sửa phim' : ' Thêm phim mới'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave} noValidate>
          <Modal.Body>
            {/* Lỗi API server (không phải validation field) */}
            {error && (
              <div className="field-error-banner">
                ⚠️ {error}
              </div>
            )}

            {/* ── Thông tin cơ bản ── */}
            <div className="form-section-title">
              <span>📋</span> Thông tin cơ bản
            </div>

            {/* Tên phim */}
            <div className="form-group-custom">
              <label className="form-label-custom">
                Tên phim <span className="required">*</span>
              </label>
              <input
                type="text"
                className={`form-input-custom${fieldErrors.title ? ' field-invalid' : ''}`}
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Nhập tên phim..."
              />
              {fieldErrors.title && (
                <div className="field-error-msg">⚠ {fieldErrors.title}</div>
              )}
            </div>

            {/* Thể loại phim */}
            <div className="form-group-custom">
              <label className="form-label-custom">Thể loại phim <span className="required">*</span></label>
              <div className={`genres-selection${fieldErrors.genres ? ' field-invalid-box' : ''}`}>
                {GENRES.map(genre => (
                  <div key={genre} className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`genre-${genre}`}
                      checked={(form.genres || []).includes(genre)}
                      onChange={() => handleGenreChange(genre)}
                    />
                    <label className="form-check-label" htmlFor={`genre-${genre}`}>
                      {genre}
                    </label>
                  </div>
                ))}
              </div>
              {fieldErrors.genres
                ? <div className="field-error-msg">⚠ {fieldErrors.genres}</div>
                : <small className="form-text text-muted">Chọn một hoặc nhiều thể loại phù hợp với phim</small>
              }
            </div>

            {/* Thời lượng */}
            <div className="row g-3 mb-2">
              <div className="col-md-6">
                <label className="form-label-custom">
                  Thời lượng (phút) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  className={`form-input-custom${fieldErrors.duration ? ' field-invalid' : ''}`}
                  name="duration"
                  value={form.duration}
                  onChange={handleChange}
                  placeholder="120"
                  min={1}
                  max={500}
                />
                {fieldErrors.duration && (
                  <div className="field-error-msg">⚠ {fieldErrors.duration}</div>
                )}
              </div>
            </div>

            {/* ── Poster phim ── */}
            <div className="form-section-title" style={{ marginTop: '1rem' }}>
              <span>🖼️</span> Poster phim
            </div>

            <div className="row g-3 mb-2">
              <div className="col-md-6">
                <label className="form-label-custom">URL Poster <span className="required">*</span></label>
                <input
                  type="text"
                  className={`form-input-custom${fieldErrors.poster ? ' field-invalid' : ''}`}
                  name="poster"
                  value={form.poster}
                  onChange={handleChange}
                  placeholder="https://example.com/poster.jpg"
                />
                {fieldErrors.poster
                  ? <div className="field-error-msg">⚠ {fieldErrors.poster}</div>
                  : <small className="form-text text-muted">Nhập URL ảnh poster từ internet (bắt buộc nếu không upload file)</small>
                }
              </div>
              <div className="col-md-6">
                <label className="form-label-custom">Hoặc tải ảnh từ máy tính</label>
                <input
                  type="file"
                  className="form-input-custom"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <small className="form-text text-muted">Chọn file ảnh (tối đa 5MB)</small>
              </div>
            </div>

            {form.poster && (
              <div className="poster-preview mb-3">
                <label className="form-label-custom">Xem trước poster:</label>
                <div className="poster-preview-container">
                  <img
                    src={form.poster}
                    alt="Poster preview"
                    className="poster-preview-image"
                    style={{ maxWidth: '200px', maxHeight: '300px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #ddd' }}
                    onError={e => e.target.src = 'https://via.placeholder.com/200x300?text=Lỗi+ảnh'}
                  />
                </div>
              </div>
            )}

            {/* ── Thông tin chi tiết ── */}
            <div className="form-section-title" style={{ marginTop: '1rem' }}>
              <span>🎬</span> Thông tin chi tiết
            </div>

            <div className="row g-3 mb-2">
              <div className="col-md-6">
                <label className="form-label-custom">Ngôn ngữ</label>
                <input
                  type="text"
                  className="form-input-custom"
                  name="language"
                  value={form.language}
                  onChange={handleChange}
                  placeholder="Tiếng Anh"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label-custom">Độ tuổi</label>
                <select className="form-input-custom" name="ageRating" value={form.ageRating} onChange={handleChange}>
                  {AGE_RATINGS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              {/* Bỏ field Ngày khởi chiếu */}
            </div>

            <div className="row g-3 mb-2">
              <div className="col-md-6">
                <label className="form-label-custom">Đạo diễn <span className="required">*</span></label>
                <input
                  type="text"
                  className={`form-input-custom${fieldErrors.director ? ' field-invalid' : ''}`}
                  name="director"
                  value={form.director}
                  onChange={handleChange}
                  placeholder="Tên đạo diễn..."
                />
                {fieldErrors.director && (
                  <div className="field-error-msg">⚠ {fieldErrors.director}</div>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label-custom">Diễn viên <span className="required">*</span></label>
                <input
                  type="text"
                  className={`form-input-custom${fieldErrors.cast ? ' field-invalid' : ''}`}
                  name="cast"
                  value={form.cast}
                  onChange={handleChange}
                  placeholder="Diễn viên 1, Diễn viên 2, ..."
                />
                {fieldErrors.cast && (
                  <div className="field-error-msg">⚠ {fieldErrors.cast}</div>
                )}
              </div>
            </div>

            <div className="form-group-custom">
              <label className="form-label-custom">URL Trailer <span className="required">*</span></label>
              <input
                type="url"
                className={`form-input-custom${fieldErrors.trailerUrl ? ' field-invalid' : ''}`}
                name="trailerUrl"
                value={form.trailerUrl}
                onChange={handleChange}
                placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
              />
              {fieldErrors.trailerUrl
                ? <div className="field-error-msg">⚠ {fieldErrors.trailerUrl}</div>
                : <small className="form-text text-muted">Nhập link YouTube trailer để người dùng có thể xem trailer trực tiếp</small>
              }
            </div>

            <div className="form-group-custom">
              <label className="form-label-custom">Mô tả <span className="required">*</span></label>
              <textarea
                className={`form-input-custom${fieldErrors.description ? ' field-invalid' : ''}`}
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Nội dung phim..."
                rows={3}
              />
              {fieldErrors.description
                ? <div className="field-error-msg">⚠ {fieldErrors.description}</div>
                : <small className="form-text text-muted">{(form.description || '').length}/1000 ký tự</small>
              }
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} style={{ borderRadius: '8px' }}>
              Hủy
            </Button>
            <Button
              id="save-movie-btn"
              type="submit"
              className="btn-primary-custom"
              disabled={saving}
              style={{ borderRadius: '8px' }}
            >
              {saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Đang lưu...</> : (editingId ? 'Lưu thay đổi' : 'Thêm phim')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered className="delete-modal">
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xóa phim</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn muốn xóa bộ phim: <strong>{movies.find(m => m.id === deletingId)?.title}</strong></p>
          
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>
            Hành động này sẽ xóa vĩnh viễn dữ liệu phim khỏi hệ thống và không thể khôi phục.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} style={{ borderRadius: '8px' }}>
            Hủy
          </Button>
          <Button id="confirm-delete-movie-btn" variant="danger" onClick={handleConfirmDelete} style={{ borderRadius: '8px' }}>
            Xóa phim
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showHideModal} onHide={() => setShowHideModal(false)} centered className="delete-modal">
        <Modal.Header closeButton>
          <Modal.Title>Không thể xóa phim</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{deleteMessage}</p>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>
            Lý do:<br/>
            - Phim đã từng có suất chiếu.<br/>
            - Phim đã có lượt đánh giá từ người dùng.<br/>
            - Phim có liên quan đến lịch sử đặt vé và giao dịch.<br/>
            <br/>
            Để đảm bảo dữ liệu lịch sử và thống kê không bị mất, hệ thống sẽ chuyển phim sang trạng thái: <strong>NGỪNG HOẠT ĐỘNG</strong>.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHideModal(false)} style={{ borderRadius: '8px' }}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleConfirmDelete} style={{ borderRadius: '8px' }}>
            Ẩn
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showBlockModal} onHide={() => setShowBlockModal(false)} centered className="delete-modal">
        <Modal.Header closeButton>
          <Modal.Title>Không thể ẩn phim</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{deleteMessage}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBlockModal(false)} style={{ borderRadius: '8px' }}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showRestoreConfirm} onHide={() => setShowRestoreConfirm(false)} centered className="delete-modal">
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận khôi phục</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn muốn khôi phục hoạt động cho bộ phim:</p>
          <p><strong>{movies.find(m => m.id === restoringId)?.title}</strong></p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRestoreConfirm(false)} style={{ borderRadius: '8px' }}>
            Hủy
          </Button>
          <Button variant="success" onClick={handleConfirmRestore} style={{ borderRadius: '8px' }}>
            Khôi phục
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
