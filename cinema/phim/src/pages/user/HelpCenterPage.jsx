import { useState } from 'react'
import { Container, Row, Col, Card, Accordion, Form, Button, InputGroup } from 'react-bootstrap'
import './StaticPages.css'

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const faqData = [
    {
      category: "Ð?t vé",
      questions: [
        {
          question: "Làm th? nào d? d?t vé xem phim?",
          answer: "B?n có th? d?t vé b?ng cách: 1) Ch?n phim mu?n xem, 2) Ch?n su?t chi?u phù h?p, 3) Ch?n gh? ng?i, 4) Thanh toán và nh?n vé di?n t?."
        },
        {
          question: "Tôi có th? h?y vé dã d?t không?",
          answer: "Có, b?n có th? h?y vé tru?c gi? chi?u ít nh?t 2 ti?ng. Vào 'Vé c?a tôi' và ch?n 'H?y vé'. Ti?n s? du?c hoàn l?i trong 3-5 ngày làm vi?c."
        },
        {
          question: "T?i sao tôi không th? ch?n gh? mong mu?n?",
          answer: "Gh? có th? dã du?c d?t b?i khách hàng khác ho?c dang du?c gi? ch? t?m th?i. Vui lòng ch?n gh? khác ho?c th? l?i sau vài phút."
        }
      ]
    },
    {
      category: "Thanh toán",
      questions: [
        {
          question: "CinemaXP ch?p nh?n nh?ng phuong th?c thanh toán nào?",
          answer: "Chúng tôi ch?p nh?n th? tín d?ng/ghi n? (Visa, MasterCard), ví di?n t? (MoMo, ZaloPay), và chuy?n kho?n ngân hàng."
        },
        {
          question: "Làm th? nào d? s? d?ng voucher gi?m giá?",
          answer: "T?i trang thanh toán, nh?p mã voucher vào ô 'Mã gi?m giá' và nh?n 'Áp d?ng'. H? th?ng s? t? d?ng tính toán gi?m giá n?u voucher h?p l?."
        },
        {
          question: "T?i sao giao d?ch c?a tôi b? t? ch?i?",
          answer: "Có th? do: s? du không d?, thông tin th? không chính xác, ho?c ngân hàng t? ch?i giao d?ch. Vui lòng ki?m tra l?i ho?c th? phuong th?c thanh toán khác."
        }
      ]
    },
    {
      category: "Tài kho?n",
      questions: [
        {
          question: "Làm th? nào d? t?o tài kho?n?",
          answer: "Nh?n 'Ðang ký' ? góc trên bên ph?i, di?n thông tin c?n thi?t và xác nh?n email. B?n s? nh?n du?c email kích ho?t tài kho?n."
        },
        {
          question: "Tôi quên m?t kh?u, ph?i làm sao?",
          answer: "T?i trang dang nh?p, nh?n 'Quên m?t kh?u', nh?p email dã dang ký. Chúng tôi s? g?i link d?t l?i m?t kh?u qua email."
        },
        {
          question: "Làm th? nào d? c?p nh?t thông tin cá nhân?",
          answer: "Ðang nh?p và vào 'Thông tin cá nhân', b?n có th? ch?nh s?a tên, email, s? di?n tho?i và các thông tin khác."
        }
      ]
    },
    {
      category: "R?p chi?u",
      questions: [
        {
          question: "CinemaXP có nh?ng r?p nào?",
          answer: "Hi?n t?i CinemaXP có 5 r?p t?i TP.HCM và Hà N?i v?i trang thi?t b? hi?n d?i, âm thanh Dolby Atmos và màn hình 4K."
        },
        {
          question: "Tôi có th? mang d? an t? bên ngoài vào r?p không?",
          answer: "Ð? d?m b?o v? sinh và ch?t lu?ng d?ch v?, chúng tôi không cho phép mang d? an t? bên ngoài. R?p có qu?y bán d? an nh? và nu?c u?ng."
        },
        {
          question: "R?p có ch? d?u xe không?",
          answer: "T?t c? r?p CinemaXP d?u có bãi d?u xe mi?n phí cho khách hàng. M?t s? r?p trong trung tâm thuong m?i có th? tính phí theo gi?."
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
            <div className="static-page-icon">??</div>
            <h1 className="static-page-title">Trung tâm tr? giúp</h1>
            <p className="static-page-subtitle">
              Tìm câu tr? l?i cho các câu h?i thu?ng g?p và nh?n h? tr? nhanh chóng
            </p>
          </div>
        </Container>
      </div>

      <Container className="py-5">
        
        <Row className="justify-content-center mb-5">
          <Col lg={6}>
            <Card className="search-card">
              <Card.Body className="p-4">
                <h5 className="text-center mb-3">?? Tìm ki?m câu h?i</h5>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Nh?p t? khóa d? tìm ki?m..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                  <Button variant="outline-primary">
                    Tìm ki?m
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
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>??</div>
                <h5>Không tìm th?y k?t qu?</h5>
                <p className="text-muted">Th? tìm ki?m v?i t? khóa khác ho?c liên h? v?i chúng tôi d? du?c h? tr?.</p>
              </Card>
            ) : (
              filteredFAQ.map((category, categoryIndex) => (
                <Card key={categoryIndex} className="faq-category-card mb-4">
                  <Card.Header className="faq-category-header">
                    <h4 className="mb-0">
                      <span className="category-icon">
                        {category.category === 'Ð?t vé' && '??'}
                        {category.category === 'Thanh toán' && '??'}
                        {category.category === 'Tài kho?n' && '??'}
                        {category.category === 'R?p chi?u' && '??'}
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
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>??</div>
                <h4>Không tìm th?y câu tr? l?i?</h4>
                <p className="text-muted mb-4">
                  Ð?i ngu h? tr? c?a chúng tôi luôn s?n sàng giúp d? b?n 24/7
                </p>
                <div className="d-flex gap-3 justify-content-center flex-wrap">
                  <Button variant="primary" size="lg">
                    ?? G?i hotline: 1900 1234
                  </Button>
                  <Button variant="outline-primary" size="lg">
                    ?? Email: support@cinemaxp.vn
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
