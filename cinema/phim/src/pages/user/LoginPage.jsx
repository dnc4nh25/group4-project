import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Container, Form, Button, Card, Alert, Spinner } from "react-bootstrap";
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("Vui lÃ²ng nháº­p Ä‘áº§y Ä‘á»§ thÃ´ng tin.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8080/api/auth/login", {
        username,
        password
      });
      // ThÃ nh cÃ´ng
      login(res.data);
      
      // PhÃ¢n quyá»n: Náº¿u lÃ  ADMIN thÃ¬ Æ°u tiÃªn vÃ o trang admin (trá»« khi há» Ä‘ang cÃ³ link redirect cá»¥ thá»ƒ khÃ¡c '/')
      if (res.data.role === 'admin' && from === '/') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data);
      } else {
        setError("KhÃ´ng thá»ƒ káº¿t ná»‘i Ä‘áº¿n mÃ¡y chá»§. Vui lÃ²ng thá»­ láº¡i.");
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
              <div className="auth-icon">ðŸŽ¬</div>
              <h2 className="fw-bold mb-1">ChÃ o má»«ng trá»Ÿ láº¡i</h2>
              <p className="text-muted">ÄÄƒng nháº­p Ä‘á»ƒ Ä‘áº·t vÃ© xem phim</p>
            </div>
            {error && (
              <Alert variant="danger" className="py-2">
                {error}
              </Alert>
            )}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>TÃªn Ä‘Äƒng nháº­p</Form.Label>
                <Form.Control
                  id="username"
                  type="text"
                  placeholder="Nháº­p tÃªn Ä‘Äƒng nháº­p"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-input-custom"
                />
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label>Máº­t kháº©u</Form.Label>
                <Form.Control
                  id="password"
                  type="password"
                  placeholder="Nháº­p máº­t kháº©u"
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
                {loading ? <Spinner size="sm" /> : "ÄÄƒng nháº­p"}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
