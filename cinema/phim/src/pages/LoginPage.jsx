import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Container, Form, Button, Card, Alert, Spinner } from "react-bootstrap";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

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
                <Form.Label>Mật khẩu</Form.Label>
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
    </div>
  );
}
