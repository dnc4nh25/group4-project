import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Container, Form, Button, Card, Alert, Spinner } from "react-bootstrap";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    email: "",
    phone: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // Refs cho các trường để scroll
  const fullNameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const FIELD_ORDER = [
    "fullName",
    "email",
    "phone",
    "username",
    "password",
    "confirmPassword",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    // Xóa lỗi của field khi user bắt đầu sửa
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    // Số điện thoại phải có đúng 10 chữ số và bắt đầu bằng số 0
    const phoneRegex = /^0[0-9]{9}$/;
    return phoneRegex.test(phone);
  };

  const scrollToFirstError = (errors) => {
    const firstField =
      FIELD_ORDER.find((name) => errors[name]) ?? Object.keys(errors)[0];
    if (!firstField || firstField === "general") return;

    const refMap = {
      fullName: fullNameRef,
      email: emailRef,
      phone: phoneRef,
      username: usernameRef,
      password: passwordRef,
      confirmPassword: confirmPasswordRef,
    };

    setTimeout(() => {
      requestAnimationFrame(() => {
        const el = refMap[firstField]?.current;
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.focus({ preventScroll: true });
        }
      });
    }, 0);
  };

  const applyServerErrors = (serverError) => {
    const isFieldMap =
      serverError &&
      typeof serverError === "object" &&
      !Array.isArray(serverError) &&
      Object.keys(serverError).length > 0 &&
      Object.values(serverError).every((v) => typeof v === "string");

    if (isFieldMap) {
      setFieldErrors(serverError);
      scrollToFirstError(serverError);
      return;
    }

    if (typeof serverError === "string") {
      const errorLower = serverError.toLowerCase();

      if (errorLower.includes("username") || errorLower.includes("tên đăng nhập")) {
        const next = { username: serverError };
        setFieldErrors(next);
        scrollToFirstError(next);
      } else if (errorLower.includes("email")) {
        const next = { email: serverError };
        setFieldErrors(next);
        scrollToFirstError(next);
      } else if (
        errorLower.includes("phone") ||
        errorLower.includes("số điện thoại") ||
        errorLower.includes("điện thoại")
      ) {
        const next = { phone: serverError };
        setFieldErrors(next);
        scrollToFirstError(next);
      } else if (errorLower.includes("password") || errorLower.includes("mật khẩu")) {
        const next = { password: serverError };
        setFieldErrors(next);
        scrollToFirstError(next);
      } else if (errorLower.includes("fullname") || errorLower.includes("họ và tên")) {
        const next = { fullName: serverError };
        setFieldErrors(next);
        scrollToFirstError(next);
      } else {
        setFieldErrors({ general: serverError });
      }
      return;
    }

    setFieldErrors({ general: "Đăng ký thất bại. Vui lòng thử lại." });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    // Validate từng trường
    if (!form.fullName || !form.fullName.trim()) {
      errors.fullName = "Họ và tên không được để trống.";
    } else if (form.fullName.trim().length < 3) {
      errors.fullName = "Họ và tên phải có ít nhất 3 ký tự.";
    }

    if (!form.email || !form.email.trim()) {
      errors.email = "Email không được để trống.";
    } else if (!validateEmail(form.email)) {
      errors.email = "Email không hợp lệ.";
    }

    if (!form.phone || !form.phone.trim()) {
      errors.phone = "Số điện thoại không được để trống.";
    } else if (!validatePhone(form.phone)) {
      errors.phone = "Số điện thoại phải có 10 chữ số và bắt đầu bằng số 0.";
    }

    if (!form.username || !form.username.trim()) {
      errors.username = "Tên đăng nhập không được để trống.";
    } else if (form.username.trim().length < 3) {
      errors.username = "Tên đăng nhập phải có ít nhất 3 ký tự.";
    }

    if (!form.password) {
      errors.password = "Mật khẩu không được để trống.";
    } else if (form.password.length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    }

    if (!form.confirmPassword) {
      errors.confirmPassword = "Vui lòng xác nhận mật khẩu.";
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      scrollToFirstError(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, {
        username: form.username.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      // Đăng ký thành công → Backend trả về JWT, tự động đăng nhập
      login(res.data);
      navigate("/");
    } catch (err) {
      if (err.response && err.response.data) {
        applyServerErrors(err.response.data);
      } else {
        setFieldErrors({ general: "Không thể kết nối đến máy chủ." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg d-flex align-items-center justify-content-center min-vh-100">
      <Container style={{ maxWidth: 440 }}>
        <Card className="auth-card shadow-lg">
          <Card.Body className="p-4 p-md-5">
            <div className="text-center mb-4">
              <div className="auth-icon">🎟️</div>
              <h2 className="fw-bold mb-1">Tạo tài khoản</h2>
              <p className="text-muted">Đăng ký để bắt đầu đặt vé</p>
            </div>
            
            {/* Banner lỗi chung (nếu có) */}
            {fieldErrors.general && (
              <Alert variant="danger" className="py-2 mb-3">
                {fieldErrors.general}
              </Alert>
            )}
            
            <Form onSubmit={handleSubmit} noValidate>
              <Form.Group className="mb-3">
                <Form.Label>
                  Họ và tên <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  ref={fullNameRef}
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={form.fullName}
                  onChange={handleChange}
                  className={`form-input-custom ${fieldErrors.fullName ? "is-invalid" : ""}`}
                  isInvalid={!!fieldErrors.fullName}
                />
                {fieldErrors.fullName && (
                  <div className="invalid-feedback d-block">
                    ⚠️ {fieldErrors.fullName}
                  </div>
                )}
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>
                  Email <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  ref={emailRef}
                  id="reg-email"
                  name="email"
                  type="email"
                  placeholder="example@email.com"
                  value={form.email}
                  onChange={handleChange}
                  className={`form-input-custom ${fieldErrors.email ? "is-invalid" : ""}`}
                  isInvalid={!!fieldErrors.email}
                />
                {fieldErrors.email && (
                  <div className="invalid-feedback d-block">
                    ⚠️ {fieldErrors.email}
                  </div>
                )}
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>
                  Số điện thoại <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  ref={phoneRef}
                  id="reg-phone"
                  name="phone"
                  type="tel"
                  placeholder="0123456789"
                  value={form.phone}
                  onChange={handleChange}
                  className={`form-input-custom ${fieldErrors.phone ? "is-invalid" : ""}`}
                  isInvalid={!!fieldErrors.phone}
                />
                {fieldErrors.phone && (
                  <div className="invalid-feedback d-block">
                    ⚠️ {fieldErrors.phone}
                  </div>
                )}
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>
                  Tên đăng nhập <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  ref={usernameRef}
                  id="reg-username"
                  name="username"
                  type="text"
                  placeholder="username"
                  value={form.username}
                  onChange={handleChange}
                  className={`form-input-custom ${fieldErrors.username ? "is-invalid" : ""}`}
                  isInvalid={!!fieldErrors.username}
                />
                {fieldErrors.username && (
                  <div className="invalid-feedback d-block">
                    ⚠️ {fieldErrors.username}
                  </div>
                )}
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>
                  Mật khẩu <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  ref={passwordRef}
                  id="reg-password"
                  name="password"
                  type="password"
                  placeholder="Ít nhất 6 ký tự"
                  value={form.password}
                  onChange={handleChange}
                  className={`form-input-custom ${fieldErrors.password ? "is-invalid" : ""}`}
                  isInvalid={!!fieldErrors.password}
                />
                {fieldErrors.password && (
                  <div className="invalid-feedback d-block">
                    ⚠️ {fieldErrors.password}
                  </div>
                )}
              </Form.Group>
              
              <Form.Group className="mb-4">
                <Form.Label>
                  Xác nhận mật khẩu <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  ref={confirmPasswordRef}
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className={`form-input-custom ${fieldErrors.confirmPassword ? "is-invalid" : ""}`}
                  isInvalid={!!fieldErrors.confirmPassword}
                />
                {fieldErrors.confirmPassword && (
                  <div className="invalid-feedback d-block">
                    ⚠️ {fieldErrors.confirmPassword}
                  </div>
                )}
              </Form.Group>
              
              <Button
                id="register-btn"
                type="submit"
                className="w-100 btn-primary-custom"
                disabled={loading}
              >
                {loading ? <Spinner size="sm" /> : "Đăng ký"}
              </Button>
            </Form>
            <div className="text-center mt-3">
              <span className="text-muted">Đã có tài khoản? </span>
              <Link to="/login" className="text-warning fw-semibold">
                Đăng nhập
              </Link>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
