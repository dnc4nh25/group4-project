import { Container, Row, Col, Card } from 'react-bootstrap'
import './StaticPages.css'

export default function PrivacyPage() {
  return (
    <div className="page-wrapper static-page privacy-page">
      
      <div className="static-page-header">
        <Container>
          <div className="text-center">
            <div className="static-page-icon">🔒</div>
            <h1 className="static-page-title">Chính sách bảo mật</h1>
            <p className="static-page-subtitle">
              Cam kết bảo vệ thông tin cá nhân và quyền riêng tư của bạn
            </p>
            <p className="text-muted small">Cập nhật lần cuối: 01/01/2024</p>
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
                    <h3>1. Giới thiệu</h3>
                    <p>
                      CinemaXP cam kết bảo vệ quyền riêng tư và thông tin cá nhân của bạn. Chính sách này 
                      giải thích cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ thông tin của bạn 
                      khi sử dụng dịch vụ của chúng tôi.
                    </p>
                  </section>

                  <section className="privacy-section">
                    <h3>2. Thông tin chúng tôi thu thập</h3>
                    
                    <h4>2.1 Thông tin bạn cung cấp</h4>
                    <ul>
                      <li><strong>Thông tin tài khoản:</strong> Họ tên, email, số điện thoại, mật khẩu</li>
                      <li><strong>Thông tin thanh toán:</strong> Thông tin thẻ tín dụng, địa chỉ thanh toán</li>
                      <li><strong>Thông tin liên hệ:</strong> Tin nhắn, phản hồi, yêu cầu hỗ trợ</li>
                      <li><strong>Thông tin khảo sát:</strong> Ý kiến đánh giá về dịch vụ</li>
                    </ul>

                    <h4>2.2 Thông tin tự động thu thập</h4>
                    <ul>
                      <li><strong>Thông tin thiết bị:</strong> Loại thiết bị, hệ điều hành, trình duyệt</li>
                      <li><strong>Thông tin sử dụng:</strong> Trang web truy cập, thời gian sử dụng</li>
                      <li><strong>Địa chỉ IP:</strong> Để xác định vị trí và bảo mật</li>
                      <li><strong>Cookies:</strong> Để cải thiện trải nghiệm người dùng</li>
                    </ul>

                    <h4>2.3 Thông tin từ bên thứ ba</h4>
                    <ul>
                      <li>Thông tin từ mạng xã hội khi bạn đăng nhập qua Facebook, Google</li>
                      <li>Thông tin từ đối tác thanh toán để xử lý giao dịch</li>
                    </ul>
                  </section>

                  <section className="privacy-section">
                    <h3>3. Cách chúng tôi sử dụng thông tin</h3>
                    <p>Chúng tôi sử dụng thông tin của bạn để:</p>
                    
                    <h4>3.1 Cung cấp dịch vụ</h4>
                    <ul>
                      <li>Tạo và quản lý tài khoản</li>
                      <li>Xử lý đặt vé và thanh toán</li>
                      <li>Gửi xác nhận và thông tin vé</li>
                      <li>Cung cấp hỗ trợ khách hàng</li>
                    </ul>

                    <h4>3.2 Cải thiện dịch vụ</h4>
                    <ul>
                      <li>Phân tích hành vi sử dụng để cải thiện website</li>
                      <li>Phát triển tính năng mới</li>
                      <li>Khắc phục lỗi và vấn đề kỹ thuật</li>
                    </ul>

                    <h4>3.3 Marketing và truyền thông</h4>
                    <ul>
                      <li>Gửi thông tin khuyến mãi, ưu đãi (với sự đồng ý)</li>
                      <li>Gửi newsletter về phim mới, sự kiện</li>
                      <li>Quảng cáo được cá nhân hóa</li>
                    </ul>

                    <h4>3.4 Bảo mật và tuân thủ pháp luật</h4>
                    <ul>
                      <li>Phát hiện và ngăn chặn gian lận</li>
                      <li>Tuân thủ nghĩa vụ pháp lý</li>
                      <li>Bảo vệ quyền lợi của CinemaXP và người dùng</li>
                    </ul>
                  </section>

                  <section className="privacy-section">
                    <h3>4. Chia sẻ thông tin</h3>
                    <p>Chúng tôi không bán thông tin cá nhân của bạn. Chúng tôi chỉ chia sẻ trong các trường hợp:</p>
                    
                    <h4>4.1 Với sự đồng ý của bạn</h4>
                    <p>Khi bạn cho phép chia sẻ thông tin cho mục đích cụ thể.</p>

                    <h4>4.2 Với đối tác dịch vụ</h4>
                    <ul>
                      <li>Nhà cung cấp dịch vụ thanh toán</li>
                      <li>Dịch vụ email và SMS</li>
                      <li>Dịch vụ phân tích và quảng cáo</li>
                      <li>Dịch vụ lưu trữ đám mây</li>
                    </ul>

                    <h4>4.3 Yêu cầu pháp lý</h4>
                    <p>Khi được yêu cầu bởi cơ quan có thẩm quyền theo quy định pháp luật.</p>

                    <h4>4.4 Bảo vệ quyền lợi</h4>
                    <p>Để bảo vệ quyền, tài sản và an toàn của CinemaXP, người dùng và công chúng.</p>
                  </section>

                  <section className="privacy-section">
                    <h3>5. Bảo mật thông tin</h3>
                    <p>Chúng tôi áp dụng các biện pháp bảo mật kỹ thuật và tổ chức:</p>
                    
                    <h4>5.1 Bảo mật kỹ thuật</h4>
                    <ul>
                      <li>Mã hóa SSL/TLS cho tất cả dữ liệu truyền tải</li>
                      <li>Mã hóa dữ liệu nhạy cảm trong cơ sở dữ liệu</li>
                      <li>Tường lửa và hệ thống phát hiện xâm nhập</li>
                      <li>Kiểm tra bảo mật định kỳ</li>
                    </ul>

                    <h4>5.2 Bảo mật tổ chức</h4>
                    <ul>
                      <li>Giới hạn quyền truy cập dữ liệu</li>
                      <li>Đào tạo nhân viên về bảo mật</li>
                      <li>Chính sách mật khẩu mạnh</li>
                      <li>Giám sát và ghi log truy cập</li>
                    </ul>
                  </section>

                  <section className="privacy-section">
                    <h3>6. Lưu trữ và xóa dữ liệu</h3>
                    
                    <h4>6.1 Thời gian lưu trữ</h4>
                    <ul>
                      <li><strong>Thông tin tài khoản:</strong> Cho đến khi bạn xóa tài khoản</li>
                      <li><strong>Lịch sử giao dịch:</strong> 7 năm theo quy định pháp luật</li>
                      <li><strong>Dữ liệu phân tích:</strong> 2 năm</li>
                      <li><strong>Logs hệ thống:</strong> 1 năm</li>
                    </ul>

                    <h4>6.2 Xóa dữ liệu</h4>
                    <p>
                      Bạn có thể yêu cầu xóa dữ liệu cá nhân. Chúng tôi sẽ xóa trong vòng 30 ngày, 
                      trừ khi cần giữ lại theo quy định pháp luật.
                    </p>
                  </section>

                  <section className="privacy-section">
                    <h3>7. Quyền của bạn</h3>
                    <p>Bạn có các quyền sau đối với thông tin cá nhân:</p>
                    
                    <ul>
                      <li><strong>Quyền truy cập:</strong> Yêu cầu xem thông tin chúng tôi có về bạn</li>
                      <li><strong>Quyền chỉnh sửa:</strong> Cập nhật thông tin không chính xác</li>
                      <li><strong>Quyền xóa:</strong> Yêu cầu xóa thông tin cá nhân</li>
                      <li><strong>Quyền hạn chế:</strong> Giới hạn cách sử dụng thông tin</li>
                      <li><strong>Quyền di chuyển:</strong> Nhận bản sao dữ liệu của bạn</li>
                      <li><strong>Quyền phản đối:</strong> Từ chối xử lý dữ liệu cho mục đích marketing</li>
                    </ul>

                    <p>Để thực hiện các quyền này, liên hệ: privacy@cinemaxp.vn</p>
                  </section>

                  <section className="privacy-section">
                    <h3>8. Cookies và công nghệ theo dõi</h3>
                    
                    <h4>8.1 Loại cookies chúng tôi sử dụng</h4>
                    <ul>
                      <li><strong>Cookies cần thiết:</strong> Để website hoạt động bình thường</li>
                      <li><strong>Cookies hiệu suất:</strong> Để phân tích cách sử dụng website</li>
                      <li><strong>Cookies chức năng:</strong> Để ghi nhớ tùy chọn của bạn</li>
                      <li><strong>Cookies quảng cáo:</strong> Để hiển thị quảng cáo phù hợp</li>
                    </ul>

                    <h4>8.2 Quản lý cookies</h4>
                    <p>
                      Bạn có thể quản lý cookies qua cài đặt trình duyệt. Tuy nhiên, việc tắt cookies 
                      có thể ảnh hưởng đến trải nghiệm sử dụng website.
                    </p>
                  </section>

                  <section className="privacy-section">
                    <h3>9. Trẻ em</h3>
                    <p>
                      Dịch vụ của chúng tôi không dành cho trẻ em dưới 13 tuổi. Chúng tôi không cố ý 
                      thu thập thông tin từ trẻ em dưới 13 tuổi. Nếu phát hiện, chúng tôi sẽ xóa 
                      thông tin đó ngay lập tức.
                    </p>
                  </section>

                  <section className="privacy-section">
                    <h3>10. Chuyển giao dữ liệu quốc tế</h3>
                    <p>
                      Dữ liệu của bạn có thể được xử lý tại các quốc gia khác có luật bảo mật khác biệt. 
                      Chúng tôi đảm bảo áp dụng các biện pháp bảo vệ phù hợp.
                    </p>
                  </section>

                  <section className="privacy-section">
                    <h3>11. Thay đổi chính sách</h3>
                    <p>
                      Chúng tôi có thể cập nhật chính sách này. Thay đổi quan trọng sẽ được thông báo 
                      qua email hoặc thông báo trên website trước khi có hiệu lực.
                    </p>
                  </section>

                  <section className="privacy-section">
                    <h3>12. Liên hệ</h3>
                    <p>
                      Nếu bạn có câu hỏi về chính sách bảo mật này, liên hệ:
                    </p>
                    <ul>
                      <li><strong>Email:</strong> privacy@cinemaxp.vn</li>
                      <li><strong>Hotline:</strong> 1900 1234</li>
                      <li><strong>Địa chỉ:</strong> 123 Đường Điện Ảnh, Quận 1, TP.HCM</li>
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