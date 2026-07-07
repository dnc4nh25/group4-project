import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert, Tab, Tabs, Accordion } from 'react-bootstrap'
import './AdminSupportPage.css'

export default function AdminSupportPage() {
  const [supportData, setSupportData] = useState({
    faqCategories: [
      {
        id: 1,
        category: "Đặt vé",
        icon: "🎫",
        questions: [
          {
            id: 1,
            question: "Làm thế nào để đặt vé xem phim?",
            answer: "Bạn có thể đặt vé bằng cách: 1) Chọn phim muốn xem, 2) Chọn suất chiếu phù hợp, 3) Chọn ghế ngồi, 4) Thanh toán và nhận vé điện tử."
          },
          {
            id: 2,
            question: "Tôi có thể hủy vé đã đặt không?",
            answer: "Có, bạn có thể hủy vé trước giờ chiếu ít nhất 2 tiếng. Vào 'Vé của tôi' và chọn 'Hủy vé'. Tiền sẽ được hoàn lại trong 3-5 ngày làm việc."
          },
          {
            id: 3,
            question: "Tại sao tôi không thể chọn ghế mong muốn?",
            answer: "Ghế có thể đã được đặt bởi khách hàng khác hoặc đang được giữ chỗ tạm thời. Vui lòng chọn ghế khác hoặc thử lại sau vài phút."
          }
        ]
      },
      {
        id: 2,
        category: "Thanh toán",
        icon: "💳",
        questions: [
          {
            id: 4,
            question: "CinemaXP chấp nhận những phương thức thanh toán nào?",
            answer: "Chúng tôi chấp nhận thẻ tín dụng/ghi nợ (Visa, MasterCard), ví điện tử (MoMo, ZaloPay), và chuyển khoản ngân hàng."
          },
          {
            id: 5,
            question: "Làm thế nào để sử dụng voucher giảm giá?",
            answer: "Tại trang thanh toán, nhập mã voucher vào ô 'Mã giảm giá' và nhấn 'Áp dụng'. Hệ thống sẽ tự động tính toán giảm giá nếu voucher hợp lệ."
          },
          {
            id: 6,
            question: "Tại sao giao dịch của tôi bị từ chối?",
            answer: "Có thể do: số dư không đủ, thông tin thẻ không chính xác, hoặc ngân hàng từ chối giao dịch. Vui lòng kiểm tra lại hoặc thử phương thức thanh toán khác."
          }
        ]
      },
      {
        id: 3,
        category: "Tài khoản",
        icon: "👤",
        questions: [
          {
            id: 7,
            question: "Làm thế nào để tạo tài khoản?",
            answer: "Nhấn 'Đăng ký' ở góc trên bên phải, điền thông tin cần thiết và xác nhận email. Bạn sẽ nhận được email kích hoạt tài khoản."
          },
          {
            id: 8,
            question: "Tôi quên mật khẩu, phải làm sao?",
            answer: "Tại trang đăng nhập, nhấn 'Quên mật khẩu', nhập email đã đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu qua email."
          },
          {
            id: 9,
            question: "Làm thế nào để cập nhật thông tin cá nhân?",
            answer: "Đăng nhập và vào 'Thông tin cá nhân', bạn có thể chỉnh sửa tên, email, số điện thoại và các thông tin khác."
          }
        ]
      },
      {
        id: 4,
        category: "Rạp chiếu",
        icon: "🏢",
        questions: [
          {
            id: 10,
            question: "CinemaXP có những rạp nào?",
            answer: "Hiện tại CinemaXP có 2 rạp tại TP.HCM và Hà Nội với trang thiết bị hiện đại, âm thanh Dolby Atmos và màn hình 4K."
          },
          {
            id: 11,
            question: "Tôi có thể mang đồ ăn từ bên ngoài vào rạp không?",
            answer: "Để đảm bảo vệ sinh và chất lượng dịch vụ, chúng tôi không cho phép mang đồ ăn từ bên ngoài. Rạp có quầy bán đồ ăn nhẹ và nước uống."
          },
          {
            id: 12,
            question: "Rạp có chỗ đậu xe không?",
            answer: "Tất cả rạp CinemaXP đều có bãi đậu xe miễn phí cho khách hàng. Một số rạp trong trung tâm thương mại có thể tính phí theo giờ."
          }
        ]
      }
    ],
    contactInfo: {
      hotline: "1900 1234",
      email: "support@cinemaxp.vn",
      supportHours: "24/7"
    }
  })

  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState({ show: false, type: '', message: '' })
  const [activeTab, setActiveTab] = useState('faq')

  useEffect(() => {
    loadSupportData()
  }, [])

  const loadSupportData = async () => {
    try {
      console.log('Support data loaded')
    } catch (error) {
      console.error('Error loading support data:', error)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      showAlert('success', 'Cập nhật thông tin hỗ trợ thành công!')
    } catch (error) {
      showAlert('error', 'Có lỗi xảy ra khi cập nhật thông tin hỗ trợ!')
    } finally {
      setLoading(false)
    }
  }

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message })
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3000)
  }

  const handleCategoryChange = (categoryIndex, field, value) => {
    setSupportData(prev => ({
      ...prev,
      faqCategories: prev.faqCategories.map((category, index) => 
        index === categoryIndex ? { ...category, [field]: value } : category
      )
    }))
  }

  const handleQuestionChange = (categoryIndex, questionIndex, field, value) => {
    setSupportData(prev => ({
      ...prev,
      faqCategories: prev.faqCategories.map((category, catIndex) => 
        catIndex === categoryIndex ? {
          ...category,
          questions: category.questions.map((question, qIndex) => 
            qIndex === questionIndex ? { ...question, [field]: value } : question
          )
        } : category
      )
    }))
  }

  const addQuestion = (categoryIndex) => {
    const newQuestion = {
      id: Date.now(),
      question: '',
      answer: ''
    }
    setSupportData(prev => ({
      ...prev,
      faqCategories: prev.faqCategories.map((category, index) => 
        index === categoryIndex ? {
          ...category,
          questions: [...category.questions, newQuestion]
        } : category
      )
    }))
  }

  const removeQuestion = (categoryIndex, questionIndex) => {
    setSupportData(prev => ({
      ...prev,
      faqCategories: prev.faqCategories.map((category, catIndex) => 
        catIndex === categoryIndex ? {
          ...category,
          questions: category.questions.filter((_, qIndex) => qIndex !== questionIndex)
        } : category
      )
    }))
  }

  const addCategory = () => {
    const newCategory = {
      id: Date.now(),
      category: '',
      icon: '❓',
      questions: []
    }
    setSupportData(prev => ({
      ...prev,
      faqCategories: [...prev.faqCategories, newCategory]
    }))
  }

  const removeCategory = (categoryIndex) => {
    setSupportData(prev => ({
      ...prev,
      faqCategories: prev.faqCategories.filter((_, index) => index !== categoryIndex)
    }))
  }

  const handleContactChange = (field, value) => {
    setSupportData(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [field]: value
      }
    }))
  }

  return (
    <Container fluid className="py-4 admin-support-page page-wrapper">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="admin-page-title">
              <span className="title-icon">🆘</span>
              Quản lý Hỗ trợ
            </h2>
            <Button 
              variant="success" 
              onClick={handleSave}
              disabled={loading}
              className="admin-btn-primary"
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Đang lưu...
                </>
              ) : (
                <>💾 Lưu thay đổi</>
              )}
            </Button>
          </div>

          {alert.show && (
            <Alert variant={alert.type === 'success' ? 'success' : 'danger'} className="mb-4">
              {alert.message}
            </Alert>
          )}

          <Card className="admin-card">
            <Card.Body>
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-4"
              >
                
                <Tab eventKey="faq" title="❓ FAQ">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5>Quản lý câu hỏi thường gặp</h5>
                    <Button variant="primary" onClick={addCategory} size="sm">
                      ➕ Thêm danh mục
                    </Button>
                  </div>

                  {supportData.faqCategories.map((category, categoryIndex) => (
                    <Card key={category.id} className="mb-4 border-secondary">
                      <Card.Header className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3">
                          <Form.Control
                            type="text"
                            value={category.icon}
                            onChange={(e) => handleCategoryChange(categoryIndex, 'icon', e.target.value)}
                            style={{ width: '60px' }}
                            placeholder="🎫"
                          />
                          <Form.Control
                            type="text"
                            value={category.category}
                            onChange={(e) => handleCategoryChange(categoryIndex, 'category', e.target.value)}
                            placeholder="Tên danh mục"
                            style={{ width: '200px' }}
                          />
                        </div>
                        <div className="d-flex gap-2">
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => addQuestion(categoryIndex)}
                          >
                            ➕ Thêm câu hỏi
                          </Button>
                          {supportData.faqCategories.length > 1 && (
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => removeCategory(categoryIndex)}
                            >
                              🗑️ Xóa danh mục
                            </Button>
                          )}
                        </div>
                      </Card.Header>
                      <Card.Body>
                        {category.questions.map((question, questionIndex) => (
                          <Card key={question.id} className="mb-3 border-light">
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-start mb-3">
                                <h6 className="mb-0">Câu hỏi {questionIndex + 1}</h6>
                                {category.questions.length > 1 && (
                                  <Button 
                                    variant="outline-danger" 
                                    size="sm"
                                    onClick={() => removeQuestion(categoryIndex, questionIndex)}
                                  >
                                    🗑️
                                  </Button>
                                )}
                              </div>
                              <Row className="g-3">
                                <Col xs={12}>
                                  <Form.Group>
                                    <Form.Label>Câu hỏi</Form.Label>
                                    <Form.Control
                                      type="text"
                                      value={question.question}
                                      onChange={(e) => handleQuestionChange(categoryIndex, questionIndex, 'question', e.target.value)}
                                      placeholder="Nhập câu hỏi"
                                    />
                                  </Form.Group>
                                </Col>
                                <Col xs={12}>
                                  <Form.Group>
                                    <Form.Label>Câu trả lời</Form.Label>
                                    <Form.Control
                                      as="textarea"
                                      rows={3}
                                      value={question.answer}
                                      onChange={(e) => handleQuestionChange(categoryIndex, questionIndex, 'answer', e.target.value)}
                                      placeholder="Nhập câu trả lời"
                                    />
                                  </Form.Group>
                                </Col>
                              </Row>
                            </Card.Body>
                          </Card>
                        ))}
                        
                        {category.questions.length === 0 && (
                          <div className="text-center py-4 text-muted">
                            <p>Chưa có câu hỏi nào trong danh mục này</p>
                            <Button 
                              variant="outline-primary" 
                              onClick={() => addQuestion(categoryIndex)}
                            >
                              ➕ Thêm câu hỏi đầu tiên
                            </Button>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  ))}
                </Tab>

                
                <Tab eventKey="contact" title="📞 Thông tin liên hệ">
                  <Row className="g-4">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>📞 Hotline</Form.Label>
                        <Form.Control
                          type="text"
                          value={supportData.contactInfo.hotline}
                          onChange={(e) => handleContactChange('hotline', e.target.value)}
                          placeholder="Nhập số hotline"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>✉️ Email hỗ trợ</Form.Label>
                        <Form.Control
                          type="email"
                          value={supportData.contactInfo.email}
                          onChange={(e) => handleContactChange('email', e.target.value)}
                          placeholder="Nhập email hỗ trợ"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>🕒 Giờ hỗ trợ</Form.Label>
                        <Form.Control
                          type="text"
                          value={supportData.contactInfo.supportHours}
                          onChange={(e) => handleContactChange('supportHours', e.target.value)}
                          placeholder="Nhập giờ hỗ trợ"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Tab>

                
                <Tab eventKey="preview" title="👁️ Xem trước">
                  <div className="preview-section">
                    <h5 className="mb-4">Xem trước trang Trung tâm trợ giúp</h5>
                    
                    
                    <Card className="mb-4 border-warning">
                      <Card.Header className="bg-warning bg-opacity-10">
                        <h6 className="mb-0">💬 Thông tin liên hệ hỗ trợ</h6>
                      </Card.Header>
                      <Card.Body>
                        <div className="d-flex gap-3 justify-content-center flex-wrap">
                          <Button variant="primary" size="lg">
                            📞 Gọi hotline: {supportData.contactInfo.hotline}
                          </Button>
                          <Button variant="outline-primary" size="lg">
                            ✉️ Email: {supportData.contactInfo.email}
                          </Button>
                        </div>
                        <p className="text-center mt-2 text-muted">
                          Hỗ trợ: {supportData.contactInfo.supportHours}
                        </p>
                      </Card.Body>
                    </Card>

                    
                    {supportData.faqCategories.map((category, index) => (
                      <Card key={category.id} className="mb-3">
                        <Card.Header>
                          <h6 className="mb-0">
                            <span className="me-2">{category.icon}</span>
                            {category.category}
                          </h6>
                        </Card.Header>
                        <Card.Body className="p-0">
                          <Accordion flush>
                            {category.questions.map((faq, qIndex) => (
                              <Accordion.Item key={faq.id} eventKey={`${index}-${qIndex}`}>
                                <Accordion.Header>
                                  {faq.question}
                                </Accordion.Header>
                                <Accordion.Body>
                                  {faq.answer}
                                </Accordion.Body>
                              </Accordion.Item>
                            ))}
                          </Accordion>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}