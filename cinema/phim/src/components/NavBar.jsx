import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Navbar, Nav, Container, Button } from 'react-bootstrap'
import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState, useRef } from 'react'

const ADMIN_LINKS = [
  { to: '/admin',            label: 'Dashboard' },
  { to: '/admin/movies',     label: 'Quản lý Phim' },
  { to: '/admin/showtimes',  label: 'Quản lý Xuất chiếu' },
  { to: '/admin/bookings',   label: 'Quản lý Đặt vé' },
  { to: '/admin/vouchers',   label: 'Quản lý Voucher' },
  { to: '/admin/users',      label: 'Quản lý Người dùng' },
  { to: '/admin/feedbacks',  label: 'Phản hồi KH' },
]

export default function NavBar({ theme, onToggleTheme }) {
  const { currentUser, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const isAdmin   = currentUser?.role === 'admin'
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 })
  const toggleRef = useRef(null)
  const dropdownRef = useRef(null)

  const handleLogout = () => { logout(); navigate('/') }

  const isActive = (path) =>
    path === '/admin'
      ? location.pathname === '/admin'
      : location.pathname.startsWith(path)

  const handleToggleDropdown = () => {
    if (!dropdownOpen && toggleRef.current) {
      const rect = toggleRef.current.getBoundingClientRect()
      setDropdownPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      })
    }
    setDropdownOpen(prev => !prev)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        toggleRef.current && !toggleRef.current.contains(e.target)
      ) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [scrolled])

  return (
    <>
      <Navbar
        expand="lg"
        className={`cinema-navbar ${scrolled ? 'scrolled' : ''}`}
        sticky="top"
        style={{ transition: 'all 0.3s ease' }}
      >
        <Container fluid>
          <Navbar.Brand
            as={Link}
            to="/"
            className="brand-logo animate-fade-in-left"
            style={{ animationDelay: '0.1s' }}
          >
            CinemaXP
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="main-nav" className="navbar-toggler-custom" />

          <Navbar.Collapse id="main-nav">
            <Nav className="me-auto navbar-main-links">
              {isAdmin ? (
                ADMIN_LINKS.map((link, index) => (
                  <Nav.Link
                    key={link.to}
                    as={Link}
                    to={link.to}
                    className={`animate-fade-in-up ${isActive(link.to) ? 'nav-link-active' : ''}`}
                    style={{ animationDelay: `${0.2 + index * 0.05}s` }}
                  >
                    {link.label}
                  </Nav.Link>
                ))
              ) : (
                <>
                  <Nav.Link
                    as={Link}
                    to="/"
                    className={`animate-fade-in-up ${location.pathname === '/' ? 'nav-link-active' : ''}`}
                    style={{ animationDelay: '0.2s' }}
                  >
                    Trang chủ
                  </Nav.Link>
                  <Nav.Link
                    as={Link}
                    to="/movies"
                    className={`animate-fade-in-up ${location.pathname.startsWith('/movies') ? 'nav-link-active' : ''}`}
                    style={{ animationDelay: '0.25s' }}
                  >
                    Phim
                  </Nav.Link>
                  <Nav.Link
                    as={Link}
                    to="/offers"
                    className={`animate-fade-in-up ${location.pathname === '/offers' ? 'nav-link-active' : ''}`}
                    style={{ animationDelay: '0.28s' }}
                  >
                    Ưu đãi của tôi
                  </Nav.Link>
                  {currentUser && (
                    <Nav.Link
                      as={Link}
                      to="/my-bookings"
                      className={`animate-fade-in-up ${location.pathname === '/my-bookings' ? 'nav-link-active' : ''}`}
                      style={{ animationDelay: '0.3s' }}
                    >
                      Vé của tôi
                    </Nav.Link>
                  )}
                </>
              )}
            </Nav>

            <Nav className="ms-auto align-items-center animate-fade-in-right navbar-user-section" style={{ animationDelay: '0.35s' }}>
              <Button
                variant="link"
                onClick={onToggleTheme}
                className="theme-toggle-btn me-2"
                title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
                aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </Button>

              {currentUser ? (
                <div className="custom-user-dropdown">
                  <button
                    ref={toggleRef}
                    className="custom-dropdown-toggle"
                    onClick={handleToggleDropdown}
                    aria-expanded={dropdownOpen}
                  >
                    <span className="user-avatar">{currentUser.fullName?.charAt(0) || 'U'}</span>
                    <span className="user-name-text">{currentUser.fullName || currentUser.username}</span>
                    <span className="dropdown-caret">▾</span>
                  </button>
                </div>
              ) : (
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-light"
                    size="sm"
                    as={Link}
                    to="/login"
                    className="navbar-login-btn animate-fade-in-up"
                    style={{ animationDelay: '0.4s' }}
                  >
                    Đăng nhập
                  </Button>
                  <Button
                    variant="warning"
                    size="sm"
                    as={Link}
                    to="/register"
                    className="btn-primary-custom animate-fade-in-up"
                    style={{ animationDelay: '0.45s' }}
                  >
                    Đăng ký
                  </Button>
                </div>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Custom dropdown rendered outside navbar to escape stacking context caused by backdrop-filter */}
      {currentUser && dropdownOpen && (
        <div
          ref={dropdownRef}
          className="custom-user-dropdown-menu"
          style={{
            position: 'fixed',
            top: dropdownPos.top,
            right: dropdownPos.right,
            zIndex: 999999,
          }}
        >
          {!isAdmin && (
            <>
              <Link
                to="/profile"
                className="custom-dropdown-item"
                onClick={() => setDropdownOpen(false)}
              >
                Thông tin cá nhân
              </Link>
              <div className="custom-dropdown-divider" />
            </>
          )}
          <button
            className="custom-dropdown-item text-danger-item"
            onClick={() => { setDropdownOpen(false); handleLogout() }}
          >
            Đăng xuất
          </button>
        </div>
      )}
    </>
  )
}
