import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Container, Card, Button, Alert, Spinner, Row, Col, Form, InputGroup, Badge } from 'react-bootstrap'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import VoucherValidator from '../utils/voucherValidation'
import './PaymentPage.css'

export default function PaymentPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  
  const bookingData = location.state
  
  const [vouchers, setVouchers] = useState([])
  const [selectedVoucher, setSelectedVoucher] = useState(null)
  const [voucherCode, setVoucherCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [voucherError, setVoucherError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!bookingData) {
      navigate('/movies')
      return
    }
    
    const loadVouchers = async () => {
      try {
        if (currentUser) {
          const availableVouchers = await VoucherValidator.getAvailableVouchersForUser(currentUser.id)
          setVouchers(availableVouchers)
        }
      } catch (err) {
        console.error('Lỗi tải voucher:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadVouchers()
  }, [bookingData, navigate, currentUser])

  const calculateDiscount = (voucher, subtotal, seatCount) => {
    if (!voucher) return 0
    
    if (voucher.minOrderValue && voucher.minOrderValue > 0 && subtotal < voucher.minOrderValue) {
      return 0
    }
    if (voucher.minSeats && voucher.minSeats > 0 && seatCount < voucher.minSeats) {
      return 0
    }
    
    let discount = 0
    if (voucher.type === 'percentage') {
      discount = (subtotal * voucher.value) / 100
    } else if (voucher.type === 'fixed') {
      discount = voucher.value
    }
    
    if (voucher.maxDiscount && discount > voucher.maxDiscount) {
      discount = voucher.maxDiscount
    }
    
    return Math.min(discount, subtotal) // Không được giảm quá tổng tiền
  }

  const handleApplyVoucher = () => {
    setVoucherError('')
    
    if (!voucherCode.trim()) {
      setVoucherError('Vui lòng nhập mã voucher')
      return
    }
    
    let voucher = vouchers.find(v => v.code === voucherCode)
    if (!voucher) {
      voucher = vouchers.find(v => v.code.toLowerCase() === voucherCode.toLowerCase())
    }
    if (!voucher) {
      voucher = vouchers.find(v => v.code.trim() === voucherCode.trim())
    }
    
    if (!voucher) {
      setVoucherError(`Mã voucher "${voucherCode}" không tồn tại hoặc đã hết hạn`)
      return
    }
    
    if (voucher.restricted) {
      setVoucherError(voucher.restrictionReason)
      return
    }

    const { subtotal, seatCount } = bookingData
    
    if (voucher.minSeats && voucher.minSeats > 0 && seatCount < voucher.minSeats) {
      setVoucherError(`Cần mua tối thiểu ${voucher.minSeats} ghế`)
      return
    }
    
    if (voucher.minOrderValue && voucher.minOrderValue > 0 && subtotal < voucher.minOrderValue) {
      setVoucherError(`Đơn hàng tối thiểu ${voucher.minOrderValue.toLocaleString()}đ`)
      return
    }
    
    if (voucher.usedCount >= voucher.usageLimit) {
      setVoucherError('Voucher đã hết lượt sử dụng')
      return
    }
    
    setSelectedVoucher(voucher)
    setVoucherCode('')
  }

  const handleRemoveVoucher = () => {
    setSelectedVoucher(null)
    setVoucherError('')
  }

  const handlePayment = async () => {
    setSubmitting(true)
    setError('')
    
    try {
      const { showtimeId, selectedSeats, subtotal, seatCount, showtime, movie } = bookingData
      const discount = calculateDiscount(selectedVoucher, subtotal, seatCount)
      const finalTotal = subtotal - discount
      
      const bookingRes = await axios.post('http://localhost:8080/api/bookings', {
        userId: currentUser.id,
        showtimeId: showtimeId,
        seatNums: JSON.stringify(selectedSeats), // Convert to JSON string
        totalPrice: finalTotal,
        originalPrice: subtotal,
        discount: discount,
        voucherCode: selectedVoucher?.code || null,
        status: 'CONFIRMED'
      })

      // Update showtime booked seats
      const currentBookedStr = showtime.bookedSeatNums || '[]'
      const currentBooked = JSON.parse(currentBookedStr)
      const newBookedSeatNums = [...currentBooked, ...selectedSeats]
      
      await axios.patch(`http://localhost:8080/api/showtimes/${showtimeId}`, {
        bookedSeatNums: JSON.stringify(newBookedSeatNums)
      })

      if (selectedVoucher) {
        console.log('Updating voucher usage:', selectedVoucher.code, 'from', selectedVoucher.usedCount, 'to', selectedVoucher.usedCount + 1)
        
        await axios.patch(`http://localhost:8080/api/vouchers/${selectedVoucher.id}`, {
          usedCount: (selectedVoucher.usedCount || 0) + 1
        })
        
        console.log('Voucher usage updated successfully')
      }

      setSuccess(true)
    } catch (err) {
      setError('Thanh toán thất bại. Vui lòng thử lại.')
      console.error('Payment error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (!bookingData) {
    return null
  }

  if (loading) {
    return (
      <div className="text-center py-5 mt-5">
        <Spinner variant="warning" style={{ width: 60, height: 60 }} />
      </div>
    )
  }

  if (success) {
    const { selectedSeats, showtime, movie } = bookingData
    const discount = calculateDiscount(selectedVoucher, bookingData.subtotal, bookingData.seatCount)
    const finalTotal = bookingData.subtotal - discount

    return (
      <div className="page-wrapper d-flex align-items-center min-vh-100">
        <Container style={{ maxWidth: 500 }} className="mx-auto">
          <Card className="booking-success-card text-center p-5">
            <div style={{ fontSize: 64 }}>🎉</div>
            <h3 className="fw-bold mt-3 mb-2">Thanh toán thành công!</h3>
            <p className="text-muted">Chúc bạn xem phim vui vẻ!</p>
            <div className="booking-confirm-info my-3 p-3 rounded text-start">
              <div><strong>Phim:</strong> {movie?.title}</div>
              <div><strong>Ngày chiếu:</strong> {showtime?.date} lúc {showtime?.time}</div>
              <div><strong>Phòng:</strong> {showtime?.room}</div>
              <div><strong>Ghế:</strong> <span className="text-warning fw-bold">{selectedSeats.join(', ')}</span></div>
              {selectedVoucher && (
                <>
                  <div><strong>Voucher:</strong> {selectedVoucher.code} (-{discount.toLocaleString()}đ)</div>
                </>
              )}
              <div><strong>Tổng tiền:</strong> <span className="text-warning fw-bold">{finalTotal.toLocaleString()}đ</span></div>
            </div>
            <div className="d-flex gap-2 justify-content-center mt-3">
              <Button className="btn-primary-custom" onClick={() => navigate('/my-bookings')}>🎫 Xem vé của tôi</Button>
              <Button variant="outline-secondary" onClick={() => navigate('/movies')}>Đặt vé khác</Button>
            </div>
          </Card>
        </Container>
      </div>
    )
  }

  const { selectedSeats, subtotal, seatCount, showtime, movie } = bookingData
  const discount = calculateDiscount(selectedVoucher, subtotal, seatCount)
  const finalTotal = subtotal - discount

  return (
    <div className="page-wrapper">
      <div className="page-header-banner py-4 text-center">
        <Container>
          <h1 className="fw-bold">💳 Thanh Toán</h1>
          <p className="text-muted mb-0">Xác nhận thông tin và hoàn tất thanh toán</p>
        </Container>
      </div>

      <Container className="py-4">
        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

        <Row className="g-4">
          
          <Col lg={8}>
            <Card className="booking-info-card mb-4">
              <Card.Body className="p-4">
                <h5 className="fw-bold mb-3">📋 Thông tin đặt vé</h5>
                <div className="d-flex gap-3 mb-3">
                  <img
                    src={movie?.poster}
                    alt={movie?.title}
                    style={{ width: 80, height: 120, borderRadius: 8, objectFit: 'cover' }}
                    onError={e => e.target.src = 'https://via.placeholder.com/80x120?text=?'}
                  />
                  <div>
                    <h6 className="fw-bold mb-1">{movie?.title}</h6>
                    <div className="text-muted small mb-1">
                      
                      {movie?.genres && Array.isArray(movie.genres) 
                        ? movie.genres.slice(0, 2).join(', ') 
                        : movie?.genre
                      } · {movie?.duration} phút
                    </div>
                    <div className="text-muted small mb-1">📅 {showtime?.date} · ⏰ {showtime?.time}</div>
                    <div className="text-muted small">🏟️ {showtime?.room}</div>
                  </div>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span>Ghế đã chọn:</span>
                  <div>
                    {selectedSeats.map(seat => (
                      <Badge key={seat} bg="primary" className="me-1">{seat}</Badge>
                    ))}
                  </div>
                </div>
              </Card.Body>
            </Card>

            
            <Card className="booking-info-card">
              <Card.Body className="p-4">
                <h5 className="fw-bold mb-3">🎫 Mã giảm giá</h5>
                
                
                <div className="mb-4">
                  <h6 className="mb-3">Voucher khả dụng:</h6>
                  <Row xs={1} sm={2} className="g-2">
                    {vouchers.slice(0, 4).map(voucher => {
                      let canUse = !voucher.restricted
                      let reason = voucher.restrictionReason || ''
                      
                      if (canUse) {
                        if (voucher.minSeats && voucher.minSeats > 0 && seatCount < voucher.minSeats) {
                          canUse = false
                          reason = `Cần tối thiểu ${voucher.minSeats} ghế`
                        }
                        
                        else if (voucher.minOrderValue && voucher.minOrderValue > 0 && subtotal < voucher.minOrderValue) {
                          canUse = false
                          reason = `Cần tối thiểu ${voucher.minOrderValue.toLocaleString()}đ`
                        }
                        
                        else if (voucher.usedCount >= voucher.usageLimit) {
                          canUse = false
                          reason = 'Đã hết lượt'
                        }
                      }
                      
                      return (
                        <Col key={voucher.id}>
                          <div 
                            className={`voucher-mini-card ${canUse ? 'available' : 'unavailable'} ${selectedVoucher?.id === voucher.id ? 'selected' : ''}`}
                            onClick={() => canUse && setSelectedVoucher(selectedVoucher?.id === voucher.id ? null : voucher)}
                          >
                            <div className="voucher-mini-header">
                              <span className="voucher-mini-discount">
                                {voucher.type === 'percentage' ? `${voucher.value}%` : `${(voucher.value/1000)}K`}
                              </span>
                              <span className="voucher-mini-type">OFF</span>
                            </div>
                            <div className="voucher-mini-body">
                              <div className="voucher-mini-title">{voucher.title}</div>
                              <div className="voucher-mini-code">{voucher.code}</div>
                            </div>
                            {!canUse && (
                              <div className="voucher-mini-overlay">
                                <small>{reason}</small>
                              </div>
                            )}
                          </div>
                        </Col>
                      )
                    })}
                  </Row>
                </div>

                
                <div>
                  <h6 className="mb-2">Hoặc nhập mã voucher:</h6>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Nhập mã voucher..."
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      onKeyPress={(e) => e.key === 'Enter' && handleApplyVoucher()}
                    />
                    <Button variant="outline-primary" onClick={handleApplyVoucher}>
                      Áp dụng
                    </Button>
                  </InputGroup>
                  {voucherError && <div className="text-danger small mt-1">{voucherError}</div>}
                </div>

                
                {selectedVoucher && (
                  <div className="selected-voucher-card mt-3 p-3 rounded">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-bold text-success">✅ {selectedVoucher.title}</div>
                        <div className="small text-muted">{selectedVoucher.description}</div>
                        <div className="small">Mã: <strong>{selectedVoucher.code}</strong></div>
                      </div>
                      <div className="text-end">
                        <div className="text-success fw-bold">-{discount.toLocaleString()}đ</div>
                        <Button size="sm" variant="outline-danger" onClick={handleRemoveVoucher}>
                          Bỏ chọn
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          
          <Col lg={4}>
            <Card className="booking-form-card sticky-top" style={{ top: 90 }}>
              <Card.Body className="p-4">
                <h5 className="fw-bold mb-3">💰 Tổng kết thanh toán</h5>
                
                <div className="payment-summary">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Số ghế:</span>
                    <span>{seatCount} ghế</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Giá/ghế:</span>
                    <span>{showtime?.price?.toLocaleString()}đ</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Tạm tính:</span>
                    <span>{subtotal.toLocaleString()}đ</span>
                  </div>
                  
                  {selectedVoucher && (
                    <div className="d-flex justify-content-between mb-2 text-success">
                      <span>Giảm giá ({selectedVoucher.code}):</span>
                      <span>-{discount.toLocaleString()}đ</span>
                    </div>
                  )}
                  
                  <hr />
                  <div className="d-flex justify-content-between fw-bold fs-5 mb-3">
                    <span>Tổng cộng:</span>
                    <span className="text-warning">{finalTotal.toLocaleString()}đ</span>
                  </div>
                </div>

                <Button
                  className="w-100 btn-primary-custom"
                  disabled={submitting}
                  onClick={handlePayment}
                  size="lg"
                >
                  {submitting ? <Spinner size="sm" /> : `💳 Thanh toán ${finalTotal.toLocaleString()}đ`}
                </Button>

                <div className="text-center mt-3">
                  <small className="text-muted">
                    Bằng cách thanh toán, bạn đồng ý với điều khoản sử dụng
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}