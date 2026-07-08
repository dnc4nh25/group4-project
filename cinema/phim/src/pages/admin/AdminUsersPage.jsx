import { useState, useEffect, useMemo } from 'react'
import { Container, Table, Button, Modal, Form, Alert, Spinner, Badge, Card, Row, Col, InputGroup } from 'react-bootstrap'
import axios from 'axios'
import { useAuth } from '../../contexts/AuthContext'
import './AdminUsersPage.css'
import './AdminCommon.css'
import './AdminProfessional.css'

const ROLES = ['user', 'admin']
const STATUS_OPTIONS = ['active', 'banned', 'pending']

export default function AdminUsersPage() {
  const { currentUser } = useAuth() // Lấy thông tin admin hiện tại
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [error, setError] = useState('')
  const [showPasswords, setShowPasswords] = useState({}) // State để track password visibility

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ 
    username: '', 
    password: '', 
    fullName: '', 
    email: '', 
    phone: '', 
    role: 'user', 
    status: 'active' 
  })
  const [saving, setSaving] = useState(false)

  const [showDelete, setShowDelete] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [showUserDetail, setShowUserDetail] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userBookings, setUserBookings] = useState([])
  const [loadingDetail, setLoadingDetail] = useState(false)

  const isEditingSelf = (userId) => currentUser && currentUser.id === userId
  const isDeletingSelf = (userId) => currentUser && currentUser.id === userId

  const load = async () => {
    setLoading(true)
    try {
      const res = await axios.get('http://localhost:8080/api/users')
      setUsers(res.data)
    } catch { setError('Lỗi tải dữ liệu') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleOpenAdd = () => {
    setForm({ 
      username: '', 
      password: '', 
      fullName: '', 
      email: '', 
      phone: '', 
      role: 'user', 
      status: 'active' 
    })
    setEditingId(null); setError(''); setShowModal(true)
  }
  const handleOpenEdit = (u) => {
    setForm({ 
      username: u.username, 
      password: u.password, 
      fullName: u.fullName, 
      email: u.email || '',
      phone: u.phone || '',
      role: u.role,
      status: u.status || 'active'
    })
    setEditingId(u.id); setError(''); setShowModal(true)
  }
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9]{10,11}$/
    return phoneRegex.test(phone)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!form.username?.trim()) {
      setError('Tên đăng nhập không được để trống.'); return
    }
    
    if (!form.password?.trim()) {
      setError('Mật khẩu không được để trống.'); return
    }
    
    if (!form.fullName?.trim()) {
      setError('Họ tên không được để trống.'); return
    }
    
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernameRegex.test(form.username.trim())) {
      setError('Tên đăng nhập phải từ 3-20 ký tự, chỉ chứa chữ, số và dấu gạch dưới.'); return
    }
    
    if (form.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.'); return
    }
    
    if (form.password.length > 50) {
      setError('Mật khẩu không được quá 50 ký tự.'); return
    }
    
    if (form.fullName.trim().length < 2) {
      setError('Họ tên phải có ít nhất 2 ký tự.'); return
    }
    
    if (form.fullName.trim().length > 100) {
      setError('Họ tên không được quá 100 ký tự.'); return
    }
    
    const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/
    if (!nameRegex.test(form.fullName.trim())) {
      setError('Họ tên chỉ được chứa chữ cái và khoảng trắng.'); return
    }
    
    if (!['user', 'admin'].includes(form.role)) {
      setError('Vai trò không hợp lệ.'); return
    }
    
    if (!['active', 'banned', 'pending'].includes(form.status)) {
      setError('Trạng thái không hợp lệ.'); return
    }
    
    setSaving(true)
    
    if (!form.username || !form.password || !form.fullName) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc (Tên đăng nhập, Mật khẩu, Họ tên).'); return
    }
    
    if (form.email && !validateEmail(form.email)) {
      setError('Email không hợp lệ.'); return
    }
    
    if (form.phone && !validatePhone(form.phone)) {
      setError('Số điện thoại phải có 10-11 chữ số.'); return
    }
    
    setSaving(true); setError('')
    try {
      const payload = {
        ...form,
        username: form.username.trim(),
        fullName: form.fullName.trim()
      }
      
      if (editingId) {
        // Update existing user
        if (form.email) {
          try {
            const emailCheck = await axios.get(`http://localhost:8080/api/users/email/${form.email}`)
            if (emailCheck.data && emailCheck.data.id !== editingId) {
              setError('Email đã được sử dụng bởi tài khoản khác.'); setSaving(false); return
            }
          } catch (err) {
            if (err.response?.status !== 404) throw err
          }
        }
        
        if (form.phone) {
          try {
            const phoneCheck = await axios.get(`http://localhost:8080/api/users/phone/${form.phone}`)
            if (phoneCheck.data && phoneCheck.data.id !== editingId) {
              setError('Số điện thoại đã được sử dụng bởi tài khoản khác.'); setSaving(false); return
            }
          } catch (err) {
            if (err.response?.status !== 404) throw err
          }
        }
        
        await axios.put(`http://localhost:8080/api/users/${editingId}`, form)
      } else {
        // Create new user
        try {
          await axios.get(`http://localhost:8080/api/users/username/${form.username.trim()}`)
          setError('❌ Tên đăng nhập đã tồn tại.'); setSaving(false); return
        } catch (err) {
          if (err.response?.status !== 404) throw err
        }
        
        if (form.email) {
          try {
            await axios.get(`http://localhost:8080/api/users/email/${form.email}`)
            setError('Email đã được sử dụng.'); setSaving(false); return
          } catch (err) {
            if (err.response?.status !== 404) throw err
          }
        }
        
        if (form.phone) {
          try {
            await axios.get(`http://localhost:8080/api/users/phone/${form.phone}`)
            setError('Số điện thoại đã được sử dụng.'); setSaving(false); return
          } catch (err) {
            if (err.response?.status !== 404) throw err
          }
        }
        
        await axios.post('http://localhost:8080/api/users', payload)
      }
      setShowModal(false); load()
    } catch (err) { 
      setError('❌ Lưu thất bại. Vui lòng thử lại.')
      console.error('Save error:', err)
    }
    finally { setSaving(false) }
  }

  const handleDeleteClick = (id) => { setDeletingId(id); setShowDelete(true) }
  const handleConfirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:8080/api/users/${deletingId}`)
      setShowDelete(false); load()
    } catch { setError('Xóa thất bại.') }
  }

  const handleViewDetail = async (user) => {
    setSelectedUser(user)
    setLoadingDetail(true)
    setShowUserDetail(true)
    try {
      const bookingsRes = await axios.get('http://localhost:8080/api/bookings')
      const userBookingsData = bookingsRes.data.filter(b => b.userId === user.id)
      
      const enriched = await Promise.all(userBookingsData.map(async (b) => {
        const stRes = await axios.get(`http://localhost:8080/api/showtimes/${b.showtimeId}`).catch(() => ({ data: null }))
        let movie = null
        if (stRes.data?.movieId) {
          const mvRes = await axios.get(`http://localhost:8080/api/movies/${stRes.data.movieId}`).catch(() => ({ data: null }))
          movie = mvRes.data
        }
        return { ...b, showtime: stRes.data, movie }
      }))
      
      setUserBookings(enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
    } catch (err) {
      console.error('Error loading user bookings:', err)
    }
    finally {
      setLoadingDetail(false)
    }
  }

  const getUserStats = (userId) => {
    const userBookingsData = userBookings.filter(b => b.userId === userId)
    const totalSpent = userBookingsData.reduce((sum, b) => sum + (b.totalPrice || 0), 0)
    const totalBookings = userBookingsData.length
    return { totalSpent, totalBookings }
  }

  const incompleteUsers = useMemo(() => {
    return users.filter(u => !u.email || !u.phone)
  }, [users])

  const missingEmailUsers = useMemo(() => {
    return users.filter(u => !u.email)
  }, [users])

  const missingPhoneUsers = useMemo(() => {
    return users.filter(u => !u.phone)
  }, [users])

  const filtered = users.filter(u => {
    const matchSearch = u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.fullName?.toLowerCase().includes(search.toLowerCase())
    const matchRole = !filterRole || u.role === filterRole
    const matchStatus = !filterStatus || (u.status || 'active') === filterStatus
    return matchSearch && matchRole && matchStatus
  })

  const togglePasswordVisibility = (userId) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }))
  }

  const clearFilters = () => {
    setSearch('')
    setFilterRole('')
    setFilterStatus('')
  }

  const hasActiveFilters = search || filterRole || filterStatus

  const getRoleBadge = (role) => {
    if (role === 'admin') {
      return <Badge className="badge-enhanced bg-warning"><span className="role-icon">👑</span> Admin</Badge>
    }
    return <Badge className="badge-enhanced bg-secondary"><span className="role-icon">👤</span> User</Badge>
  }

  const getStatusBadge = (status) => {
    const s = status || 'active'
    switch (s) {
      case 'active': return <Badge className="badge-enhanced bg-success"><span className="status-dot"></span> Active</Badge>
      case 'banned': return <Badge className="badge-enhanced bg-danger"><span className="status-dot"></span> Banned</Badge>
      case 'pending': return <Badge className="badge-enhanced bg-warning"><span className="status-dot"></span> Pending</Badge>
      default: return <Badge className="badge-enhanced bg-secondary"><span className="status-dot"></span> Unknown</Badge>
    }
  }

  return (
    <div className="page-wrapper">
      <div className="page-header-banner py-4">
        <Container>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h1 className="fw-bold mb-1">👥 Quản lý Người dùng</h1>
              <p className="text-muted mb-0">Xem, thêm, sửa, xóa tài khoản người dùng</p>
            </div>
            <Button 
              id="add-user-btn" 
              className="btn-primary-custom" 
              onClick={handleOpenAdd}
            >
              ➕ Thêm người dùng
            </Button>
          </div>
        </Container>
      </div>

      <Container className="py-4">
        {error && (
          <Alert className="alert-professional alert-danger" onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        )}

        
        <Card className="filter-card mb-4">
          <Card.Body>
            <div className="filter-header">
              <h6 className="filter-title mb-0">Bộ lọc tìm kiếm</h6>
              {hasActiveFilters && (
                <Button 
                  variant="link" 
                  size="sm" 
                  className="filter-clear-btn" 
                  onClick={clearFilters}
                >
                  🗑️ Xóa bộ lọc
                </Button>
              )}
            </div>
            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small text-muted">Tìm kiếm</Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="search-addon">🔍</InputGroup.Text>
                    <Form.Control 
                      type="text" 
                      placeholder="Tìm theo tên đăng nhập hoặc họ tên..." 
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      id="admin-user-search"
                      className="filter-input"
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small text-muted">Vai trò</Form.Label>
                  <Form.Select 
                    value={filterRole} 
                    onChange={e => setFilterRole(e.target.value)}
                    className="filter-input"
                  >
                    <option value="">Tất cả vai trò</option>
                    <option value="admin">👑 Admin</option>
                    <option value="user">👤 User</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small text-muted">Trạng thái</Form.Label>
                  <Form.Select 
                    value={filterStatus} 
                    onChange={e => setFilterStatus(e.target.value)}
                    className="filter-input"
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="active">✅ Active</option>
                    <option value="banned">❌ Banned</option>
                    <option value="pending">⏳ Pending</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        
        {incompleteUsers.length > 0 && (
          <Alert variant="warning" className="mb-4">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              <strong>Thông báo: Tài khoản chưa cập nhật đầy đủ thông tin</strong>
            </div>
            <div className="mb-2">
              Có <strong>{incompleteUsers.length}</strong> tài khoản chưa cập nhật đầy đủ thông tin liên hệ:
            </div>
            <Row className="g-3">
              {missingEmailUsers.length > 0 && (
                <Col md={6}>
                  <div className="d-flex align-items-center gap-2">
                    <Badge bg="danger" className="px-2 py-1">
                      📧 {missingEmailUsers.length}
                    </Badge>
                    <span>tài khoản chưa có email</span>
                  </div>
                </Col>
              )}
              {missingPhoneUsers.length > 0 && (
                <Col md={6}>
                  <div className="d-flex align-items-center gap-2">
                    <Badge bg="danger" className="px-2 py-1">
                      📱 {missingPhoneUsers.length}
                    </Badge>
                    <span>tài khoản chưa có số điện thoại</span>
                  </div>
                </Col>
              )}
            </Row>
            <div className="mt-3">
              <small className="text-muted">
                💡 Khuyến nghị: Liên hệ với người dùng để cập nhật thông tin liên hệ nhằm đảm bảo khả năng thông báo và hỗ trợ tốt nhất.
              </small>
            </div>
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-5">
            <Spinner variant="warning" />
            <div className="mt-3 text-muted">Đang tải dữ liệu...</div>
          </div>
        ) : (
          <Card className="table-card">
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table className="admin-table modern-table" hover responsive>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Người dùng</th>
                      <th>Email</th>
                      <th>Số điện thoại</th>
                      <th>Mật khẩu</th>
                      <th>Vai trò</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u, i) => (
                      <tr key={u.id} className="table-row-hover">
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
                              title={u.fullName || u.username}
                            >
                              {(u.fullName?.charAt(0) || u.username?.charAt(0) || 'U').toUpperCase()}
                            </div>
                            <div>
                              <div className="movie-cell">
                                <strong>{u.username}</strong>
                              </div>
                              <small className="text-muted">
                                {u.fullName}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="movie-cell">
                            <strong>{u.email || 'Chưa cập nhật'}</strong>
                          </div>
                        </td>
                        <td>
                          <div className="movie-cell">
                            <strong>{u.phone || 'Chưa cập nhật'}</strong>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <code className="password-inline-code px-2 py-1 rounded" style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                              {showPasswords[u.id] ? u.password : '••••••••'}
                            </code>
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              onClick={() => togglePasswordVisibility(u.id)}
                              title={showPasswords[u.id] ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              {showPasswords[u.id] ? '🙈' : '👁️'}
                            </Button>
                          </div>
                        </td>
                        <td>
                          {u.role === 'admin' ? (
                            <Badge bg="warning" className="time-badge">
                              👑 Admin
                            </Badge>
                          ) : (
                            <Badge bg="secondary" className="time-badge">
                              👤 User
                            </Badge>
                          )}
                        </td>
                        <td>
                          {(() => {
                            const status = u.status || 'active'
                            switch (status) {
                              case 'active':
                                return <Badge bg="success" className="status-badge status-success">✅ Active</Badge>
                              case 'banned':
                                return <Badge bg="danger" className="status-badge status-danger">❌ Banned</Badge>
                              case 'pending':
                                return <Badge bg="warning" className="status-badge status-warning">⏳ Pending</Badge>
                              default:
                                return <Badge bg="secondary" className="status-badge status-secondary">❓ Unknown</Badge>
                            }
                          })()}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <Button 
                              size="sm" 
                              variant="outline-primary" 
                              className="action-btn"
                              onClick={() => handleOpenEdit(u)}
                              title="Chỉnh sửa"
                            >
                              ✏️
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan="8" className="text-center py-5 text-muted">
                          <div className="empty-state">
                            <span className="empty-icon">📭</span>
                            <p>Không tìm thấy người dùng nào</p>
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

      
      <Modal show={showModal} onHide={() => setShowModal(false)} centered className="modal-professional">
        <Modal.Header closeButton>
          <Modal.Title>{editingId ? '✏️ Sửa người dùng' : '➕ Thêm người dùng mới'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave} className="admin-form-professional">
          <Modal.Body>
            {error && <Alert className="alert-professional alert-danger">{error}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>Tên đăng nhập <span style={{ color: 'var(--admin-danger)' }}>*</span></Form.Label>
              <Form.Control
                id="user-username" name="username" value={form.username}
                onChange={handleChange} placeholder="username" disabled={!!editingId}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mật khẩu <span style={{ color: 'var(--admin-danger)' }}>*</span></Form.Label>
              <Form.Control
                id="user-password" name="password" type="password"
                value={form.password} onChange={handleChange} placeholder="Nhập mật khẩu"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Họ tên <span style={{ color: 'var(--admin-danger)' }}>*</span></Form.Label>
              <Form.Control
                id="user-fullname" name="fullName" value={form.fullName}
                onChange={handleChange} placeholder="Nguyễn Văn A"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                id="user-email" name="email" type="email" value={form.email}
                onChange={handleChange} placeholder="example@email.com (tùy chọn)"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Số điện thoại</Form.Label>
              <Form.Control
                id="user-phone" name="phone" type="tel" value={form.phone}
                onChange={handleChange} placeholder="0123456789 (tùy chọn)"
              />
            </Form.Group>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Vai trò</Form.Label>
                  <Form.Select 
                    name="role" 
                    value={form.role} 
                    onChange={handleChange}
                    disabled={editingId && isEditingSelf(editingId)}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r === 'admin' ? '👑 Admin' : '👤 User'}</option>)}
                  </Form.Select>
                  {editingId && isEditingSelf(editingId) && (
                    <Form.Text className="text-muted">
                      Không thể thay đổi vai trò của chính mình
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Trạng thái</Form.Label>
                  <Form.Select 
                    name="status" 
                    value={form.status} 
                    onChange={handleChange}
                    disabled={editingId && isEditingSelf(editingId)}
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'active' ? '✅ Active' : s === 'banned' ? '❌ Banned' : '⏳ Pending'}</option>)}
                  </Form.Select>
                  {editingId && isEditingSelf(editingId) && (
                    <Form.Text className="text-muted">
                      Không thể thay đổi trạng thái của chính mình
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button className="btn-admin-professional btn-secondary" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button 
              id="save-user-btn" 
              type="submit" 
              className="btn-admin-professional btn-primary" 
              disabled={saving}
            >
              {saving ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Đang lưu...
                </>
              ) : (
                editingId ? 'Lưu thay đổi' : 'Thêm người dùng'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      
      <Modal show={showDelete} onHide={() => setShowDelete(false)} centered className="modal-professional">
        <Modal.Header closeButton>
          <Modal.Title>🗑️ Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ color: 'var(--admin-dark-text-primary)' }}>
            Bạn có chắc muốn xóa người dùng này? Thao tác không thể hoàn tác.
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button className="btn-admin-professional btn-secondary" onClick={() => setShowDelete(false)}>
            Hủy
          </Button>
          <Button 
            id="confirm-delete-user-btn" 
            className="btn-admin-professional btn-danger" 
            onClick={handleConfirmDelete}
          >
            🗑️ Xóa người dùng
          </Button>
        </Modal.Footer>
      </Modal>

      
      <Modal show={showUserDetail} onHide={() => setShowUserDetail(false)} centered size="lg" className="modal-professional">
        <Modal.Header closeButton>
          <Modal.Title>👤 Thông tin chi tiết người dùng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingDetail ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="warning" style={{ width: '2rem', height: '2rem' }} />
              <div className="mt-2">Đang tải thông tin...</div>
            </div>
          ) : selectedUser && (
            <>
              
              <div className="admin-card-professional mb-4">
                <div className="card-body">
                  <div className="d-flex align-items-center gap-3">
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: '64px',
                        height: '64px',
                        background: 'linear-gradient(135deg, var(--admin-dark-primary), var(--admin-dark-primary-dark))',
                        color: '#000',
                        fontWeight: '700',
                        fontSize: '1.5rem',
                        boxShadow: 'var(--admin-dark-shadow-md)'
                      }}
                    >
                      {(selectedUser.fullName?.charAt(0) || selectedUser.username?.charAt(0) || 'U').toUpperCase()}
                    </div>
                    <div>
                      <h5 style={{ color: 'var(--admin-dark-text-primary)', fontWeight: '700', marginBottom: '0.25rem' }}>
                        {selectedUser.fullName}
                      </h5>
                      <p style={{ color: 'var(--admin-dark-text-muted)', marginBottom: '0.5rem' }}>
                        @{selectedUser.username}
                      </p>
                      <div className="d-flex gap-2">
                        {selectedUser.role === 'admin' ? (
                          <Badge className="badge-admin-professional badge-warning">👑 Admin</Badge>
                        ) : (
                          <Badge className="badge-admin-professional badge-secondary">👤 User</Badge>
                        )}
                        {(() => {
                          const status = selectedUser.status || 'active'
                          switch (status) {
                            case 'active':
                              return <Badge className="badge-admin-professional badge-success">✅ Active</Badge>
                            case 'banned':
                              return <Badge className="badge-admin-professional badge-danger">❌ Banned</Badge>
                            case 'pending':
                              return <Badge className="badge-admin-professional badge-warning">⏳ Pending</Badge>
                            default:
                              return <Badge className="badge-admin-professional badge-secondary">❓ Unknown</Badge>
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              
              <Row className="g-3 mb-4">
                <Col md={6}>
                  <div className="admin-stat-professional">
                    <div className="stat-icon">🎟️</div>
                    <div className="stat-value">{getUserStats(selectedUser.id).totalBookings}</div>
                    <div className="stat-label">Tổng đơn đặt vé</div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="admin-stat-professional">
                    <div className="stat-icon">💰</div>
                    <div className="stat-value" style={{ color: 'var(--admin-dark-primary)' }}>
                      {getUserStats(selectedUser.id).totalSpent.toLocaleString()}đ
                    </div>
                    <div className="stat-label">Tổng chi tiêu</div>
                  </div>
                </Col>
              </Row>

              
              <div className="admin-card-professional">
                <div className="card-header">
                  <h6 style={{ margin: 0, color: 'var(--admin-dark-text-primary)' }}>📜 Lịch sử đặt vé</h6>
                </div>
                <div className="card-body">
                  {userBookings.length === 0 ? (
                    <div className="empty-state-professional">
                      <div className="empty-icon">🎫</div>
                      <div className="empty-title">Chưa có lịch sử đặt vé</div>
                      <div className="empty-text">Người dùng này chưa đặt vé nào</div>
                    </div>
                  ) : (
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {userBookings.slice(0, 10).map((b, idx) => (
                        <div 
                          key={idx} 
                          className="d-flex justify-content-between align-items-center py-2 border-bottom"
                          style={{ borderColor: 'var(--admin-border-light)' }}
                        >
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--admin-dark-text-primary)' }}>
                              {b.movie?.title || 'N/A'}
                            </div>
                            <small style={{ color: 'var(--admin-dark-text-muted)' }}>
                              {b.showtime?.date} • {b.showtime?.time} • {b.showtime?.room}
                            </small>
                          </div>
                          <div style={{ fontWeight: '700', color: 'var(--admin-dark-primary)' }}>
                            {b.totalPrice?.toLocaleString()}đ
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button className="btn-admin-professional btn-secondary" onClick={() => setShowUserDetail(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}