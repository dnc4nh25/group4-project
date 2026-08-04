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
  const [fieldErrors, setFieldErrors] = useState({});
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
    setFieldErrors({});
    setForgotSuccess("");
    if (!forgotEmail) {
      setFieldErrors({ email: "Vui lòng nhập email." });
      document.getElementById('forgotEmail')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      const errorMsg = err.response && err.response.data ? err.response.data : "Không thể gửi yêu cầu. Vui lòng thử lại.";
      setFieldErrors({ email: errorMsg });
      document.getElementById('forgotEmail')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError("");
    setFieldErrors({});
    setForgotSuccess("");
    
    let newErrors = {};
    if (!forgotOtp) newErrors.otp = "Vui lòng nhập mã OTP.";
    else if (forgotOtp.length !== 6) newErrors.otp = "Mã OTP phải gồm 6 chữ số.";

    if (!forgotNewPassword) newErrors.newPassword = "Vui lòng nhập mật khẩu mới.";
    else if (forgotNewPassword.length < 6) newErrors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự.";
    
    if (!forgotConfirmPassword) newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu mới.";
    else if (forgotNewPassword !== forgotConfirmPassword) newErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      const firstErrorKey = Object.keys(newErrors)[0];
      const fieldIdMap = {
        otp: 'forgotOtp',
        newPassword: 'forgotNewPassword',
        confirmPassword: 'forgotConfirmPassword'
      };
      document.getElementById(fieldIdMap[firstErrorKey])?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
        setFieldErrors({});
      }, 2000);
    } catch (err) {
      const errorMsg = err.response && err.response.data ? err.response.data : "Đã xảy ra lỗi. Vui lòng thử lại.";
      if (typeof errorMsg === 'string') {
        const lowerMsg = errorMsg.toLowerCase();
        if (lowerMsg.includes("mật khẩu")) {
          setFieldErrors({ newPassword: errorMsg });
          document.getElementById('forgotNewPassword')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          setFieldErrors({ otp: errorMsg });
          document.getElementById('forgotOtp')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
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
                      setFieldErrors({});
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
                  id="forgotEmail"
                  type="email"
                  placeholder="name@example.com"
                  value={forgotEmail}
                  onChange={(e) => {
                    setForgotEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: null });
                  }}
                  className={`form-input-custom ${fieldErrors.email ? 'is-invalid' : ''}`}
                />
                {fieldErrors.email && <div className="text-danger mt-1 small">{fieldErrors.email}</div>}
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
                Mã xác thực đã được gửi đến: <strong className="text-white fw-bold">{forgotEmail}</strong>. Vui lòng nhập mã OTP và mật khẩu mới của bạn.
              </p>
              <Form.Group className="mb-3">
                <Form.Label>Mã OTP</Form.Label>
                <Form.Control
                  id="forgotOtp"
                  type="text"
                  placeholder="Nhập 6 chữ số OTP"
                  value={forgotOtp}
                  onChange={(e) => {
                    setForgotOtp(e.target.value);
                    if (fieldErrors.otp) setFieldErrors({ ...fieldErrors, otp: null });
                  }}
                  className={`form-input-custom ${fieldErrors.otp ? 'is-invalid' : ''}`}
                />
                {fieldErrors.otp && <div className="text-danger mt-1 small">{fieldErrors.otp}</div>}
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Mật khẩu mới</Form.Label>
                <Form.Control
                  id="forgotNewPassword"
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                  value={forgotNewPassword}
                  onChange={(e) => {
                    setForgotNewPassword(e.target.value);
                    if (fieldErrors.newPassword) setFieldErrors({ ...fieldErrors, newPassword: null });
                  }}
                  className={`form-input-custom ${fieldErrors.newPassword ? 'is-invalid' : ''}`}
                />
                {fieldErrors.newPassword && <div className="text-danger mt-1 small">{fieldErrors.newPassword}</div>}
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label>Xác nhận mật khẩu mới</Form.Label>
                <Form.Control
                  id="forgotConfirmPassword"
                  type="password"
                  placeholder="Nhập lại mật khẩu mới"
                  value={forgotConfirmPassword}
                  onChange={(e) => {
                    setForgotConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: null });
                  }}
                  className={`form-input-custom ${fieldErrors.confirmPassword ? 'is-invalid' : ''}`}
                />
                {fieldErrors.confirmPassword && <div className="text-danger mt-1 small">{fieldErrors.confirmPassword}</div>}
              </Form.Group>
              <div className="d-flex gap-2">
                <Button
                  type="button"
                  variant="outline-secondary"
                  className="w-50 border-secondary text-white fw-bold"
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
