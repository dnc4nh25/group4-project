import { Container, Row, Col, Card } from 'react-bootstrap'
import './StaticPages.css'

export default function TermsPage() {
  return (
    <div className="page-wrapper static-page terms-page">
      
      <div className="static-page-header">
        <Container>
          <div className="text-center">
            <div className="static-page-icon">??</div>
            <h1 className="static-page-title">Ði?u kho?n s? d?ng</h1>
            <p className="static-page-subtitle">
              Các di?u kho?n và di?u ki?n s? d?ng d?ch v? CinemaXP
            </p>
            <p className="text-muted small">C?p nh?t l?n cu?i: 01/01/2024</p>
          </div>
        </Container>
      </div>

      <Container className="py-5">
        <Row>
          <Col lg={8} className="mx-auto">
            <Card className="terms-content-card">
              <Card.Body className="p-5">
                <div className="terms-content">
                  <section className="terms-section">
                    <h3>1. Ch?p nh?n di?u kho?n</h3>
                    <p>
                      B?ng vi?c truy c?p và s? d?ng website CinemaXP, b?n d?ng ý tuân th? và b? ràng bu?c b?i
                      các di?u kho?n và di?u ki?n s? d?ng này. N?u b?n không d?ng ý v?i b?t k? ph?n nào c?a
                      các di?u kho?n này, vui lòng không s? d?ng d?ch v? c?a chúng tôi.
                    </p>
                  </section>

                  <section className="terms-section">
                    <h3>2. Ð?nh nghia</h3>
                    <ul>
                      <li><strong>"CinemaXP"</strong> - H? th?ng r?p chi?u phim và d?ch v? d?t vé tr?c tuy?n</li>
                      <li><strong>"Ngu?i dùng"</strong> - B?t k? cá nhân nào truy c?p và s? d?ng d?ch v?</li>
                      <li><strong>"D?ch v?"</strong> - T?t c? các d?ch v? du?c cung c?p qua website và ?ng d?ng</li>
                      <li><strong>"N?i dung"</strong> - Thông tin, van b?n, hình ?nh, video trên website</li>
                    </ul>
                  </section>

                  <section className="terms-section">
                    <h3>3. Ðang ký tài kho?n</h3>
                    <p>
                      Ð? s? d?ng m?t s? tính nang c?a d?ch v?, b?n c?n t?o tài kho?n. B?n cam k?t:
                    </p>
                    <ul>
                      <li>Cung c?p thông tin chính xác, d?y d? và c?p nh?t</li>
                      <li>B?o m?t thông tin dang nh?p và ch?u trách nhi?m v? m?i ho?t d?ng trong tài kho?n</li>
                      <li>Thông báo ngay cho chúng tôi n?u phát hi?n vi?c s? d?ng trái phép tài kho?n</li>
                      <li>Không t?o tài kho?n gi? m?o ho?c s? d?ng tài kho?n c?a ngu?i khác</li>
                    </ul>
                  </section>

                  <section className="terms-section">
                    <h3>4. Ð?t vé và thanh toán</h3>
                    <h4>4.1 Quy trình d?t vé</h4>
                    <ul>
                      <li>Ch?n phim, su?t chi?u và gh? ng?i</li>
                      <li>Xác nh?n thông tin và thanh toán</li>
                      <li>Nh?n vé di?n t? qua email ho?c SMS</li>
                    </ul>

                    <h4>4.2 Thanh toán</h4>
                    <ul>
                      <li>Ch?p nh?n các phuong th?c: th? tín d?ng, ví di?n t?, chuy?n kho?n</li>
                      <li>Giá vé dã bao g?m VAT và các phí liên quan</li>
                      <li>Giao d?ch du?c x? lý an toàn qua c?ng thanh toán du?c ch?ng nh?n</li>
                    </ul>

                    <h4>4.3 H?y vé và hoàn ti?n</h4>
                    <ul>
                      <li>Có th? h?y vé tru?c gi? chi?u ít nh?t 2 ti?ng</li>
                      <li>Phí h?y vé: 10% giá tr? vé (t?i thi?u 10,000d)</li>
                      <li>Ti?n hoàn s? du?c chuy?n v? tài kho?n trong 3-5 ngày làm vi?c</li>
                      <li>Không hoàn ti?n trong tru?ng h?p khách hàng không d?n xem</li>
                    </ul>
                  </section>

                  <section className="terms-section">
                    <h3>5. Quy d?nh s? d?ng</h3>
                    <p>B?n d?ng ý không s? d?ng d?ch v? d?:</p>
                    <ul>
                      <li>Vi ph?m pháp lu?t ho?c quy?n c?a bên th? ba</li>
                      <li>G?i spam, virus, ho?c mã d?c h?i</li>
                      <li>Can thi?p vào ho?t d?ng bình thu?ng c?a h? th?ng</li>
                      <li>Thu th?p thông tin ngu?i dùng khác trái phép</li>
                      <li>S? d?ng robot, bot ho?c công c? t? d?ng</li>
                    </ul>
                  </section>

                  <section className="terms-section">
                    <h3>6. Quy?n s? h?u trí tu?</h3>
                    <p>
                      T?t c? n?i dung trên website bao g?m van b?n, hình ?nh, logo, thi?t k? d?u thu?c
                      quy?n s? h?u c?a CinemaXP ho?c du?c c?p phép s? d?ng h?p pháp. B?n không du?c:
                    </p>
                    <ul>
                      <li>Sao chép, phân ph?i ho?c s? d?ng n?i dung cho m?c dích thuong m?i</li>
                      <li>Ch?nh s?a, t?o phiên b?n phái sinh t? n?i dung</li>
                      <li>G? b? các thông báo b?n quy?n</li>
                    </ul>
                  </section>

                  <section className="terms-section">
                    <h3>7. Gi?i h?n trách nhi?m</h3>
                    <p>
                      CinemaXP không ch?u trách nhi?m v?:
                    </p>
                    <ul>
                      <li>Thi?t h?i gián ti?p, ng?u nhiên ho?c h?u qu?</li>
                      <li>M?t mát d? li?u ho?c l?i nhu?n</li>
                      <li>Gián do?n d?ch v? do s? c? k? thu?t</li>
                      <li>Hành vi c?a bên th? ba</li>
                    </ul>
                    <p>
                      Trách nhi?m t?i da c?a chúng tôi không vu?t quá giá tr? giao d?ch gây ra thi?t h?i.
                    </p>
                  </section>

                  <section className="terms-section">
                    <h3>8. B?o m?t thông tin</h3>
                    <p>
                      Chúng tôi cam k?t b?o v? thông tin cá nhân c?a b?n theo Chính sách b?o m?t.
                      Tuy nhiên, không có h? th?ng nào hoàn toàn an toàn 100%. B?n s? d?ng d?ch v?
                      v?i s? hi?u bi?t v? r?i ro này.
                    </p>
                  </section>

                  <section className="terms-section">
                    <h3>9. Thay d?i di?u kho?n</h3>
                    <p>
                      CinemaXP có quy?n thay d?i các di?u kho?n này b?t k? lúc nào. Thay d?i s? có hi?u l?c
                      ngay khi du?c dang t?i trên website. Vi?c ti?p t?c s? d?ng d?ch v? sau khi thay d?i
                      du?c coi là ch?p nh?n các di?u kho?n m?i.
                    </p>
                  </section>

                  <section className="terms-section">
                    <h3>10. Ch?m d?t d?ch v?</h3>
                    <p>
                      Chúng tôi có quy?n t?m ng?ng ho?c ch?m d?t tài kho?n c?a b?n n?u vi ph?m di?u kho?n
                      s? d?ng. B?n cung có th? ch?m d?t tài kho?n b?t k? lúc nào b?ng cách liên h? v?i
                      chúng tôi.
                    </p>
                  </section>

                  <section className="terms-section">
                    <h3>11. Lu?t áp d?ng</h3>
                    <p>
                      Các di?u kho?n này du?c di?u ch?nh b?i pháp lu?t Vi?t Nam. M?i tranh ch?p s? du?c
                      gi?i quy?t t?i Tòa án có th?m quy?n t?i TP. H? Chí Minh.
                    </p>
                  </section>

                  <section className="terms-section">
                    <h3>12. Liên h?</h3>
                    <p>
                      N?u b?n có câu h?i v? các di?u kho?n này, vui lòng liên h?:
                    </p>
                    <ul>
                      <li>Email: legal@cinemaxp.vn</li>
                      <li>Hotline: 1900 1234</li>
                      <li>Ð?a ch?: 123 Ðu?ng Ði?n ?nh, Qu?n 1, TP.HCM</li>
                    </ul>
                  </section>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}
