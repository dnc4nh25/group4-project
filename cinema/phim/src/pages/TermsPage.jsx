import { Container, Row, Col, Card } from 'react-bootstrap'
import './StaticPages.css'

export default function TermsPage() {
  return (
    <div className="page-wrapper static-page terms-page">
      
      <div className="static-page-header">
        <Container>
          <div className="text-center">
            <div className="static-page-icon">📋</div>
            <h1 className="static-page-title">Điều khoản sử dụng</h1>
            <p className="static-page-subtitle">
              Các điều khoản và điều kiện sử dụng dịch vụ CinemaXP
            </p>
            <p className="text-muted small">Cập nhật lần cuối: 01/01/2024</p>
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
                    <h3>1. Chấp nhận điều khoản</h3>
                    <p>
                      Bằng việc truy cập và sử dụng website CinemaXP, bạn đồng ý tuân thủ và bị ràng buộc bởi
                      các điều khoản và điều kiện sử dụng này. Nếu bạn không đồng ý với bất kỳ phần nào của
                      các điều khoản này, vui lòng không sử dụng dịch vụ của chúng tôi.
                    </p>
                  </section>

                  <section className="terms-section">
                    <h3>2. Định nghĩa</h3>
                    <ul>
                      <li><strong>"CinemaXP"</strong> - Hệ thống rạp chiếu phim và dịch vụ đặt vé trực tuyến</li>
                      <li><strong>"Người dùng"</strong> - Bất kỳ cá nhân nào truy cập và sử dụng dịch vụ</li>
                      <li><strong>"Dịch vụ"</strong> - Tất cả các dịch vụ được cung cấp qua website và ứng dụng</li>
                      <li><strong>"Nội dung"</strong> - Thông tin, văn bản, hình ảnh, video trên website</li>
                    </ul>
                  </section>

                  <section className="terms-section">
                    <h3>3. Đăng ký tài khoản</h3>
                    <p>
                      Để sử dụng một số tính năng của dịch vụ, bạn cần tạo tài khoản. Bạn cam kết:
                    </p>
                    <ul>
                      <li>Cung cấp thông tin chính xác, đầy đủ và cập nhật</li>
                      <li>Bảo mật thông tin đăng nhập và chịu trách nhiệm về mọi hoạt động trong tài khoản</li>
                      <li>Thông báo ngay cho chúng tôi nếu phát hiện việc sử dụng trái phép tài khoản</li>
                      <li>Không tạo tài khoản giả mạo hoặc sử dụng tài khoản của người khác</li>
                    </ul>
                  </section>

                  <section className="terms-section">
                    <h3>4. Đặt vé và thanh toán</h3>
                    <h4>4.1 Quy trình đặt vé</h4>
                    <ul>
                      <li>Chọn phim, suất chiếu và ghế ngồi</li>
                      <li>Xác nhận thông tin và thanh toán</li>
                      <li>Nhận vé điện tử qua email hoặc SMS</li>
                    </ul>

                    <h4>4.2 Thanh toán</h4>
                    <ul>
                      <li>Chấp nhận các phương thức: thẻ tín dụng, ví điện tử, chuyển khoản</li>
                      <li>Giá vé đã bao gồm VAT và các phí liên quan</li>
                      <li>Giao dịch được xử lý an toàn qua cổng thanh toán được chứng nhận</li>
                    </ul>

                    <h4>4.3 Hủy vé và hoàn tiền</h4>
                    <ul>
                      <li>Có thể hủy vé trước giờ chiếu ít nhất 2 tiếng</li>
                      <li>Phí hủy vé: 10% giá trị vé (tối thiểu 10,000đ)</li>
                      <li>Tiền hoàn sẽ được chuyển về tài khoản trong 3-5 ngày làm việc</li>
                      <li>Không hoàn tiền trong trường hợp khách hàng không đến xem</li>
                    </ul>
                  </section>

                  <section className="terms-section">
                    <h3>5. Quy định sử dụng</h3>
                    <p>Bạn đồng ý không sử dụng dịch vụ để:</p>
                    <ul>
                      <li>Vi phạm pháp luật hoặc quyền của bên thứ ba</li>
                      <li>Gửi spam, virus, hoặc mã độc hại</li>
                      <li>Can thiệp vào hoạt động bình thường của hệ thống</li>
                      <li>Thu thập thông tin người dùng khác trái phép</li>
                      <li>Sử dụng robot, bot hoặc công cụ tự động</li>
                    </ul>
                  </section>

                  <section className="terms-section">
                    <h3>6. Quyền sở hữu trí tuệ</h3>
                    <p>
                      Tất cả nội dung trên website bao gồm văn bản, hình ảnh, logo, thiết kế đều thuộc
                      quyền sở hữu của CinemaXP hoặc được cấp phép sử dụng hợp pháp. Bạn không được:
                    </p>
                    <ul>
                      <li>Sao chép, phân phối hoặc sử dụng nội dung cho mục đích thương mại</li>
                      <li>Chỉnh sửa, tạo phiên bản phái sinh từ nội dung</li>
                      <li>Gỡ bỏ các thông báo bản quyền</li>
                    </ul>
                  </section>

                  <section className="terms-section">
                    <h3>7. Giới hạn trách nhiệm</h3>
                    <p>
                      CinemaXP không chịu trách nhiệm về:
                    </p>
                    <ul>
                      <li>Thiệt hại gián tiếp, ngẫu nhiên hoặc hậu quả</li>
                      <li>Mất mát dữ liệu hoặc lợi nhuận</li>
                      <li>Gián đoạn dịch vụ do sự cố kỹ thuật</li>
                      <li>Hành vi của bên thứ ba</li>
                    </ul>
                    <p>
                      Trách nhiệm tối đa của chúng tôi không vượt quá giá trị giao dịch gây ra thiệt hại.
                    </p>
                  </section>

                  <section className="terms-section">
                    <h3>8. Bảo mật thông tin</h3>
                    <p>
                      Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn theo Chính sách bảo mật.
                      Tuy nhiên, không có hệ thống nào hoàn toàn an toàn 100%. Bạn sử dụng dịch vụ
                      với sự hiểu biết về rủi ro này.
                    </p>
                  </section>

                  <section className="terms-section">
                    <h3>9. Thay đổi điều khoản</h3>
                    <p>
                      CinemaXP có quyền thay đổi các điều khoản này bất kỳ lúc nào. Thay đổi sẽ có hiệu lực
                      ngay khi được đăng tải trên website. Việc tiếp tục sử dụng dịch vụ sau khi thay đổi
                      được coi là chấp nhận các điều khoản mới.
                    </p>
                  </section>

                  <section className="terms-section">
                    <h3>10. Chấm dứt dịch vụ</h3>
                    <p>
                      Chúng tôi có quyền tạm ngừng hoặc chấm dứt tài khoản của bạn nếu vi phạm điều khoản
                      sử dụng. Bạn cũng có thể chấm dứt tài khoản bất kỳ lúc nào bằng cách liên hệ với
                      chúng tôi.
                    </p>
                  </section>

                  <section className="terms-section">
                    <h3>11. Luật áp dụng</h3>
                    <p>
                      Các điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Mọi tranh chấp sẽ được
                      giải quyết tại Tòa án có thẩm quyền tại TP. Hồ Chí Minh.
                    </p>
                  </section>

                  <section className="terms-section">
                    <h3>12. Liên hệ</h3>
                    <p>
                      Nếu bạn có câu hỏi về các điều khoản này, vui lòng liên hệ:
                    </p>
                    <ul>
                      <li>Email: legal@cinemaxp.vn</li>
                      <li>Hotline: 1900 1234</li>
                      <li>Địa chỉ: 123 Đường Điện Ảnh, Quận 1, TP.HCM</li>
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