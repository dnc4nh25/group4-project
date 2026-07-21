import { useState, useEffect } from 'react'
import { Container, Card, Form, Button, Alert, Spinner, Row, Col, Badge } from 'react-bootstrap'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import './ProfilePage.css'

export default function ProfilePage() {
  const { currentUser, login } = useAuth()
  const [form, setForm] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // State riêng cho đổi mật khẩu
  const [showPasswordFields, setShowPasswordFields] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current: '', newPwd: '', confirm: '' })
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdError, setPwdError] = useState('')
  const [pwdSuccess, setPwdSuccess] = useState('')

  useEffect(() => {
    if (currentUser) {
      setForm({
        username: currentUser.username || '',
        fullName: currentUser.fullName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || ''
      })
    }
  }, [currentUser])

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9]{10,11}$/
    return phoneRegex.test(phone)
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.fullName || !form.email || !form.phone) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc.')
      return
    }

    if (!validateEmail(form.email)) {
      setError('Email không hợp lệ.')
      return
    }

    if (!validatePhone(form.phone)) {
      setError('Số điện thoại phải có 10-11 chữ số.')
      return
    }

    setLoading(true)
    try {
      // Check email exists (excluding current user)
      if (form.email && form.email !== currentUser.email) {
        try {
          const emailCheck = await axios.get(`http://localhost:8080/api/users/email/${form.email}`)
          if (emailCheck.data && emailCheck.data.id !== currentUser.id) {
            setError('Email đã được sử dụng bởi tài khoản khác.')
            setLoading(false)
            return
          }
        } catch (err) {
          if (err.response?.status !== 404) throw err
        }
      }

      // Check phone exists (excluding current user)
      if (form.phone && form.phone !== currentUser.phone) {
        try {
          const phoneCheck = await axios.get(`http://localhost:8080/api/users/phone/${form.phone}`)
          if (phoneCheck.data && phoneCheck.data.id !== currentUser.id) {
            setError('Số điện thoại đã được sử dụng bởi tài khoản khác.')
            setLoading(false)
            return
          }
        } catch (err) {
          if (err.response?.status !== 404) throw err
        }
      }

      const updateData = {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone
      }

      const response = await axios.put(`http://localhost:8080/api/users/${currentUser.id}`, updateData)
      login(response.data)
      setSuccess('Cập nhật thông tin thành công!')
    } catch (err) {
      setError('Có lỗi xảy ra khi cập nhật thông tin.')
    } finally {
      setLoading(false)
    }
  }

  // ─── Đổi mật khẩu riêng biệt ──────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPwdError('')
    setPwdSuccess('')

    if (!passwordForm.current) {
      setPwdError('Vui lòng nhập mật khẩu hiện tại.'); return
    }
    if (!passwordForm.newPwd || passwordForm.newPwd.length < 6) {
      setPwdError('Mật khẩu mới phải có ít nhất 6 ký tự.'); return
    }
    if (passwordForm.newPwd !== passwordForm.confirm) {
      setPwdError('Mật khẩu xác nhận không khớp.'); return
    }
    if (passwordForm.newPwd === passwordForm.current) {
      setPwdError('Mật khẩu mới phải khác mật khẩu hiện tại.'); return
    }

    setPwdLoading(true)
    try {
      await axios.post(`http://localhost:8080/api/users/${currentUser.id}/change-password`, {
        currentPassword: passwordForm.current,
        newPassword: passwordForm.newPwd
      })
      setPwdSuccess('✅ Đổi mật khẩu thành công!')
      setPasswordForm({ current: '', newPwd: '', confirm: '' })
      setShowPasswordFields(false)
    } catch (err) {
      if (err.response?.status === 401) {
        setPwdError('❌ Mật khẩu hiện tại không đúng.')
      } else {
        setPwdError('Có lỗi xảy ra. Vui lòng thử lại.')
      }
    } finally {
      setPwdLoading(false)
    }
  }

  const missingInfo = []
  if (!currentUser?.email) missingInfo.push('Email')
  if (!currentUser?.phone) missingInfo.push('Số điện thoại')

  return (
    <div className="profile-page">
      <Container className="profile-container">

        <div className="text-center mb-4">
          <div
            className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
            style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              color: '#000',
              fontWeight: '700',
              fontSize: '2rem'
            }}
          >
            {(currentUser?.fullName?.charAt(0) || currentUser?.username?.charAt(0) || 'U').toUpperCase()}
          </div>
          <h2 className="fw-bold text-light mb-1">👤 Thông tin cá nhân</h2>
          <p className="text-muted">Quản lý thông tin tài khoản của bạn</p>
        </div>


        {missingInfo.length > 0 && (
          <Alert variant="warning" className="mb-4">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              <strong>Thông tin tài khoản chưa đầy đủ</strong>
            </div>
            <div className="mb-2">
              Bạn chưa cập nhật: <strong>{missingInfo.join(', ')}</strong>
            </div>
            <small className="text-muted">
              💡 Vui lòng cập nhật đầy đủ thông tin để đảm bảo nhận được thông báo và hỗ trợ tốt nhất từ CinemaXP.
            </small>
          </Alert>
        )}


        <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <Card.Body className="p-4">
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Form onSubmit={handleSubmit}>

              <div className="mb-4">
                <h5 className="text-light mb-3 d-flex align-items-center gap-2">
                  📋 Thông tin cơ bản
                </h5>

                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="text-light">Tên đăng nhập</Form.Label>
                      <Form.Control
                        type="text"
                        value={form.username}
                        disabled
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-body)'
                        }}
                      />
                      <Form.Text className="text-muted">
                        Tên đăng nhập không thể thay đổi
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="text-light">
                        Họ và tên <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        name="fullName"
                        type="text"
                        placeholder="Nguyễn Văn A"
                        value={form.fullName}
                        onChange={handleChange}
                        required
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-light)'
                        }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>


              <div className="mb-4">
                <h5 className="text-light mb-3 d-flex align-items-center gap-2">
                  📞 Thông tin liên hệ
                </h5>

                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="text-light d-flex align-items-center gap-2">
                        Email <span className="text-danger">*</span>
                        {!currentUser?.email && (
                          <Badge bg="danger" className="px-2 py-1">Thiếu</Badge>
                        )}
                      </Form.Label>
                      <Form.Control
                        name="email"
                        type="email"
                        placeholder="example@email.com"
                        value={form.email}
                        onChange={handleChange}
                        required
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-light)'
                        }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="text-light d-flex align-items-center gap-2">
                        Số điện thoại <span className="text-danger">*</span>
                        {!currentUser?.phone && (
                          <Badge bg="danger" className="px-2 py-1">Thiếu</Badge>
                        )}
                      </Form.Label>
                      <Form.Control
                        name="phone"
                        type="tel"
                        placeholder="0123456789"
                        value={form.phone}
                        onChange={handleChange}
                        required
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-light)'
                        }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>


              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="text-light mb-0 d-flex align-items-center gap-2">
                    🔒 Bảo mật
                  </h5>
                  <Button
                    variant="outline-warning"
                    size="sm"
                    onClick={() => {
                      setShowPasswordFields(!showPasswordFields)
                      setPwdError('')
                      setPwdSuccess('')
                      setPasswordForm({ current: '', newPwd: '', confirm: '' })
                    }}
                  >
                    {showPasswordFields ? 'Hủy' : '🔑 Đổi mật khẩu'}
                  </Button>
                </div>

                {showPasswordFields && (
                  <div>
                    {pwdError && <Alert variant="danger" className="py-2">{pwdError}</Alert>}
                    {pwdSuccess && <Alert variant="success" className="py-2">{pwdSuccess}</Alert>}
                    <Row className="g-3 align-items-end">
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="text-light">Mật khẩu hiện tại</Form.Label>
                          <Form.Control
                            type="password"
                            placeholder="Nhập mật khẩu hiện tại"
                            value={passwordForm.current}
                            onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-light)' }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="text-light">Mật khẩu mới</Form.Label>
                          <Form.Control
                            type="password"
                            placeholder="Ít nhất 6 ký tự"
                            value={passwordForm.newPwd}
                            onChange={e => setPasswordForm({ ...passwordForm, newPwd: e.target.value })}
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-light)' }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label className="text-light">Xác nhận mật khẩu mới</Form.Label>
                          <Form.Control
                            type="password"
                            placeholder="Nhập lại mật khẩu mới"
                            value={passwordForm.confirm}
                            onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                            onKeyDown={e => e.key === 'Enter' && handleChangePassword(e)}
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-light)' }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={1}>
                        <Button
                          type="button"
                          variant="warning"
                          className="w-100"
                          disabled={pwdLoading}
                          onClick={handleChangePassword}
                        >
                          {pwdLoading ? <Spinner size="sm" /> : '✔'}
                        </Button>
                      </Col>
                    </Row>
                  </div>
                )}
              </div>


              <div className="text-center">
                <Button
                  type="submit"
                  className="btn-primary-custom px-4 py-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Đang cập nhật...
                    </>
                  ) : (
                    '💾 Lưu thay đổi'
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>


        <Card className="mt-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <Card.Body className="p-4">
            <h5 className="text-light mb-3 d-flex align-items-center gap-2">
              ℹ️ Thông tin tài khoản
            </h5>
            <Row className="g-3">
              <Col md={6}>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Vai trò:</span>
                  <Badge bg={currentUser?.role === 'admin' ? 'warning' : 'secondary'}>
                    {currentUser?.role === 'admin' ? '👑 Admin' : '👤 User'}
                  </Badge>
                </div>
              </Col>
              <Col md={6}>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Trạng thái:</span>
                  <Badge bg={currentUser?.status === 'active' ? 'success' : 'warning'}>
                    {currentUser?.status === 'active' ? '✅ Hoạt động' : '⏳ Chờ duyệt'}
                  </Badge>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>
    </div>
  )
}