import { Container, Row, Col, Card } from 'react-bootstrap'
import './StaticPages.css'

export default function PrivacyPage() {
  return (
    <div className="page-wrapper static-page privacy-page">
      
      <div className="static-page-header">
        <Container>
          <div className="text-center">
            <div className="static-page-icon">??</div>
            <h1 className="static-page-title">Chính sách b?o m?t</h1>
            <p className="static-page-subtitle">
              Cam k?t b?o v? thông tin cá nhân và quy?n riêng tu c?a b?n
            </p>
            <p className="text-muted small">C?p nh?t l?n cu?i: 01/01/2024</p>
          </div>
        </Container>
      </div>

      <Container className="py-5">
        <Row>
          <Col lg={8} className="mx-auto">
            <Card className="privacy-content-card">
              <Card.Body className="p-5">
                <div className="privacy-content">
                  <section className="privacy-section">
                    <h3>1. Gi?i thi?u</h3>
                    <p>
                      CinemaXP cam k?t b?o v? quy?n riêng tu và thông tin cá nhân c?a b?n. Chính sách này 
                      gi?i thích cách chúng tôi thu th?p, s? d?ng, luu tr? và b?o v? thông tin c?a b?n 
                      khi s? d?ng d?ch v? c?a chúng tôi.
                    </p>
                  </section>

                  <section className="privacy-section">
                    <h3>2. Thông tin chúng tôi thu th?p</h3>
                    
                    <h4>2.1 Thông tin b?n cung c?p</h4>
                    <ul>
                      <li><strong>Thông tin tài kho?n:</strong> H? tên, email, s? di?n tho?i, m?t kh?u</li>
                      <li><strong>Thông tin thanh toán:</strong> Thông tin th? tín d?ng, d?a ch? thanh toán</li>
                      <li><strong>Thông tin liên h?:</strong> Tin nh?n, ph?n h?i, yêu c?u h? tr?</li>
                      <li><strong>Thông tin kh?o sát:</strong> Ý ki?n dánh giá v? d?ch v?</li>
                    </ul>

                    <h4>2.2 Thông tin t? d?ng thu th?p</h4>
                    <ul>
                      <li><strong>Thông tin thi?t b?:</strong> Lo?i thi?t b?, h? di?u hành, trình duy?t</li>
                      <li><strong>Thông tin s? d?ng:</strong> Trang web truy c?p, th?i gian s? d?ng</li>
                      <li><strong>Ð?a ch? IP:</strong> Ð? xác d?nh v? trí và b?o m?t</li>
                      <li><strong>Cookies:</strong> Ð? c?i thi?n tr?i nghi?m ngu?i dùng</li>
                    </ul>

                    <h4>2.3 Thông tin t? bên th? ba</h4>
                    <ul>
                      <li>Thông tin t? m?ng xã h?i khi b?n dang nh?p qua Facebook, Google</li>
                      <li>Thông tin t? d?i tác thanh toán d? x? lý giao d?ch</li>
                    </ul>
                  </section>

                  <section className="privacy-section">
                    <h3>3. Cách chúng tôi s? d?ng thông tin</h3>
                    <p>Chúng tôi s? d?ng thông tin c?a b?n d?:</p>
                    
                    <h4>3.1 Cung c?p d?ch v?</h4>
                    <ul>
                      <li>T?o và qu?n lý tài kho?n</li>
                      <li>X? lý d?t vé và thanh toán</li>
                      <li>G?i xác nh?n và thông tin vé</li>
                      <li>Cung c?p h? tr? khách hàng</li>
                    </ul>

                    <h4>3.2 C?i thi?n d?ch v?</h4>
                    <ul>
                      <li>Phân tích hành vi s? d?ng d? c?i thi?n website</li>
                      <li>Phát tri?n tính nang m?i</li>
                      <li>Kh?c ph?c l?i và v?n d? k? thu?t</li>
                    </ul>

                    <h4>3.3 Marketing và truy?n thông</h4>
                    <ul>
                      <li>G?i thông tin khuy?n mãi, uu dãi (v?i s? d?ng ý)</li>
                      <li>G?i newsletter v? phim m?i, s? ki?n</li>
                      <li>Qu?ng cáo du?c cá nhân hóa</li>
                    </ul>

                    <h4>3.4 B?o m?t và tuân th? pháp lu?t</h4>
                    <ul>
                      <li>Phát hi?n và ngan ch?n gian l?n</li>
                      <li>Tuân th? nghia v? pháp lý</li>
                      <li>B?o v? quy?n l?i c?a CinemaXP và ngu?i dùng</li>
                    </ul>
                  </section>

                  <section className="privacy-section">
                    <h3>4. Chia s? thông tin</h3>
                    <p>Chúng tôi không bán thông tin cá nhân c?a b?n. Chúng tôi ch? chia s? trong các tru?ng h?p:</p>
                    
                    <h4>4.1 V?i s? d?ng ý c?a b?n</h4>
                    <p>Khi b?n cho phép chia s? thông tin cho m?c dích c? th?.</p>

                    <h4>4.2 V?i d?i tác d?ch v?</h4>
                    <ul>
                      <li>Nhà cung c?p d?ch v? thanh toán</li>
                      <li>D?ch v? email và SMS</li>
                      <li>D?ch v? phân tích và qu?ng cáo</li>
                      <li>D?ch v? luu tr? dám mây</li>
                    </ul>

                    <h4>4.3 Yêu c?u pháp lý</h4>
                    <p>Khi du?c yêu c?u b?i co quan có th?m quy?n theo quy d?nh pháp lu?t.</p>

                    <h4>4.4 B?o v? quy?n l?i</h4>
                    <p>Ð? b?o v? quy?n, tài s?n và an toàn c?a CinemaXP, ngu?i dùng và công chúng.</p>
                  </section>

                  <section className="privacy-section">
                    <h3>5. B?o m?t thông tin</h3>
                    <p>Chúng tôi áp d?ng các bi?n pháp b?o m?t k? thu?t và t? ch?c:</p>
                    
                    <h4>5.1 B?o m?t k? thu?t</h4>
                    <ul>
                      <li>Mã hóa SSL/TLS cho t?t c? d? li?u truy?n t?i</li>
                      <li>Mã hóa d? li?u nh?y c?m trong co s? d? li?u</li>
                      <li>Tu?ng l?a và h? th?ng phát hi?n xâm nh?p</li>
                      <li>Ki?m tra b?o m?t d?nh k?</li>
                    </ul>

                    <h4>5.2 B?o m?t t? ch?c</h4>
                    <ul>
                      <li>Gi?i h?n quy?n truy c?p d? li?u</li>
                      <li>Ðào t?o nhân viên v? b?o m?t</li>
                      <li>Chính sách m?t kh?u m?nh</li>
                      <li>Giám sát và ghi log truy c?p</li>
                    </ul>
                  </section>

                  <section className="privacy-section">
                    <h3>6. Luu tr? và xóa d? li?u</h3>
                    
                    <h4>6.1 Th?i gian luu tr?</h4>
                    <ul>
                      <li><strong>Thông tin tài kho?n:</strong> Cho d?n khi b?n xóa tài kho?n</li>
                      <li><strong>L?ch s? giao d?ch:</strong> 7 nam theo quy d?nh pháp lu?t</li>
                      <li><strong>D? li?u phân tích:</strong> 2 nam</li>
                      <li><strong>Logs h? th?ng:</strong> 1 nam</li>
                    </ul>

                    <h4>6.2 Xóa d? li?u</h4>
                    <p>
                      B?n có th? yêu c?u xóa d? li?u cá nhân. Chúng tôi s? xóa trong vòng 30 ngày, 
                      tr? khi c?n gi? l?i theo quy d?nh pháp lu?t.
                    </p>
                  </section>

                  <section className="privacy-section">
                    <h3>7. Quy?n c?a b?n</h3>
                    <p>B?n có các quy?n sau d?i v?i thông tin cá nhân:</p>
                    
                    <ul>
                      <li><strong>Quy?n truy c?p:</strong> Yêu c?u xem thông tin chúng tôi có v? b?n</li>
                      <li><strong>Quy?n ch?nh s?a:</strong> C?p nh?t thông tin không chính xác</li>
                      <li><strong>Quy?n xóa:</strong> Yêu c?u xóa thông tin cá nhân</li>
                      <li><strong>Quy?n h?n ch?:</strong> Gi?i h?n cách s? d?ng thông tin</li>
                      <li><strong>Quy?n di chuy?n:</strong> Nh?n b?n sao d? li?u c?a b?n</li>
                      <li><strong>Quy?n ph?n d?i:</strong> T? ch?i x? lý d? li?u cho m?c dích marketing</li>
                    </ul>

                    <p>Ð? th?c hi?n các quy?n này, liên h?: privacy@cinemaxp.vn</p>
                  </section>

                  <section className="privacy-section">
                    <h3>8. Cookies và công ngh? theo dõi</h3>
                    
                    <h4>8.1 Lo?i cookies chúng tôi s? d?ng</h4>
                    <ul>
                      <li><strong>Cookies c?n thi?t:</strong> Ð? website ho?t d?ng bình thu?ng</li>
                      <li><strong>Cookies hi?u su?t:</strong> Ð? phân tích cách s? d?ng website</li>
                      <li><strong>Cookies ch?c nang:</strong> Ð? ghi nh? tùy ch?n c?a b?n</li>
                      <li><strong>Cookies qu?ng cáo:</strong> Ð? hi?n th? qu?ng cáo phù h?p</li>
                    </ul>

                    <h4>8.2 Qu?n lý cookies</h4>
                    <p>
                      B?n có th? qu?n lý cookies qua cài d?t trình duy?t. Tuy nhiên, vi?c t?t cookies 
                      có th? ?nh hu?ng d?n tr?i nghi?m s? d?ng website.
                    </p>
                  </section>

                  <section className="privacy-section">
                    <h3>9. Tr? em</h3>
                    <p>
                      D?ch v? c?a chúng tôi không dành cho tr? em du?i 13 tu?i. Chúng tôi không c? ý 
                      thu th?p thông tin t? tr? em du?i 13 tu?i. N?u phát hi?n, chúng tôi s? xóa 
                      thông tin dó ngay l?p t?c.
                    </p>
                  </section>

                  <section className="privacy-section">
                    <h3>10. Chuy?n giao d? li?u qu?c t?</h3>
                    <p>
                      D? li?u c?a b?n có th? du?c x? lý t?i các qu?c gia khác có lu?t b?o m?t khác bi?t. 
                      Chúng tôi d?m b?o áp d?ng các bi?n pháp b?o v? phù h?p.
                    </p>
                  </section>

                  <section className="privacy-section">
                    <h3>11. Thay d?i chính sách</h3>
                    <p>
                      Chúng tôi có th? c?p nh?t chính sách này. Thay d?i quan tr?ng s? du?c thông báo 
                      qua email ho?c thông báo trên website tru?c khi có hi?u l?c.
                    </p>
                  </section>

                  <section className="privacy-section">
                    <h3>12. Liên h?</h3>
                    <p>
                      N?u b?n có câu h?i v? chính sách b?o m?t này, liên h?:
                    </p>
                    <ul>
                      <li><strong>Email:</strong> privacy@cinemaxp.vn</li>
                      <li><strong>Hotline:</strong> 1900 1234</li>
                      <li><strong>Ð?a ch?:</strong> 123 Ðu?ng Ði?n ?nh, Qu?n 1, TP.HCM</li>
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
