import { useState, useEffect, useRef } from 'react'
import { Container, Card, Form, Button, Alert, Spinner, Row, Col, Badge } from 'react-bootstrap'
import axios from 'axios'
import { useAuth } from '../../contexts/AuthContext'
import './ProfilePage.css'


export default function ProfilePage() {
  const { currentUser, login } = useAuth()
  const [form, setForm] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPasswordFields, setShowPasswordFields] = useState(false)

  const [formErrors, setFormErrors] = useState({})
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const formRefs = useRef({})

  useEffect(() => {
    if (currentUser) {
      setForm({
        username: currentUser.username || '',
        fullName: currentUser.fullName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        password: '',
        newPassword: '',
        confirmPassword: ''
      })
    }
  }, [currentUser])

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone) => {
    // Số điện thoại phải có đúng 10 chữ số và bắt đầu bằng số 0
    const phoneRegex = /^0[0-9]{9}$/
    return phoneRegex.test(phone)
  }

  const validateForm = (formData) => {
    const errors = {}

    if (!formData.fullName || !formData.fullName.trim()) {
      errors.fullName = 'Họ và tên không được để trống.'
    }

    if (!formData.email || !formData.email.trim()) {
      errors.email = 'Email không được để trống.'
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Email không hợp lệ.'
    }

    if (!formData.phone || !formData.phone.trim()) {
      errors.phone = 'Số điện thoại không được để trống.'
    } else if (!validatePhone(formData.phone)) {
      errors.phone = 'Số điện thoại phải có 10 chữ số và bắt đầu bằng số 0.'
    }

    if (showPasswordFields) {
      if (!formData.password) {
        errors.password = 'Vui lòng nhập mật khẩu hiện tại.'
      }

      if (!formData.newPassword || formData.newPassword.length < 6) {
        errors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự.'
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = 'Mật khẩu xác nhận không khớp.'
      }
    }

    return errors
  }

  useEffect(() => {
    if (hasSubmitted) {
      setFormErrors(validateForm(form))
    }
  }, [form, hasSubmitted, showPasswordFields, currentUser])

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setHasSubmitted(true)

    const errors = validateForm(form)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      const firstErrorKey = Object.keys(errors)[0]
      if (formRefs.current[firstErrorKey]) {
        formRefs.current[firstErrorKey].scrollIntoView({ behavior: 'smooth', block: 'center' })
        formRefs.current[firstErrorKey].focus()
      }
      return
    }

    setLoading(true)
    try {
      // Check email exists (excluding current user)
      if (form.email && form.email !== currentUser.email) {
        try {
          const emailCheck = await axios.get(`${import.meta.env.VITE_API_URL}/users/email/${form.email}`)
          if (emailCheck.data && emailCheck.data.id !== currentUser.id) {
            setFormErrors(prev => ({ ...prev, email: 'Email đã được sử dụng bởi tài khoản khác.' }))
            if (formRefs.current.email) {
              formRefs.current.email.scrollIntoView({ behavior: 'smooth', block: 'center' })
              formRefs.current.email.focus()
            }
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
          const phoneCheck = await axios.get(`${import.meta.env.VITE_API_URL}/users/phone/${form.phone}`)
          if (phoneCheck.data && phoneCheck.data.id !== currentUser.id) {
            setFormErrors(prev => ({ ...prev, phone: 'Số điện thoại đã được sử dụng bởi tài khoản khác.' }))
            if (formRefs.current.phone) {
              formRefs.current.phone.scrollIntoView({ behavior: 'smooth', block: 'center' })
              formRefs.current.phone.focus()
            }
            setLoading(false)
            return
          }
        } catch (err) {
          if (err.response?.status !== 404) throw err
        }
      }

      // Change Password if requested
      if (showPasswordFields && form.newPassword) {
        try {
          await axios.post(`${import.meta.env.VITE_API_URL}/users/${currentUser.id}/change-password`, {
            currentPassword: form.password,
            newPassword: form.newPassword
          })
        } catch (err) {
          if (err.response?.status === 401) {
            setFormErrors(prev => ({ ...prev, password: 'Mật khẩu hiện tại không đúng.' }))
            if (formRefs.current.password) {
              formRefs.current.password.scrollIntoView({ behavior: 'smooth', block: 'center' })
              formRefs.current.password.focus()
            }
            setLoading(false)
            return
          }
          throw err;
        }
      }

      // Update basic information
      const updateData = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim()
      }

      const response = await axios.put(`${import.meta.env.VITE_API_URL}/users/${currentUser.id}`, updateData)

      login(response.data)

      setSuccess('Cập nhật thông tin thành công!')

      if (showPasswordFields) {
        setForm(f => ({
          ...f,
          password: '',
          newPassword: '',
          confirmPassword: ''
        }))
        setShowPasswordFields(false)
        setHasSubmitted(false)
        setFormErrors({})
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi cập nhật thông tin.')
    } finally {
      setLoading(false)
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
          <p className="text-muted mb-2">Quản lý thông tin tài khoản của bạn</p>
          <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill" style={{ background: 'rgba(0, 176, 255, 0.1)', border: '1px solid rgba(0, 176, 255, 0.2)' }}>
            <span style={{ fontSize: '1.2rem' }}>⭐</span>
            <span className="text-light">Điểm tích lũy:</span>
            <strong style={{ color: '#00b0ff', fontSize: '1.1rem' }}>{currentUser?.points?.toLocaleString() || 0}</strong>
          </div>
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
                        ref={el => formRefs.current.fullName = el}
                        name="fullName"
                        type="text"
                        placeholder="Nguyễn Văn A"
                        value={form.fullName}
                        onChange={handleChange}
                        isInvalid={!!formErrors.fullName}
                        style={{
                          background: 'var(--bg-surface)',
                          borderColor: formErrors.fullName ? 'var(--bs-danger)' : 'var(--border)',
                          color: 'var(--text-light)'
                        }}
                      />
                      <Form.Control.Feedback type="invalid">
                        {formErrors.fullName}
                      </Form.Control.Feedback>
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
                        ref={el => formRefs.current.email = el}
                        name="email"
                        type="email"
                        placeholder="example@email.com"
                        value={form.email}
                        onChange={handleChange}
                        isInvalid={!!formErrors.email}
                        style={{
                          background: 'var(--bg-surface)',
                          borderColor: formErrors.email ? 'var(--bs-danger)' : 'var(--border)',
                          color: 'var(--text-light)'
                        }}
                      />
                      <Form.Control.Feedback type="invalid">
                        {formErrors.email}
                      </Form.Control.Feedback>
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
                        ref={el => formRefs.current.phone = el}
                        name="phone"
                        type="tel"
                        placeholder="0123456789"
                        value={form.phone}
                        onChange={handleChange}
                        isInvalid={!!formErrors.phone}
                        style={{
                          background: 'var(--bg-surface)',
                          borderColor: formErrors.phone ? 'var(--bs-danger)' : 'var(--border)',
                          color: 'var(--text-light)'
                        }}
                      />
                      <Form.Control.Feedback type="invalid">
                        {formErrors.phone}
                      </Form.Control.Feedback>
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
                    onClick={() => { setShowPasswordFields(!showPasswordFields); setFormErrors({}); setHasSubmitted(false); }}
                  >
                    {showPasswordFields ? 'Hủy đổi mật khẩu' : 'Đổi mật khẩu'}
                  </Button>
                </div>

                {showPasswordFields && (
                  <Row className="g-3">
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="text-light">Mật khẩu hiện tại</Form.Label>
                        <Form.Control
                          ref={el => formRefs.current.password = el}
                          name="password"
                          type="password"
                          placeholder="Nhập mật khẩu hiện tại"
                          value={form.password}
                          onChange={handleChange}
                          isInvalid={!!formErrors.password}
                          style={{
                            background: 'var(--bg-surface)',
                            borderColor: formErrors.password ? 'var(--bs-danger)' : 'var(--border)',
                            color: 'var(--text-light)'
                          }}
                        />
                        <Form.Control.Feedback type="invalid">
                          {formErrors.password}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="text-light">Mật khẩu mới</Form.Label>
                        <Form.Control
                          ref={el => formRefs.current.newPassword = el}
                          name="newPassword"
                          type="password"
                          placeholder="Ít nhất 6 ký tự"
                          value={form.newPassword}
                          onChange={handleChange}
                          isInvalid={!!formErrors.newPassword}
                          style={{
                            background: 'var(--bg-surface)',
                            borderColor: formErrors.newPassword ? 'var(--bs-danger)' : 'var(--border)',
                            color: 'var(--text-light)'
                          }}
                        />
                        <Form.Control.Feedback type="invalid">
                          {formErrors.newPassword}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="text-light">Xác nhận mật khẩu mới</Form.Label>
                        <Form.Control
                          ref={el => formRefs.current.confirmPassword = el}
                          name="confirmPassword"
                          type="password"
                          placeholder="Nhập lại mật khẩu mới"
                          value={form.confirmPassword}
                          onChange={handleChange}
                          isInvalid={!!formErrors.confirmPassword}
                          style={{
                            background: 'var(--bg-surface)',
                            borderColor: formErrors.confirmPassword ? 'var(--bs-danger)' : 'var(--border)',
                            color: 'var(--text-light)'
                          }}
                        />
                        <Form.Control.Feedback type="invalid">
                          {formErrors.confirmPassword}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
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