import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert, Badge, Spinner } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../contexts/AuthContext'
import './StaticPages.css'

export default function ContactPage() {
  const { currentUser } = useAuth()
  const [formData, setFormData] = useState({
    name: currentUser?.fullName || currentUser?.username || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    subject: '',
    message: ''
  })
  const [showAlert, setShowAlert] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [feedbacks, setFeedbacks] = useState([])
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false)

  const loadFeedbacks = async () => {
    if (!currentUser) {
      console.log('?? No current user, skipping load')
      return
    }
    setLoadingFeedbacks(true)
    try {
      console.log('?? Fetching all contactMessages, will filter by userId:', currentUser.id)
      const res = await axios.get('http://localhost:8080/api/contact-messages')
      console.log('?? Raw response (total):', res.data.length, 'items')

      const userMessages = res.data.filter(msg =>
        String(msg.userId) === String(currentUser.id)
      )
      console.log('?? After filter for userId', currentUser.id, ':', userMessages.length, 'items')

      const sortedData = userMessages.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      )
      setFeedbacks(sortedData)
    } catch (err) {
      console.error('? L?i t?i l?ch s? liên h?:', err)
    } finally {
      setLoadingFeedbacks(false)
    }
  }

  useEffect(() => {
    if (currentUser) {
      loadFeedbacks()
    }
  }, [currentUser])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setIsSubmitting(true)
    try {
      const newMessage = {
        ...formData,
        userId: currentUser?.id || null,
        userEmail: currentUser?.email || formData.email,
        userName: currentUser?.fullName || formData.name,
        status: 'pending', // pending, replied
        adminReply: null,
        createdAt: new Date().toISOString()
      }

      console.log('?? Sending feedback:', newMessage)
      console.log('?? Current User ID:', currentUser?.id)
      const response = await axios.post('http://localhost:8080/api/contact-messages', newMessage)
      console.log('? Feedback saved:', response.data)

      setShowAlert(true)

      setFormData({
        name: currentUser?.fullName || currentUser?.username || '',
        email: currentUser?.email || '',
        phone: currentUser?.phone || '',
        subject: '',
        message: ''
      })

      setTimeout(() => setShowAlert(false), 5000)

      await new Promise(resolve => setTimeout(resolve, 300))

      console.log('?? Reloading feedbacks for userId:', currentUser?.id)
      await loadFeedbacks()
    } catch (err) {
      console.error('L?i g?i tin nh?n:', err)
      alert('Có l?i x?y ra khi g?i tin nh?n, vui lòng th? l?i sau.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const locations = [
    {
      name: "CinemaXP Hà N?i",
      address: "Nhà anh Minh, Th?ch Hoà, Th?ch Th?t, Hà N?i",
      phone: "(024) 3851 9012",
      hours: "8:00 - 23:00 (Hàng ngày)",
      email: "hanoi@cinemaxp.vn",
      manager: "Nguy?n Van Minh"
    },
    {
      name: "CinemaXP TP.HCM",
      address: "123 Ðu?ng Nguy?n Hu?, Qu?n 1, TP. H? Chí Minh",
      phone: "(028) 3822 1234",
      hours: "8:00 - 23:00 (Hàng ngày)",
      email: "hcm@cinemaxp.vn",
      manager: "Tr?n Th? Lan"
    }
  ]

  return (
    <div className="page-wrapper static-page contact-page">
      
      <div className="static-page-header">
        <Container>
          <div className="text-center">
            <div className="static-page-icon">??</div>
            <h1 className="static-page-title">Liên h? v?i chúng tôi</h1>
            <p className="static-page-subtitle">
              Chúng tôi luôn s?n sàng l?ng nghe và h? tr? b?n
            </p>
          </div>
        </Container>
      </div>

      <Container className="py-5">
        <Row className="g-5">
          
          <Col lg={8}>
            <Card className="contact-form-card">
              <Card.Header className="contact-form-header">
                <h4 className="mb-0">?? G?i tin nh?n cho chúng tôi</h4>
              </Card.Header>
              <Card.Body className="p-4">
                {!currentUser ? (
                  <div className="text-center py-5">
                    <div className="mb-4" style={{ fontSize: '48px' }}>??</div>
                    <h5>Yêu c?u dang nh?p</h5>
                    <p className="text-muted mb-4">B?n vui lòng dang nh?p d? có th? g?i góp ý, báo l?i ho?c liên h? v?i chúng tôi.</p>
                    <Button as={Link} to="/login" variant="primary" className="btn-primary-custom px-4">
                      Ðang nh?p ngay
                    </Button>
                  </div>
                ) : (
                  <>
                    {showAlert && (
                      <Alert variant="success" className="mb-4">
                        ? C?m on b?n dã liên h?! Chúng tôi dã nh?n du?c tin nh?n và s? ph?n h?i trong vòng 24 gi?.
                      </Alert>
                    )}

                    <Form onSubmit={handleSubmit}>
                      <Row className="g-3">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>H? và tên *</Form.Label>
                            <Form.Control
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleChange}
                              placeholder="Nh?p h? và tên"
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Email *</Form.Label>
                            <Form.Control
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              placeholder="Nh?p d?a ch? email"
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>S? di?n tho?i</Form.Label>
                            <Form.Control
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleChange}
                              placeholder="Nh?p s? di?n tho?i"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Ch? d? *</Form.Label>
                            <Form.Select
                              name="subject"
                              value={formData.subject}
                              onChange={handleChange}
                              required
                            >
                              <option value="">Ch?n ch? d?</option>
                              <option value="booking">V?n d? d?t vé</option>
                              <option value="payment">V?n d? thanh toán</option>
                              <option value="technical">L?i k? thu?t</option>
                              <option value="feedback">Góp ý d?ch v?</option>
                              <option value="partnership">H?p tác kinh doanh</option>
                              <option value="other">Khác</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col xs={12}>
                          <Form.Group>
                            <Form.Label>N?i dung tin nh?n *</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={5}
                              name="message"
                              value={formData.message}
                              onChange={handleChange}
                              placeholder="Nh?p n?i dung tin nh?n c?a b?n..."
                              required
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <div className="text-center mt-4">
                        <Button type="submit" size="lg" className="btn-primary-custom" disabled={isSubmitting}>
                          {isSubmitting ? <Spinner size="sm" /> : '?? G?i tin nh?n'}
                        </Button>
                      </div>
                    </Form>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>

          
          <Col lg={4}>
            <Card className="contact-info-card mb-4">
              <Card.Header className="contact-info-header">
                <h5 className="mb-0">?? Thông tin liên h?</h5>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="contact-methods">
                  <div className="contact-method">
                    <div className="method-icon">??</div>
                    <div className="method-info">
                      <strong>Hotline</strong>
                      <p>1900 1234 (24/7)</p>
                    </div>
                  </div>

                  <div className="contact-method">
                    <div className="method-icon">??</div>
                    <div className="method-info">
                      <strong>Email</strong>
                      <p>info@cinemaxp.vn</p>
                    </div>
                  </div>

                  <div className="contact-method">
                    <div className="method-icon">??</div>
                    <div className="method-info">
                      <strong>Live Chat</strong>
                      <p>H? tr? tr?c tuy?n 24/7</p>
                    </div>
                  </div>

                  <div className="contact-method">
                    <div className="method-icon">??</div>
                    <div className="method-info">
                      <strong>Social Media</strong>
                      <div className="social-links">
                        <a href="#" className="social-link">Facebook</a>
                        <a href="#" className="social-link">Instagram</a>
                      </div>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            
            <Card className="business-hours-card">
              <Card.Header className="contact-info-header">
                <h5 className="mb-0">?? Gi? làm vi?c</h5>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="hours-list">
                  <div className="hours-item">
                    <span>Th? 2 - Th? 6</span>
                    <span>8:00 - 22:00</span>
                  </div>
                  <div className="hours-item">
                    <span>Th? 7 - Ch? nh?t</span>
                    <span>8:00 - 23:00</span>
                  </div>
                  <div className="hours-item special">
                    <span>Hotline</span>
                    <span>24/7</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        
        {currentUser && (
          <Row className="mt-5">
            <Col xs={12}>
              <div className="ch-wrapper">
                <div className="ch-header">
                  <div className="ch-header-icon">??</div>
                  <div>
                    <h5 className="ch-title">L?ch s? liên h? c?a b?n</h5>
                    <p className="ch-subtitle">Theo dõi các tin nh?n và ph?n h?i t? CinemaXP</p>
                  </div>
                </div>

                {loadingFeedbacks ? (
                  <div className="ch-loading">
                    <Spinner animation="border" size="sm" />
                    <span>Ðang t?i l?ch s?...</span>
                  </div>
                ) : feedbacks.length === 0 ? (
                  <div className="ch-empty">
                    <div className="ch-empty-icon">??</div>
                    <h6>Chua có tin nh?n nào</h6>
                    <p>B?n chua có tin nh?n liên h? nào v?i chúng tôi</p>
                  </div>
                ) : (
                  <div className="ch-timeline">
                    {feedbacks.map((feedback) => {
                      const isReplied = feedback.status === 'replied';
                      const subjectLabels = {
                        booking: 'V?n d? d?t vé',
                        payment: 'V?n d? thanh toán',
                        technical: 'L?i k? thu?t',
                        feedback: 'Góp ý d?ch v?',
                        partnership: 'H?p tác kinh doanh',
                        other: 'Khác'
                      };

                      return (
                        <div key={feedback.id} className="ch-item">
                          <div className={`ch-dot ${isReplied ? 'ch-dot--replied' : 'ch-dot--pending'}`}>
                            {isReplied ? '?' : '?'}
                          </div>

                          <div className={`ch-card ${isReplied ? 'ch-card--replied' : 'ch-card--pending'}`}>
                            <div className="ch-card-top">
                              <div className="ch-card-badges">
                                <span className={`ch-badge-status ${isReplied ? 'replied' : 'pending'}`}>
                                  {isReplied ? '? Ðã ph?n h?i' : '? Ch? ph?n h?i'}
                                </span>
                                <span className="ch-badge-subject">
                                  {subjectLabels[feedback.subject] || 'Khác'}
                                </span>
                              </div>
                              <span className="ch-time">
                                {new Date(feedback.createdAt).toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>

                            <div className="ch-message">
                              <div className="ch-message-label">Tin nh?n c?a b?n</div>
                              <p className="ch-message-text">{feedback.message}</p>
                            </div>

                            {isReplied && feedback.adminReply && (
                              <div className="ch-reply">
                                <div className="ch-reply-header">
                                  <strong>Ph?n h?i t? CinemaXP</strong>
                                </div>
                                <p className="ch-reply-text">{feedback.adminReply}</p>
                                {feedback.repliedAt && (
                                  <span className="ch-reply-time">
                                    Ph?n h?i lúc: {new Date(feedback.repliedAt).toLocaleString('vi-VN')}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Col>
          </Row>
        )}

        
        <Row className="mt-5">
          <Col xs={12}>
            <h3 className="text-center mb-4">?? H? th?ng r?p CinemaXP</h3>
            <Row className="g-4 justify-content-center">
              {locations.map((location, index) => (
                <Col key={index} lg={5} md={6}>
                  <Card className="location-card">
                    <Card.Body className="p-4">
                      <h5 className="location-name">{location.name}</h5>
                      <div className="location-info">
                        <div className="info-item">
                          <span className="info-icon">??</span>
                          <span>{location.address}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-icon">??</span>
                          <span>{location.phone}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-icon">??</span>
                          <span>{location.email}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-icon">??</span>
                          <span>{location.hours}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-icon">??</span>
                          <span>Qu?n lý: {location.manager}</span>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </Container>
    </div>
  )
}
