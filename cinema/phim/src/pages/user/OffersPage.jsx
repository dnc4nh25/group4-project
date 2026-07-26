import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Badge, Button, Modal, Alert } from 'react-bootstrap'
import axios from 'axios'
import { useAuth } from '../../contexts/AuthContext'
import { VoucherValidator } from '../../utils/voucherValidation'
import './StaticPages.css'

export default function OffersPage() {
  const { currentUser } = useAuth()
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVoucher, setSelectedVoucher] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [copiedCode, setCopiedCode] = useState('')

  useEffect(() => {
    const loadVouchers = async () => {
      try {
        if (currentUser) {
          const userVouchers = await VoucherValidator.getAvailableVouchersForUser(currentUser.id)
          setVouchers(userVouchers.map(v => VoucherValidator.getVoucherDisplayInfo(v)))
        } else {
          const res = await axios.get('http://localhost:8080/api/vouchers')
          const activeVouchers = res.data.filter(v => {
            const isActive = v.isActive
            const validTo = new Date(v.validTo)
            const now = new Date()
            const isValid = validTo >= now
            return isActive && isValid
          })
          setVouchers(activeVouchers.map(v => VoucherValidator.getVoucherDisplayInfo(v)))
        }
      } catch (err) {
        console.error('L?i t?i voucher:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadVouchers()
  }, [currentUser])

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(''), 2000)
  }

  const handleViewDetails = (voucher) => {
    setSelectedVoucher(voucher)
    setShowModal(true)
  }

  const getVoucherIcon = (type) => {
    return type === 'percentage' ? '??' : '??'
  }

  const getDiscountText = (voucher) => {
    return voucher.type === 'percentage' 
      ? `${voucher.value}%` 
      : `${(voucher.value / 1000)}K`
  }

  const getUsageProgress = (voucher) => {
    return ((voucher.usedCount || 0) / voucher.usageLimit) * 100
  }

  return (
    <div className="page-wrapper static-page offers-page">
      
      <div className="static-page-header offers-header">
        <Container>
          <div className="text-center">
            <div className="static-page-icon">??</div>
            <h1 className="static-page-title">Uu dãi d?c bi?t</h1>
            <p className="static-page-subtitle">
              Khám phá các voucher gi?m giá h?p d?n và ti?t ki?m chi phí xem phim
            </p>
          </div>
        </Container>
      </div>

      <Container className="py-5">
        
        <Row className="mb-5">
          <Col xs={12}>
            <div className="section-header text-center mb-4">
              <h2 className="section-title">?? Uu dãi n?i b?t</h2>
              <p className="text-muted">Nh?ng voucher du?c yêu thích nh?t</p>
            </div>
          </Col>
        </Row>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" style={{ width: '3rem', height: '3rem' }}></div>
            <p className="mt-3 text-muted">Ðang t?i uu dãi...</p>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="text-center py-5">
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>??</div>
            <h4>Hi?n t?i chua có uu dãi nào</h4>
            <p className="text-muted">Vui lòng quay l?i sau d? xem các uu dãi m?i nh?t!</p>
          </div>
        ) : (
          <>
            
            <Row className="g-4 mb-5">
              {vouchers.map((voucher) => (
                <Col key={voucher.id} lg={6} xl={4}>
                  <Card className={`offer-card h-100 ${voucher.restricted ? 'offer-card-restricted' : ''}`}>
                    <div className="offer-card-header">
                      <div className="offer-badge">
                        <span className="offer-icon">{getVoucherIcon(voucher.type)}</span>
                        <div className="offer-discount">
                          <span className="discount-value">{getDiscountText(voucher)}</span>
                          <span className="discount-label">OFF</span>
                        </div>
                      </div>
                      <div className="offer-usage">
                        <div className="usage-bar">
                          <div 
                            className="usage-fill" 
                            style={{ width: `${getUsageProgress(voucher)}%` }}
                          ></div>
                        </div>
                        <small className="usage-text">
                          Còn {voucher.usageLimit - (voucher.usedCount || 0)} lu?t
                        </small>
                      </div>
                    </div>
                    
                    <Card.Body className="d-flex flex-column">
                      <h5 className="offer-title">{voucher.title}</h5>
                      <p className="offer-description">{voucher.description}</p>
                      
                      
                      {voucher.restricted && (
                        <Alert variant="warning" className="restriction-alert mb-3">
                          <small>?? {voucher.restrictionReason}</small>
                        </Alert>
                      )}
                      
                      
                      {voucher.restrictionText && (
                        <div className="offer-restrictions mb-3">
                          <small className="text-info">
                            ?? {voucher.restrictionText}
                          </small>
                        </div>
                      )}
                      
                      <div className="offer-conditions mb-3">
                        {voucher.minSeats > 0 && (
                          <Badge bg="info" className="condition-badge">
                            ?? T?i thi?u {voucher.minSeats} gh?
                          </Badge>
                        )}
                        {voucher.minOrderValue > 0 && (
                          <Badge bg="warning" className="condition-badge">
                            ?? T?i thi?u {voucher.minOrderValue.toLocaleString()}d
                          </Badge>
                        )}
                        {voucher.maxDiscount && (
                          <Badge bg="success" className="condition-badge">
                            ?? T?i da {voucher.maxDiscount.toLocaleString()}d
                          </Badge>
                        )}
                      </div>
                      
                      <div className="offer-validity mb-3">
                        <small className="text-muted">
                          ?? Có hi?u l?c d?n: {new Date(voucher.validTo).toLocaleDateString('vi-VN')}
                        </small>
                      </div>
                      
                      <div className="offer-code mb-3">
                        <div className="code-display">
                          <span className="code-text">{voucher.code}</span>
                          <Button 
                            size="sm" 
                            variant={voucher.restricted ? "outline-secondary" : "outline-primary"}
                            onClick={() => handleCopyCode(voucher.code)}
                            className="copy-btn"
                            disabled={voucher.restricted}
                          >
                            {copiedCode === voucher.code ? '?' : '??'}
                          </Button>
                        </div>
                        {copiedCode === voucher.code && (
                          <small className="text-success">Ðã sao chép!</small>
                        )}
                      </div>
                      
                      <div className="mt-auto">
                        <div className="d-grid gap-2">
                          <Button 
                            variant={voucher.restricted ? "outline-secondary" : "primary"}
                            onClick={() => handleViewDetails(voucher)}
                            className={voucher.restricted ? "" : "btn-primary-custom"}
                          >
                            ?? Xem chi ti?t
                          </Button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            
            <Row>
              <Col xs={12}>
                <Card className="how-to-use-card">
                  <Card.Header className="text-center">
                    <h4 className="mb-0">?? Cách s? d?ng voucher</h4>
                  </Card.Header>
                  <Card.Body>
                    <Row className="g-4">
                      <Col md={3} className="text-center">
                        <div className="step-icon">1??</div>
                        <h6>Ch?n phim</h6>
                        <p className="small text-muted">Ch?n phim và su?t chi?u yêu thích</p>
                      </Col>
                      <Col md={3} className="text-center">
                        <div className="step-icon">2??</div>
                        <h6>Ch?n gh?</h6>
                        <p className="small text-muted">Ch?n gh? ng?i phù h?p</p>
                      </Col>
                      <Col md={3} className="text-center">
                        <div className="step-icon">3??</div>
                        <h6>Áp d?ng voucher</h6>
                        <p className="small text-muted">Nh?p mã voucher t?i trang thanh toán</p>
                      </Col>
                      <Col md={3} className="text-center">
                        <div className="step-icon">4??</div>
                        <h6>Thanh toán</h6>
                        <p className="small text-muted">Hoàn t?t thanh toán và nh?n vé</p>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Container>

      
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered className="offers-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            {getVoucherIcon(selectedVoucher?.type)} Chi ti?t uu dãi
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedVoucher && (
            <div className="voucher-details">
              <div className="text-center mb-4">
                <div className="modal-discount-badge">
                  <span className="modal-discount-value">{getDiscountText(selectedVoucher)}</span>
                  <span className="modal-discount-label">OFF</span>
                </div>
                <h4 className="mt-3">{selectedVoucher.title}</h4>
                <p className="text-muted">{selectedVoucher.description}</p>
              </div>
              
              <div className="voucher-info">
                <Row className="g-3">
                  <Col sm={6}>
                    <div className="info-item">
                      <strong>?? Mã voucher:</strong>
                      <div className="code-display mt-1">
                        <span className="code-text">{selectedVoucher.code}</span>
                        <Button 
                          size="sm" 
                          variant="outline-primary"
                          onClick={() => handleCopyCode(selectedVoucher.code)}
                        >
                          {copiedCode === selectedVoucher.code ? '?' : '??'}
                        </Button>
                      </div>
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div className="info-item">
                      <strong>?? Giá tr? gi?m:</strong>
                      <p>{selectedVoucher.type === 'percentage' ? `${selectedVoucher.value}%` : `${selectedVoucher.value.toLocaleString()}d`}</p>
                    </div>
                  </Col>
                  {selectedVoucher.minOrderValue > 0 && (
                    <Col sm={6}>
                      <div className="info-item">
                        <strong>?? Ðon hàng t?i thi?u:</strong>
                        <p>{selectedVoucher.minOrderValue.toLocaleString()}d</p>
                      </div>
                    </Col>
                  )}
                  {selectedVoucher.minSeats > 0 && (
                    <Col sm={6}>
                      <div className="info-item">
                        <strong>?? S? gh? t?i thi?u:</strong>
                        <p>{selectedVoucher.minSeats} gh?</p>
                      </div>
                    </Col>
                  )}
                  {selectedVoucher.maxDiscount && (
                    <Col sm={6}>
                      <div className="info-item">
                        <strong>?? Gi?m t?i da:</strong>
                        <p>{selectedVoucher.maxDiscount.toLocaleString()}d</p>
                      </div>
                    </Col>
                  )}
                  <Col sm={6}>
                    <div className="info-item">
                      <strong>?? Lu?t s? d?ng:</strong>
                      <p>{selectedVoucher.usedCount || 0}/{selectedVoucher.usageLimit}</p>
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div className="info-item">
                      <strong>?? Hi?u l?c t?:</strong>
                      <p>{new Date(selectedVoucher.validFrom).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div className="info-item">
                      <strong>?? Hi?u l?c d?n:</strong>
                      <p>{new Date(selectedVoucher.validTo).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </Col>
                </Row>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Ðóng
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              handleCopyCode(selectedVoucher?.code)
              setShowModal(false)
            }}
            className="btn-primary-custom"
          >
            ?? Sao chép mã
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
