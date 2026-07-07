import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import "./Footer.css";

export default function Footer() {
  const [footerData, setFooterData] = useState({
    brand: {
      name: "CinemaXP",
      description:
        "Trải nghiệm điện ảnh đỉnh cao với công nghệ hiện đại và dịch vụ tuyệt vời. Nơi mang đến những giây phút giải trí tuyệt vời cho bạn và gia đình.",
      socialLinks: {
        facebook: "https://www.facebook.com/minhhieu.hoang.522066",
        instagram: "#",
        youtube: "#",
        twitter: "#",
      },
    },
    contact: {
      address: "Nhà anh Minh, Thạch Hoà, Thạch Thất, Hà Nội",
      phone: "1900 1234",
      email: "anhminhgay@gmail.com",
      hours: "8:00 - 24:00 (Hàng ngày)",
    },
    copyright: "© 2026 CinemaXP. Tất cả quyền được bảo lưu.",
    paymentText: "Chấp nhận thanh toán:",
  });

  useEffect(() => {
    loadFooterData();

    const interval = setInterval(loadFooterData, 30000);

    const handleStorageChange = (e) => {
      if (e.key === "footerUpdated") {
        loadFooterData();
      }
    };

    const handleFooterUpdate = () => {
      loadFooterData();
    };

    const storageCheck = setInterval(() => {
      const lastUpdate = localStorage.getItem("footerUpdated");
      if (lastUpdate && Date.now() - parseInt(lastUpdate) < 1000) {
        loadFooterData();
        localStorage.removeItem("footerUpdated");
      }
    }, 1000);

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("footerUpdated", handleFooterUpdate);

    return () => {
      clearInterval(interval);
      clearInterval(storageCheck);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("footerUpdated", handleFooterUpdate);
    };
  }, []);

  const loadFooterData = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3001/footerSettings/1",
      );
      setFooterData(response.data);
    } catch (error) {
      console.error("Error loading footer data:", error);
    }
  };
  return (
    <footer className="cinema-footer">
      <div className="footer-main">
        <Container>
          <Row className="g-4">
            <Col lg={4} md={6}>
              <div className="footer-brand">
                <div className="footer-logo">
                  <span className="brand-icon">🎬</span>
                  <span className="brand-text">{footerData.brand.name}</span>
                </div>
                <p className="footer-description">
                  {footerData.brand.description}
                </p>
                <div className="footer-social">
                  <a
                    href={footerData.brand.socialLinks.facebook}
                    className="social-link"
                    title="Facebook"
                  >
                    📘
                  </a>
                  <a
                    href={footerData.brand.socialLinks.instagram}
                    className="social-link"
                    title="Instagram"
                  >
                    📷
                  </a>
                  <a
                    href={footerData.brand.socialLinks.youtube}
                    className="social-link"
                    title="YouTube"
                  >
                    📺
                  </a>
                  <a
                    href={footerData.brand.socialLinks.twitter}
                    className="social-link"
                    title="Twitter"
                  >
                    🐦
                  </a>
                </div>
              </div>
            </Col>

            <Col lg={2} md={6} sm={6}>
              <div className="footer-section">
                <h6 className="footer-title">Liên kết nhanh</h6>
                <ul className="footer-links">
                  <li>
                    <Link to="/">Trang chủ</Link>
                  </li>
                  <li>
                    <Link to="/movies">Phim</Link>
                  </li>
                  <li>
                    <Link to="/my-bookings">Vé của tôi</Link>
                  </li>
                  <li>
                    <Link to="/offers">Ưu đãi</Link>
                  </li>
                </ul>
              </div>
            </Col>

            <Col lg={3} md={6} sm={6}>
              <div className="footer-section">
                <h6 className="footer-title">Hỗ trợ</h6>
                <ul className="footer-links">
                  <li>
                    <Link to="/help">Trung tâm trợ giúp</Link>
                  </li>
                  <li>
                    <Link to="/contact">Liên hệ</Link>
                  </li>
                  <li>
                    <Link to="/terms">Điều khoản sử dụng</Link>
                  </li>
                  <li>
                    <Link to="/privacy">Chính sách bảo mật</Link>
                  </li>
                </ul>
              </div>
            </Col>

            <Col lg={3} md={6}>
              <div className="footer-section">
                <h6 className="footer-title">Thông tin liên hệ</h6>
                <div className="footer-contact">
                  <div className="contact-item">
                    <span className="contact-icon">📍</span>
                    <span>{footerData.contact.address}</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-icon">📞</span>
                    <span>{footerData.contact.phone}</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-icon">✉️</span>
                    <span>{footerData.contact.email}</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-icon">🕒</span>
                    <span>{footerData.contact.hours}</span>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <div className="footer-bottom">
        <Container>
          <Row className="align-items-center">
            <Col md={6}>
              <p className="footer-copyright">{footerData.copyright}</p>
            </Col>
            <Col md={6}>
              <div className="footer-payment">
                <span className="payment-text">{footerData.paymentText}</span>
                <div className="payment-methods">
                  <span className="payment-method">💳</span>
                  <span className="payment-method">🏧</span>
                  <span className="payment-method">📱</span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </footer>
  );
}
