import { useState } from 'react'
import { Container, Row, Col, Card, Accordion, Form, Button, InputGroup } from 'react-bootstrap'
import './StaticPages.css'

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const faqData = [
    {
      category: "Đặt vé",
      questions: [
        {
          question: "Làm thế nào để đặt vé xem phim?",
          answer: "Bạn có thể đặt vé bằng cách: 1) Chọn phim muốn xem, 2) Chọn suất chiếu phù hợp, 3) Chọn ghế ngồi, 4) Thanh toán và nhận vé điện tử."
        },
        {
          question: "Tôi có thể hủy vé đã đặt không?",
          answer: "Có, bạn có thể hủy vé trước giờ chiếu ít nhất 6 tiếng. Vào 'Vé của tôi' và chọn 'Hủy vé'. Nếu vé đủ điều kiện, nút 'Hủy vé' sẽ hiển thị. Tiền sẽ được hoàn lại trong 3-5 ngày làm việc."
        },
        {
          question: "Tại sao tôi không thể chọn ghế mong muốn?",
          answer: "Ghế có thể đã được đặt bởi khách hàng khác hoặc đang được giữ chỗ tạm thời. Vui lòng chọn ghế khác hoặc thử lại sau vài phút."
        }
      ]
    },
    {
      category: "Thanh toán",
      questions: [
        {
          question: "CinemaXP chấp nhận những phương thức thanh toán nào?",
          answer: "Chúng tôi chấp nhận thẻ tín dụng/ghi nợ (Visa, MasterCard), ví điện tử (MoMo, ZaloPay), và chuyển khoản ngân hàng."
        },
        {
          question: "Làm thế nào để sử dụng voucher giảm giá?",
          answer: "Tại trang thanh toán, nhập mã voucher vào ô 'Mã giảm giá' và nhấn 'Áp dụng'. Hệ thống sẽ tự động tính toán giảm giá nếu voucher hợp lệ."
        },
        {
          question: "Tại sao giao dịch của tôi bị từ chối?",
          answer: "Có thể do: số dư không đủ, thông tin thẻ không chính xác, hoặc ngân hàng từ chối giao dịch. Vui lòng kiểm tra lại hoặc thử phương thức thanh toán khác."
        }
      ]
    },
    {
      category: "Tài khoản",
      questions: [
        {
          question: "Làm thế nào để tạo tài khoản?",
          answer: "Nhấn 'Đăng ký' ở góc trên bên phải, điền thông tin cần thiết và xác nhận email. Bạn sẽ nhận được email kích hoạt tài khoản."
        },
        {
          question: "Tôi quên mật khẩu, phải làm sao?",
          answer: "Tại trang đăng nhập, nhấn 'Quên mật khẩu', nhập email đã đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu qua email."
        },
        {
          question: "Làm thế nào để cập nhật thông tin cá nhân?",
          answer: "Đăng nhập và vào 'Thông tin cá nhân', bạn có thể chỉnh sửa tên, email, số điện thoại và các thông tin khác."
        }
      ]
    },
    {
      category: "Rạp chiếu",
      questions: [
        {
          question: "CinemaXP có những rạp nào?",
          answer: "Hiện tại CinemaXP có 5 rạp tại TP.HCM và Hà Nội với trang thiết bị hiện đại, âm thanh Dolby Atmos và màn hình 4K."
        },
        {
          question: "Tôi có thể mang đồ ăn từ bên ngoài vào rạp không?",
          answer: "Để đảm bảo vệ sinh và chất lượng dịch vụ, chúng tôi không cho phép mang đồ ăn từ bên ngoài. Rạp có quầy bán đồ ăn nhẹ và nước uống."
        },
        {
          question: "Rạp có chỗ đậu xe không?",
          answer: "Tất cả rạp CinemaXP đều có bãi đậu xe miễn phí cho khách hàng. Một số rạp trong trung tâm thương mại có thể tính phí theo giờ."
        }
      ]
    }
  ]

  const filteredFAQ = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
           q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0)

  return (
    <div className="page-wrapper static-page help-page">
      
      <div className="static-page-header">
        <Container>
          <div className="text-center">
            <div className="static-page-icon">🆘</div>
            <h1 className="static-page-title">Trung tâm trợ giúp</h1>
            <p className="static-page-subtitle">
              Tìm câu trả lời cho các câu hỏi thường gặp và nhận hỗ trợ nhanh chóng
            </p>
          </div>
        </Container>
      </div>

      <Container className="py-5">
        
        <Row className="justify-content-center mb-5">
          <Col lg={6}>
            <Card className="search-card">
              <Card.Body className="p-4">
                <h5 className="text-center mb-3">🔍 Tìm kiếm câu hỏi</h5>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Nhập từ khóa để tìm kiếm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                  <Button variant="outline-primary">
                    Tìm kiếm
                  </Button>
                </InputGroup>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        
        <Row>
          <Col lg={8} className="mx-auto">
            {filteredFAQ.length === 0 ? (
              <Card className="text-center p-5">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤔</div>
                <h5>Không tìm thấy kết quả</h5>
                <p className="text-muted">Thử tìm kiếm với từ khóa khác hoặc liên hệ với chúng tôi để được hỗ trợ.</p>
              </Card>
            ) : (
              filteredFAQ.map((category, categoryIndex) => (
                <Card key={categoryIndex} className="faq-category-card mb-4">
                  <Card.Header className="faq-category-header">
                    <h4 className="mb-0">
                      <span className="category-icon">
                        {category.category === 'Đặt vé' && '🎫'}
                        {category.category === 'Thanh toán' && '💳'}
                        {category.category === 'Tài khoản' && '👤'}
                        {category.category === 'Rạp chiếu' && '🏢'}
                      </span>
                      {category.category}
                    </h4>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <Accordion flush>
                      {category.questions.map((faq, index) => (
                        <Accordion.Item key={index} eventKey={`${categoryIndex}-${index}`}>
                          <Accordion.Header className="faq-question">
                            {faq.question}
                          </Accordion.Header>
                          <Accordion.Body className="faq-answer">
                            {faq.answer}
                          </Accordion.Body>
                        </Accordion.Item>
                      ))}
                    </Accordion>
                  </Card.Body>
                </Card>
              ))
            )}
          </Col>
        </Row>

        
        <Row className="justify-content-center mt-5">
          <Col lg={8}>
            <Card className="contact-support-card">
              <Card.Body className="text-center p-5">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                <h4>Không tìm thấy câu trả lời?</h4>
                <p className="text-muted mb-4">
                  Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn 24/7
                </p>
                <div className="d-flex gap-3 justify-content-center flex-wrap">
                  <Button variant="primary" size="lg">
                    📞 Gọi hotline: 1900 1234
                  </Button>
                  <Button variant="outline-primary" size="lg">
                    ✉️ Email: support@cinemaxp.vn
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}