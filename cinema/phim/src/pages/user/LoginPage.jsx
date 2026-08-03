import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Container, Form, Button, Card, Alert, Spinner, Modal } from "react-bootstrap";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  // Forgot password states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotStep, setForgotStep] = useState(1); // 1: email, 2: otp + new password
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8080/api/auth/login", {
        username,
        password
      });
      // Thành công
      login(res.data);

      // Phân quyền: Nếu là ADMIN thì ưu tiên vào trang admin (trừ khi họ đang có link redirect cụ thể khác '/')
      if (res.data.role === 'admin' && from === '/') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data);
      } else {
        setError("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    if (!forgotEmail) {
      setForgotError("Vui lòng nhập email.");
      return;
    }
    setForgotLoading(true);
    try {
      await axios.post("http://localhost:8080/api/auth/forgot-password", {
        email: forgotEmail
      });
      setForgotSuccess("Mã OTP đã được gửi đến email của bạn.");
      setForgotStep(2);
    } catch (err) {
      if (err.response && err.response.data) {
        setForgotError(err.response.data);
      } else {
        setForgotError("Không thể gửi yêu cầu. Vui lòng thử lại.");
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    if (!forgotOtp || !forgotNewPassword || !forgotConfirmPassword) {
      setForgotError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    if (forgotNewPassword.length < 6) {
      setForgotError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setForgotLoading(true);
    try {
      await axios.post("http://localhost:8080/api/auth/reset-password", {
        email: forgotEmail,
        otp: forgotOtp,
        newPassword: forgotNewPassword
      });
      setForgotSuccess("Đặt lại mật khẩu thành công! Giao diện sẽ đóng sau giây lát.");
      setTimeout(() => {
        setShowForgotModal(false);
        // Reset forgot states
        setForgotEmail("");
        setForgotOtp("");
        setForgotNewPassword("");
        setForgotConfirmPassword("");
        setForgotStep(1);
        setForgotSuccess("");
        setForgotError("");
      }, 2000);
    } catch (err) {
      if (err.response && err.response.data) {
        setForgotError(err.response.data);
      } else {
        setForgotError("Đã xảy ra lỗi. Vui lòng thử lại.");
      }
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-bg d-flex align-items-center justify-content-center min-vh-100">
      <Container style={{ maxWidth: 420 }}>
        <Card className="auth-card shadow-lg">
          <Card.Body className="p-4 p-md-5">
            <div className="text-center mb-4">
              <div className="auth-icon">🎬</div>
              <h2 className="fw-bold mb-1">Chào mừng trở lại</h2>
              <p className="text-muted">Đăng nhập để đặt vé xem phim</p>
            </div>
            {error && (
              <Alert variant="danger" className="py-2">
                {error}
              </Alert>
            )}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Tên đăng nhập</Form.Label>
                <Form.Control
                  id="username"
                  type="text"
                  placeholder="Nhập tên đăng nhập"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-input-custom"
                />
              </Form.Group>
              <Form.Group className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <Form.Label className="mb-0">Mật khẩu</Form.Label>
                  <span
                    onClick={() => {
                      setForgotError("");
                      setForgotSuccess("");
                      setForgotStep(1);
                      setShowForgotModal(true);
                    }}
                    className="text-warning text-decoration-none"
                    style={{ fontSize: "0.85rem", cursor: "pointer" }}
                  >
                    Quên mật khẩu?
                  </span>
                </div>
                <Form.Control
                  id="password"
                  type="password"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input-custom"
                />
              </Form.Group>
              <Button
                id="login-btn"
                type="submit"
                className="w-100 btn-primary-custom"
                disabled={loading}
              >
                {loading ? <Spinner size="sm" /> : "Đăng nhập"}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Container>

      {/* Forgot Password Modal */}
      <Modal 
        show={showForgotModal} 
        onHide={() => setShowForgotModal(false)}
        centered
        contentClassName="auth-card shadow-lg"
      >
        <Modal.Header closeButton className="border-secondary">
          <Modal.Title className="fw-bold">🎬 Quên mật khẩu</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {forgotError && <Alert variant="danger" className="py-2">{forgotError}</Alert>}
          {forgotSuccess && <Alert variant="success" className="py-2">{forgotSuccess}</Alert>}
          
          {forgotStep === 1 ? (
            <Form onSubmit={handleSendOtp}>
              <p className="text-muted small mb-3">
                Nhập email tài khoản của bạn. Chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.
              </p>
              <Form.Group className="mb-3">
                <Form.Label>Email đăng ký</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="name@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="form-input-custom"
                  required
                />
              </Form.Group>
              <Button
                type="submit"
                className="w-100 btn-primary-custom"
                disabled={forgotLoading}
              >
                {forgotLoading ? <Spinner size="sm" /> : "Gửi mã OTP"}
              </Button>
            </Form>
          ) : (
            <Form onSubmit={handleResetPassword}>
              <p className="text-muted small mb-3">
                Mã xác thực đã được gửi đến: <strong className="text-dark">{forgotEmail}</strong>. Vui lòng nhập mã OTP và mật khẩu mới của bạn.
              </p>
              <Form.Group className="mb-3">
                <Form.Label>Mã OTP</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nhập 6 chữ số OTP"
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value)}
                  className="form-input-custom"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Mật khẩu mới</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  className="form-input-custom"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label>Xác nhận mật khẩu mới</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Nhập lại mật khẩu mới"
                  value={forgotConfirmPassword}
                  onChange={(e) => setForgotConfirmPassword(e.target.value)}
                  className="form-input-custom"
                  required
                />
              </Form.Group>
              <div className="d-flex gap-2">
                <Button
                  type="button"
                  variant="outline-secondary"
                  className="w-50 border-secondary text-dark"
                  onClick={() => setForgotStep(1)}
                  disabled={forgotLoading}
                >
                  Quay lại
                </Button>
                <Button
                  type="submit"
                  className="w-50 btn-primary-custom"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? <Spinner size="sm" /> : "Đặt lại mật khẩu"}
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
