import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert, Badge, Spinner } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
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
      console.log('⚠️ No current user, skipping load')
      return
    }
    setLoadingFeedbacks(true)
    try {
      console.log('🔍 Fetching all contactMessages, will filter by userId:', currentUser.id)
      const res = await axios.get('http://localhost:3001/contactMessages')
      console.log('📦 Raw response (total):', res.data.length, 'items')

      const userMessages = res.data.filter(msg =>
        String(msg.userId) === String(currentUser.id)
      )
      console.log('🎯 After filter for userId', currentUser.id, ':', userMessages.length, 'items')

      const sortedData = userMessages.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      )
      setFeedbacks(sortedData)
    } catch (err) {
      console.error('❌ Lỗi tải lịch sử liên hệ:', err)
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

      console.log('📤 Sending feedback:', newMessage)
      console.log('👤 Current User ID:', currentUser?.id)
      const response = await axios.post('http://localhost:3001/contactMessages', newMessage)
      console.log('✅ Feedback saved:', response.data)

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

      console.log('🔄 Reloading feedbacks for userId:', currentUser?.id)
      await loadFeedbacks()
    } catch (err) {
      console.error('Lỗi gửi tin nhắn:', err)
      alert('Có lỗi xảy ra khi gửi tin nhắn, vui lòng thử lại sau.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const locations = [
    {
      name: "CinemaXP Hà Nội",
      address: "Nhà anh Minh, Thạch Hoà, Thạch Thất, Hà Nội",
      phone: "(024) 3851 9012",
      hours: "8:00 - 23:00 (Hàng ngày)",
      email: "hanoi@cinemaxp.vn",
      manager: "Nguyễn Văn Minh"
    },
    {
      name: "CinemaXP TP.HCM",
      address: "123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
      phone: "(028) 3822 1234",
      hours: "8:00 - 23:00 (Hàng ngày)",
      email: "hcm@cinemaxp.vn",
      manager: "Trần Thị Lan"
    }
  ]

  return (
    <div className="page-wrapper static-page contact-page">
      
      <div className="static-page-header">
        <Container>
          <div className="text-center">
            <div className="static-page-icon">📞</div>
            <h1 className="static-page-title">Liên hệ với chúng tôi</h1>
            <p className="static-page-subtitle">
              Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn
            </p>
          </div>
        </Container>
      </div>

      <Container className="py-5">
        <Row className="g-5">
          
          <Col lg={8}>
            <Card className="contact-form-card">
              <Card.Header className="contact-form-header">
                <h4 className="mb-0">📝 Gửi tin nhắn cho chúng tôi</h4>
              </Card.Header>
              <Card.Body className="p-4">
                {!currentUser ? (
                  <div className="text-center py-5">
                    <div className="mb-4" style={{ fontSize: '48px' }}>🔐</div>
                    <h5>Yêu cầu đăng nhập</h5>
                    <p className="text-muted mb-4">Bạn vui lòng đăng nhập để có thể gửi góp ý, báo lỗi hoặc liên hệ với chúng tôi.</p>
                    <Button as={Link} to="/login" variant="primary" className="btn-primary-custom px-4">
                      Đăng nhập ngay
                    </Button>
                  </div>
                ) : (
                  <>
                    {showAlert && (
                      <Alert variant="success" className="mb-4">
                        ✅ Cảm ơn bạn đã liên hệ! Chúng tôi đã nhận được tin nhắn và sẽ phản hồi trong vòng 24 giờ.
                      </Alert>
                    )}

                    <Form onSubmit={handleSubmit}>
                      <Row className="g-3">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Họ và tên *</Form.Label>
                            <Form.Control
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleChange}
                              placeholder="Nhập họ và tên"
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
                              placeholder="Nhập địa chỉ email"
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Số điện thoại</Form.Label>
                            <Form.Control
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleChange}
                              placeholder="Nhập số điện thoại"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Chủ đề *</Form.Label>
                            <Form.Select
                              name="subject"
                              value={formData.subject}
                              onChange={handleChange}
                              required
                            >
                              <option value="">Chọn chủ đề</option>
                              <option value="booking">Vấn đề đặt vé</option>
                              <option value="payment">Vấn đề thanh toán</option>
                              <option value="technical">Lỗi kỹ thuật</option>
                              <option value="feedback">Góp ý dịch vụ</option>
                              <option value="partnership">Hợp tác kinh doanh</option>
                              <option value="other">Khác</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col xs={12}>
                          <Form.Group>
                            <Form.Label>Nội dung tin nhắn *</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={5}
                              name="message"
                              value={formData.message}
                              onChange={handleChange}
                              placeholder="Nhập nội dung tin nhắn của bạn..."
                              required
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <div className="text-center mt-4">
                        <Button type="submit" size="lg" className="btn-primary-custom" disabled={isSubmitting}>
                          {isSubmitting ? <Spinner size="sm" /> : '📤 Gửi tin nhắn'}
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
                <h5 className="mb-0">📍 Thông tin liên hệ</h5>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="contact-methods">
                  <div className="contact-method">
                    <div className="method-icon">📞</div>
                    <div className="method-info">
                      <strong>Hotline</strong>
                      <p>1900 1234 (24/7)</p>
                    </div>
                  </div>

                  <div className="contact-method">
                    <div className="method-icon">✉️</div>
                    <div className="method-info">
                      <strong>Email</strong>
                      <p>info@cinemaxp.vn</p>
                    </div>
                  </div>

                  <div className="contact-method">
                    <div className="method-icon">💬</div>
                    <div className="method-info">
                      <strong>Live Chat</strong>
                      <p>Hỗ trợ trực tuyến 24/7</p>
                    </div>
                  </div>

                  <div className="contact-method">
                    <div className="method-icon">📱</div>
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
                <h5 className="mb-0">🕒 Giờ làm việc</h5>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="hours-list">
                  <div className="hours-item">
                    <span>Thứ 2 - Thứ 6</span>
                    <span>8:00 - 22:00</span>
                  </div>
                  <div className="hours-item">
                    <span>Thứ 7 - Chủ nhật</span>
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
                  <div className="ch-header-icon">📋</div>
                  <div>
                    <h5 className="ch-title">Lịch sử liên hệ của bạn</h5>
                    <p className="ch-subtitle">Theo dõi các tin nhắn và phản hồi từ CinemaXP</p>
                  </div>
                </div>

                {loadingFeedbacks ? (
                  <div className="ch-loading">
                    <Spinner animation="border" size="sm" />
                    <span>Đang tải lịch sử...</span>
                  </div>
                ) : feedbacks.length === 0 ? (
                  <div className="ch-empty">
                    <div className="ch-empty-icon">📭</div>
                    <h6>Chưa có tin nhắn nào</h6>
                    <p>Bạn chưa có tin nhắn liên hệ nào với chúng tôi</p>
                  </div>
                ) : (
                  <div className="ch-timeline">
                    {feedbacks.map((feedback) => {
                      const isReplied = feedback.status === 'replied';
                      const subjectLabels = {
                        booking: 'Vấn đề đặt vé',
                        payment: 'Vấn đề thanh toán',
                        technical: 'Lỗi kỹ thuật',
                        feedback: 'Góp ý dịch vụ',
                        partnership: 'Hợp tác kinh doanh',
                        other: 'Khác'
                      };

                      return (
                        <div key={feedback.id} className="ch-item">
                          <div className={`ch-dot ${isReplied ? 'ch-dot--replied' : 'ch-dot--pending'}`}>
                            {isReplied ? '✓' : '⏱'}
                          </div>

                          <div className={`ch-card ${isReplied ? 'ch-card--replied' : 'ch-card--pending'}`}>
                            <div className="ch-card-top">
                              <div className="ch-card-badges">
                                <span className={`ch-badge-status ${isReplied ? 'replied' : 'pending'}`}>
                                  {isReplied ? '✓ Đã phản hồi' : '⏱ Chờ phản hồi'}
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
                              <div className="ch-message-label">Tin nhắn của bạn</div>
                              <p className="ch-message-text">{feedback.message}</p>
                            </div>

                            {isReplied && feedback.adminReply && (
                              <div className="ch-reply">
                                <div className="ch-reply-header">
                                  <strong>Phản hồi từ CinemaXP</strong>
                                </div>
                                <p className="ch-reply-text">{feedback.adminReply}</p>
                                {feedback.repliedAt && (
                                  <span className="ch-reply-time">
                                    Phản hồi lúc: {new Date(feedback.repliedAt).toLocaleString('vi-VN')}
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
            <h3 className="text-center mb-4">🏢 Hệ thống rạp CinemaXP</h3>
            <Row className="g-4 justify-content-center">
              {locations.map((location, index) => (
                <Col key={index} lg={5} md={6}>
                  <Card className="location-card">
                    <Card.Body className="p-4">
                      <h5 className="location-name">{location.name}</h5>
                      <div className="location-info">
                        <div className="info-item">
                          <span className="info-icon">📍</span>
                          <span>{location.address}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-icon">📞</span>
                          <span>{location.phone}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-icon">✉️</span>
                          <span>{location.email}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-icon">🕒</span>
                          <span>{location.hours}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-icon">👤</span>
                          <span>Quản lý: {location.manager}</span>
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