import { useState, useEffect } from 'react'
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
      setError('Vui lòng di?n d?y d? thông tin b?t bu?c.')
      return
    }

    if (!validateEmail(form.email)) {
      setError('Email không h?p l?.')
      return
    }

    if (!validatePhone(form.phone)) {
      setError('S? di?n tho?i ph?i có 10-11 ch? s?.')
      return
    }

    if (showPasswordFields) {
      if (!form.password) {
        setError('Vui lòng nh?p m?t kh?u hi?n t?i.')
        return
      }
      if (!form.newPassword || form.newPassword.length < 6) {
        setError('M?t kh?u m?i ph?i có ít nh?t 6 ký t?.')
        return
      }
      if (form.newPassword !== form.confirmPassword) {
        setError('M?t kh?u xác nh?n không kh?p.')
        return
      }
      if (form.password !== currentUser.password) {
        setError('M?t kh?u hi?n t?i không dúng.')
        return
      }
    }

    setLoading(true)
    try {
      // Check email exists (excluding current user)
      if (form.email && form.email !== currentUser.email) {
        try {
          const emailCheck = await axios.get(`http://localhost:8080/api/users/email/${form.email}`)
          if (emailCheck.data && emailCheck.data.id !== currentUser.id) {
            setError('Email dã du?c s? d?ng b?i tài kho?n khác.')
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
            setError('S? di?n tho?i dã du?c s? d?ng b?i tài kho?n khác.')
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

      if (showPasswordFields && form.newPassword) {
        updateData.password = form.newPassword
      }

      const response = await axios.put(`http://localhost:8080/api/users/${currentUser.id}`, updateData)
      
      login(response.data)
      
      setSuccess('C?p nh?t thông tin thành công!')
      
      if (showPasswordFields) {
        setForm({
          ...form,
          password: '',
          newPassword: '',
          confirmPassword: ''
        })
        setShowPasswordFields(false)
      }
    } catch (err) {
      setError('Có l?i x?y ra khi c?p nh?t thông tin.')
    } finally {
      setLoading(false)
    }
  }

  const missingInfo = []
  if (!currentUser?.email) missingInfo.push('Email')
  if (!currentUser?.phone) missingInfo.push('S? di?n tho?i')

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
          <h2 className="fw-bold text-light mb-1">?? Thông tin cá nhân</h2>
          <p className="text-muted">Qu?n lý thông tin tài kho?n c?a b?n</p>
        </div>

        
        {missingInfo.length > 0 && (
          <Alert variant="warning" className="mb-4">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span style={{ fontSize: '1.2rem' }}>??</span>
              <strong>Thông tin tài kho?n chua d?y d?</strong>
            </div>
            <div className="mb-2">
              B?n chua c?p nh?t: <strong>{missingInfo.join(', ')}</strong>
            </div>
            <small className="text-muted">
              ?? Vui lòng c?p nh?t d?y d? thông tin d? d?m b?o nh?n du?c thông báo và h? tr? t?t nh?t t? CinemaXP.
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
                  ?? Thông tin co b?n
                </h5>
                
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="text-light">Tên dang nh?p</Form.Label>
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
                        Tên dang nh?p không th? thay d?i
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="text-light">
                        H? và tên <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        name="fullName"
                        type="text"
                        placeholder="Nguy?n Van A"
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
                  ?? Thông tin liên h?
                </h5>
                
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="text-light d-flex align-items-center gap-2">
                        Email <span className="text-danger">*</span>
                        {!currentUser?.email && (
                          <Badge bg="danger" className="px-2 py-1">Thi?u</Badge>
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
                        S? di?n tho?i <span className="text-danger">*</span>
                        {!currentUser?.phone && (
                          <Badge bg="danger" className="px-2 py-1">Thi?u</Badge>
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
                    ?? B?o m?t
                  </h5>
                  <Button
                    variant="outline-warning"
                    size="sm"
                    onClick={() => setShowPasswordFields(!showPasswordFields)}
                  >
                    {showPasswordFields ? 'H?y d?i m?t kh?u' : 'Ð?i m?t kh?u'}
                  </Button>
                </div>

                {showPasswordFields && (
                  <Row className="g-3">
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="text-light">M?t kh?u hi?n t?i</Form.Label>
                        <Form.Control
                          name="password"
                          type="password"
                          placeholder="Nh?p m?t kh?u hi?n t?i"
                          value={form.password}
                          onChange={handleChange}
                          style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-light)'
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="text-light">M?t kh?u m?i</Form.Label>
                        <Form.Control
                          name="newPassword"
                          type="password"
                          placeholder="Ít nh?t 6 ký t?"
                          value={form.newPassword}
                          onChange={handleChange}
                          style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-light)'
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="text-light">Xác nh?n m?t kh?u m?i</Form.Label>
                        <Form.Control
                          name="confirmPassword"
                          type="password"
                          placeholder="Nh?p l?i m?t kh?u m?i"
                          value={form.confirmPassword}
                          onChange={handleChange}
                          style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-light)'
                          }}
                        />
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
                      Ðang c?p nh?t...
                    </>
                  ) : (
                    '?? Luu thay d?i'
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>

        
        <Card className="mt-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <Card.Body className="p-4">
            <h5 className="text-light mb-3 d-flex align-items-center gap-2">
              ?? Thông tin tài kho?n
            </h5>
            <Row className="g-3">
              <Col md={6}>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Vai trò:</span>
                  <Badge bg={currentUser?.role === 'admin' ? 'warning' : 'secondary'}>
                    {currentUser?.role === 'admin' ? '?? Admin' : '?? User'}
                  </Badge>
                </div>
              </Col>
              <Col md={6}>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Tr?ng thái:</span>
                  <Badge bg={currentUser?.status === 'active' ? 'success' : 'warning'}>
                    {currentUser?.status === 'active' ? '? Ho?t d?ng' : '? Ch? duy?t'}
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
