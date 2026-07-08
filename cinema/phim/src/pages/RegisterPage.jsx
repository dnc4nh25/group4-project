import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Container, Form, Button, Card, Alert, Spinner } from 'react-bootstrap'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

export default function RegisterPage() {
  const [form, setForm] = useState({ 
    username: '', 
    password: '', 
    confirmPassword: '', 
    fullName: '', 
    email: '', 
    phone: '' 
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9]{10,11}$/
    return phoneRegex.test(phone)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!form.username || !form.password || !form.fullName || !form.email || !form.phone) {
      setError('Vui lòng điền đầy đủ thông tin.')
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
    
    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }
    
    if (form.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.')
      return
    }
    
    setLoading(true)
    try {
      // Check username exists
      try {
        await axios.get(`http://localhost:8080/api/users/username/${form.username}`)
        setError('Tên đăng nhập đã tồn tại.')
        setLoading(false)
        return
      } catch (err) {
        if (err.response?.status !== 404) throw err
      }
      
      // Check email exists
      if (form.email) {
        try {
          await axios.get(`http://localhost:8080/api/users/email/${form.email}`)
          setError('Email đã được sử dụng.')
          setLoading(false)
          return
        } catch (err) {
          if (err.response?.status !== 404) throw err
        }
      }
      
      // Check phone exists
      if (form.phone) {
        try {
          await axios.get(`http://localhost:8080/api/users/phone/${form.phone}`)
          setError('Số điện thoại đã được sử dụng.')
          setLoading(false)
          return
        } catch (err) {
          if (err.response?.status !== 404) throw err
        }
      }
      
      const res = await axios.post('http://localhost:8080/api/users', {
        username: form.username,
        password: form.password,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        role: 'user',
        status: 'active'
      })
      login(res.data)
      navigate('/')
    } catch (err) {
      setError('Không thể kết nối đến máy chủ.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg d-flex align-items-center justify-content-center min-vh-100">
      <Container style={{ maxWidth: 440 }}>
        <Card className="auth-card shadow-lg">
          <Card.Body className="p-4 p-md-5">
            <div className="text-center mb-4">
              <div className="auth-icon">🎟️</div>
              <h2 className="fw-bold mb-1">Tạo tài khoản</h2>
              <p className="text-muted">Đăng ký để bắt đầu đặt vé</p>
            </div>
            {error && <Alert variant="danger" className="py-2">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Họ và tên <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={form.fullName}
                  onChange={handleChange}
                  className="form-input-custom"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  id="reg-email"
                  name="email"
                  type="email"
                  placeholder="example@email.com"
                  value={form.email}
                  onChange={handleChange}
                  className="form-input-custom"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Số điện thoại <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  id="reg-phone"
                  name="phone"
                  type="tel"
                  placeholder="0123456789"
                  value={form.phone}
                  onChange={handleChange}
                  className="form-input-custom"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Tên đăng nhập <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  id="reg-username"
                  name="username"
                  type="text"
                  placeholder="username"
                  value={form.username}
                  onChange={handleChange}
                  className="form-input-custom"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Mật khẩu <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  id="reg-password"
                  name="password"
                  type="password"
                  placeholder="Ít nhất 6 ký tự"
                  value={form.password}
                  onChange={handleChange}
                  className="form-input-custom"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label>Xác nhận mật khẩu <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="form-input-custom"
                  required
                />
              </Form.Group>
              <Button
                id="register-btn"
                type="submit"
                className="w-100 btn-primary-custom"
                disabled={loading}
              >
                {loading ? <Spinner size="sm" /> : 'Đăng ký'}
              </Button>
            </Form>
            <div className="text-center mt-3">
              <span className="text-muted">Đã có tài khoản? </span>
              <Link to="/login" className="text-warning fw-semibold">Đăng nhập</Link>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  )
}
