import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Container, Form, Button, Card, Alert, Spinner } from 'react-bootstrap'
import axios from 'axios'
import { useAuth } from '../../contexts/AuthContext'

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
      setError('Vui lÃ²ng Ä‘iá»n Ä‘áº§y Ä‘á»§ thÃ´ng tin.')
      return
    }
    
    if (!validateEmail(form.email)) {
      setError('Email khÃ´ng há»£p lá»‡.')
      return
    }
    
    if (!validatePhone(form.phone)) {
      setError('Sá»‘ Ä‘iá»‡n thoáº¡i pháº£i cÃ³ 10-11 chá»¯ sá»‘.')
      return
    }
    
    if (form.password !== form.confirmPassword) {
      setError('Máº­t kháº©u xÃ¡c nháº­n khÃ´ng khá»›p.')
      return
    }
    
    if (form.password.length < 6) {
      setError('Máº­t kháº©u pháº£i cÃ³ Ã­t nháº¥t 6 kÃ½ tá»±.')
      return
    }
    
    setLoading(true)
    try {
      const res = await axios.post('http://localhost:8080/api/auth/register', {
        username: form.username,
        password: form.password,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone
      })
      // ÄÄƒng kÃ½ thÃ nh cÃ´ng â†’ Backend tráº£ vá» JWT, tá»± Ä‘á»™ng Ä‘Äƒng nháº­p
      login(res.data)
      navigate('/')
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data)
      } else {
        setError('KhÃ´ng thá»ƒ káº¿t ná»‘i Ä‘áº¿n mÃ¡y chá»§.')
      }
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
              <div className="auth-icon">ðŸŽŸï¸</div>
              <h2 className="fw-bold mb-1">Táº¡o tÃ i khoáº£n</h2>
              <p className="text-muted">ÄÄƒng kÃ½ Ä‘á»ƒ báº¯t Ä‘áº§u Ä‘áº·t vÃ©</p>
            </div>
            {error && <Alert variant="danger" className="py-2">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Há» vÃ  tÃªn <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Nguyá»…n VÄƒn A"
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
                <Form.Label>Sá»‘ Ä‘iá»‡n thoáº¡i <span className="text-danger">*</span></Form.Label>
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
                <Form.Label>TÃªn Ä‘Äƒng nháº­p <span className="text-danger">*</span></Form.Label>
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
                <Form.Label>Máº­t kháº©u <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  id="reg-password"
                  name="password"
                  type="password"
                  placeholder="Ãt nháº¥t 6 kÃ½ tá»±"
                  value={form.password}
                  onChange={handleChange}
                  className="form-input-custom"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label>XÃ¡c nháº­n máº­t kháº©u <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Nháº­p láº¡i máº­t kháº©u"
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
                {loading ? <Spinner size="sm" /> : 'ÄÄƒng kÃ½'}
              </Button>
            </Form>
            <div className="text-center mt-3">
              <span className="text-muted">ÄÃ£ cÃ³ tÃ i khoáº£n? </span>
              <Link to="/login" className="text-warning fw-semibold">ÄÄƒng nháº­p</Link>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  )
}
