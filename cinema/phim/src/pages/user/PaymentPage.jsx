import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { paymentApi } from '../../services/api'
import { getSeatInfo } from '../../utils/seatPricing'
import VoucherValidator from '../../utils/voucherValidation'
import './PaymentPage.css'


const PAYMENT_METHODS = [
  {
    id: 'QR',
    label: 'Ví điện tử / QR',
    icon: '📱',
    desc: 'MoMo, ZaloPay, VNPay, QR Banking',
  },
  {
    id: 'CARD',
    label: 'Thẻ ngân hàng',
    icon: '💳',
    desc: 'Visa, Mastercard, ATM nội địa',
  },
]

export default function PaymentPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, updateUser } = useAuth()

  const bookingData = location.state

  // ─── State ───────────────────────────────────────────────
  const [vouchers, setVouchers] = useState([])
  const [selectedVoucher, setSelectedVoucher] = useState(null)
  const [voucherValidation, setVoucherValidation] = useState(null) // { valid, message, discountAmount }
  const [applyingVoucher, setApplyingVoucher] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('QR')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [successData, setSuccessData] = useState(null)
  
  const [usePoints, setUsePoints] = useState(false)
  const [pointsToUse, setPointsToUse] = useState(0)

  // ─── Redirect nếu không có data ──────────────────────────
  useEffect(() => {
    if (!bookingData) {
      navigate('/movies')
      return
    }
    const loadVouchers = async () => {
      try {
        const { subtotal, seatCount } = bookingData
        const list = await VoucherValidator.getVouchersWithStatus(
          currentUser?.id,
          subtotal,
          seatCount
        )
        setVouchers(list)
      } catch (err) {
        console.error('Lỗi tải voucher:', err)
      } finally {
        setLoading(false)
      }
    }
    loadVouchers()
  }, [bookingData, navigate, currentUser])

  // ─── Tính giảm giá preview (client-side) ─────────────────
  const previewDiscount = selectedVoucher
    ? VoucherValidator.calculateDiscount(selectedVoucher, bookingData?.subtotal || 0)
    : (voucherValidation?.valid ? (voucherValidation.discountAmount || 0) : 0)

  // ─── Xử lý Điểm tích lũy ─────────────────────────────────
  const handlePointsChange = (val) => {
    let pts = parseInt(val, 10)
    if (isNaN(pts)) pts = 0
    const maxUsable = Math.min(currentUser?.points || 0, (bookingData?.subtotal || 0) - previewDiscount)
    if (pts > maxUsable) pts = maxUsable
    if (pts < 0) pts = 0
    setPointsToUse(pts)
  }

  useEffect(() => {
    if (usePoints) {
      const maxUsable = Math.min(currentUser?.points || 0, (bookingData?.subtotal || 0) - previewDiscount)
      if (pointsToUse > maxUsable) {
        setPointsToUse(maxUsable)
      } else if (pointsToUse === 0 && maxUsable > 0) {
        // Mặc định điền max điểm nếu bật switch mà đang là 0
        setPointsToUse(maxUsable)
      }
    } else {
      setPointsToUse(0)
    }
  }, [usePoints, previewDiscount, currentUser?.points, bookingData?.subtotal])

  const finalTotal = Math.max(0, (bookingData?.subtotal || 0) - previewDiscount - pointsToUse)

  // ─── Click chọn voucher từ danh sách ─────────────────────
  const handleSelectVoucher = async (voucher) => {
    if (!voucher.canUse) return
    if (selectedVoucher?.id === voucher.id) {
      setSelectedVoucher(null)
      setVoucherValidation(null)
      return
    }
    setApplyingVoucher(true)
    setVoucherValidation(null)

    const result = await paymentApi.validateVoucher({
      voucherCode: voucher.code,
      userId: currentUser?.id,
      subtotal: Math.floor(bookingData?.subtotal || 0),
      seatCount: Math.floor(bookingData?.seatCount || 0),
    }).then(r => r.data).catch((err) => ({
      valid: false,
      message: err.response?.data?.message || 'Lỗi kết nối, vui lòng thử lại'
    }))

    if (result.valid) {
      setSelectedVoucher(voucher)
      setVoucherValidation(result)
    } else {
      setVoucherValidation(result)
    }
    setApplyingVoucher(false)
  }

  const handleRemoveVoucher = () => {
    setSelectedVoucher(null)
    setVoucherValidation(null)
  }

  // ─── Checkout ─────────────────────────────────────────────
  const handleCheckout = async () => {
    setSubmitting(true)
    setError('')

    try {
      const { showtimeId, selectedSeats, subtotal } = bookingData

      const res = await paymentApi.checkout({
        userId: currentUser.id,
        showtimeId,
        seatNums: JSON.stringify(selectedSeats),
        subtotal,
        voucherCode: selectedVoucher?.code || null,
        paymentMethod,
        usePoints: usePoints ? pointsToUse : 0,
      })

      setSuccessData(res.data)
      
      // Cập nhật lại số điểm của user trong context để UI tự refresh
      // Luôn cập nhật điểm, ngay cả khi pointsEarned = 0
      const newPoints = Math.max(0, 
        (currentUser?.points || 0) 
        + (res.data.pointsEarned || 0) 
        - (res.data.pointsUsed || 0)
      )
      updateUser({ points: newPoints })

      setSuccess(true)
    } catch (err) {
      const msg = err.response?.data || 'Thanh toán thất bại. Vui lòng thử lại.'
      setError(typeof msg === 'string' ? msg : 'Thanh toán thất bại. Vui lòng thử lại.')
      console.error('Payment error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Guard ────────────────────────────────────────────────
  if (!bookingData) return null

  if (loading) {
    return (
      <div className="pay-loading">
        <div className="pay-spinner" />
        <p>Đang tải thông tin thanh toán…</p>
      </div>
    )
  }

  // ─── SUCCESS SCREEN ───────────────────────────────────────
  if (success) {
    const { selectedSeats, showtime, movie } = bookingData
    const bookingCode = successData?.bookingCode
    return (
      <div className="pay-success-wrapper">
        <div className="pay-success-card">
          <div className="pay-success-icon">🎉</div>
          <h2>Thanh toán thành công!</h2>
          <p className="pay-success-sub">Chúc bạn xem phim vui vẻ! Xuất trình mã QR bên dưới khi vào rạp.</p>

          {/* QR Code */}
          {bookingCode && (
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(bookingCode)}`}
                alt={`QR vé ${bookingCode}`}
                style={{ width: 180, height: 180, borderRadius: 12, border: '3px solid var(--primary, #f5a623)' }}
              />
              <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: 2, marginTop: 10, color: 'var(--primary, #f5a623)' }}>
                {bookingCode}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #a8a8b8)', marginTop: 6 }}>
                🎫 Đưa mã QR này cho nhân viên tại cổng vào rạp
              </p>
            </div>
          )}

          <div className="pay-ticket">
            <div className="pay-ticket-movie">{movie?.title}</div>
            <div className="pay-ticket-grid">
              <div><span>📅 Ngày</span><strong>{showtime?.date}</strong></div>
              <div><span>⏰ Giờ</span><strong>{showtime?.time}</strong></div>
              <div><span>🏟️ Phòng</span><strong>{showtime?.room}</strong></div>
              <div>
                <span>💺 Ghế</span>
                <strong className="pay-ticket-seats">{selectedSeats.join(', ')}</strong>
              </div>
              {selectedVoucher && (
                <div>
                  <span>🎫 Voucher</span>
                  <strong className="pay-ticket-discount">-{previewDiscount.toLocaleString()}đ</strong>
                </div>
              )}
              {successData?.pointsUsed > 0 && (
                <div>
                  <span>⭐ Điểm đã dùng</span>
                  <strong className="pay-ticket-discount">-{successData.pointsUsed.toLocaleString()}đ</strong>
                </div>
              )}
              {successData?.pointsEarned > 0 && (
                <div>
                  <span>🎁 Điểm nhận được</span>
                  <strong style={{ color: '#00b0ff' }}>+{successData.pointsEarned.toLocaleString()} điểm</strong>
                </div>
              )}
              <div>
                <span>💰 Tổng tiền</span>
                <strong className="pay-ticket-total">{finalTotal.toLocaleString()}đ</strong>
              </div>
              <div>
                <span>💳 Phương thức</span>
                <strong>{PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}</strong>
              </div>
            </div>
          </div>

          <div className="pay-success-actions">
            <button className="pay-btn-primary" onClick={() => navigate('/my-bookings')}>
              🎫 Xem vé của tôi
            </button>
            <button className="pay-btn-outline" onClick={() => navigate('/movies')}>
              Đặt vé khác
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── MAIN PAYMENT PAGE ────────────────────────────────────
  const { selectedSeats, subtotal, seatCount, showtime, movie } = bookingData

  return (
    <div className="pay-wrapper">
      {/* Header */}
      <div className="pay-header">
        <div className="pay-header-inner">
          <h1>💳 Thanh Toán</h1>
          <p>Xác nhận thông tin và hoàn tất đặt vé</p>
        </div>
      </div>

      <div className="pay-container">
        {error && (
          <div className="pay-error-banner">
            <span>⚠️ {error}</span>
            <button onClick={() => setError('')}>✕</button>
          </div>
        )}

        <div className="pay-grid">
          {/* ─── LEFT COLUMN ─────────────────────────────────── */}
          <div className="pay-left">

            {/* Thông tin đặt vé */}
            <div className="pay-card">
              <div className="pay-card-header">
                <span className="pay-card-icon">🎬</span>
                <h3>Thông tin đặt vé</h3>
              </div>
              <div className="pay-movie-info">
                <img
                  src={movie?.poster}
                  alt={movie?.title}
                  className="pay-poster"
                  onError={e => e.target.src = 'https://placehold.co/80x120?text=?'}
                />
                <div className="pay-movie-details">
                  <h4>{movie?.title}</h4>
                  <div className="pay-meta">
                    {movie?.genres && Array.isArray(movie.genres)
                      ? movie.genres.slice(0, 2).join(' · ')
                      : movie?.genre}
                    {movie?.duration ? ` · ${movie.duration} phút` : ''}
                  </div>
                  <div className="pay-meta">📅 {showtime?.date} · ⏰ {showtime?.time}</div>
                  <div className="pay-meta">🏟️ {showtime?.room}</div>
                </div>
              </div>
              <div className="pay-seats-row">
                <span>💺 Ghế đã chọn:</span>
                <div className="pay-seat-badges">
                  {selectedSeats.map(seat => {
                    const info = getSeatInfo(seat, showtime?.price || 0)
                    return (
                      <span key={seat} className="pay-seat-badge" style={{ backgroundColor: info.type === 'vip' ? '#f39c12' : info.type === 'couple' ? '#be2edd' : undefined }}>
                        {seat} ({info.label})
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Phương thức thanh toán */}
            <div className="pay-card">
              <div className="pay-card-header">
                <span className="pay-card-icon">💳</span>
                <h3>Phương thức thanh toán</h3>
              </div>
              <div className="pay-methods">
                {PAYMENT_METHODS.map(m => (
                  <div
                    key={m.id}
                    className={`pay-method-card ${paymentMethod === m.id ? 'active' : ''}`}
                    onClick={() => setPaymentMethod(m.id)}
                    role="radio"
                    aria-checked={paymentMethod === m.id}
                  >
                    <div className="pay-method-radio">
                      <div className={`pay-radio-dot ${paymentMethod === m.id ? 'active' : ''}`} />
                    </div>
                    <div className="pay-method-icon">{m.icon}</div>
                    <div className="pay-method-body">
                      <div className="pay-method-label">{m.label}</div>
                      <div className="pay-method-desc">{m.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mã giảm giá */}
            <div className="pay-card">
              <div className="pay-card-header">
                <span className="pay-card-icon">🎫</span>
                <h3>Mã giảm giá</h3>
              </div>

              {/* Voucher đang áp dụng */}
              {selectedVoucher && (
                <div className="pay-voucher-applied">
                  <div className="pay-voucher-applied-left">
                    <div className="pay-voucher-applied-icon">✅</div>
                    <div>
                      <div className="pay-voucher-applied-title">{selectedVoucher.title || selectedVoucher.code}</div>
                      <div className="pay-voucher-applied-code">
                        Mã: <strong>{selectedVoucher.code}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="pay-voucher-applied-right">
                    <div className="pay-voucher-applied-discount">
                      -{previewDiscount.toLocaleString()}đ
                    </div>
                    <button className="pay-voucher-remove" onClick={handleRemoveVoucher}>
                      Bỏ chọn
                    </button>
                  </div>
                </div>
              )}

              {/* Thông báo lỗi validation */}
              {voucherValidation && !voucherValidation.valid && (
                <div className="pay-error-banner" style={{ marginBottom: '1rem' }}>
                  <span>⚠️ {voucherValidation.message}</span>
                  <button onClick={() => setVoucherValidation(null)}>✕</button>
                </div>
              )}

              {/* Danh sách voucher có sẵn */}
              {vouchers.length > 0 && (
                <div className="pay-voucher-list">
                  <div className="pay-voucher-list-title">Voucher khả dụng:</div>
                  <div className="pay-voucher-grid">
                    {vouchers.slice(0, 6).map(voucher => (
                      <div
                        key={voucher.id}
                        className={`pay-voucher-chip
                          ${voucher.canUse ? 'usable' : 'unusable'}
                          ${selectedVoucher?.id === voucher.id ? 'selected' : ''}
                        `}
                        onClick={() => handleSelectVoucher(voucher)}
                        title={voucher.reason || VoucherValidator.getRestrictionText(voucher)}
                      >
                        <div className="pay-voucher-chip-value">{voucher.displayValue} OFF</div>
                        <div className="pay-voucher-chip-code">{voucher.code}</div>
                        {!voucher.canUse && (
                          <div className="pay-voucher-chip-overlay">{voucher.reason}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Điểm tích lũy */}
            <div className="pay-card">
              <div className="pay-card-header">
                <span className="pay-card-icon">⭐</span>
                <h3>Điểm tích lũy</h3>
              </div>
              <div className="pay-points-container" style={{ padding: '0 0.5rem' }}>
                <p style={{ margin: '0 0 1rem 0' }}>Bạn đang có <strong style={{ color: '#00b0ff' }}>{currentUser?.points?.toLocaleString() || 0}</strong> điểm</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <input
                    type="checkbox"
                    id="usePointsCheckbox"
                    checked={usePoints}
                    onChange={(e) => setUsePoints(e.target.checked)}
                    disabled={!currentUser?.points || currentUser.points <= 0}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="usePointsCheckbox" style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Dùng điểm để giảm giá
                  </label>
                </div>
                {usePoints && (
                  <div className="pay-points-input-box">
                    <label>
                      Số điểm muốn dùng:
                    </label>
                    <input
                      type="number"
                      className="pay-input"
                      value={pointsToUse}
                      onChange={(e) => handlePointsChange(e.target.value)}
                      max={currentUser?.points || 0}
                      min={0}
                    />
                    <div className="pay-points-hint">
                      (Tối đa: {Math.min(currentUser?.points || 0, subtotal - previewDiscount).toLocaleString()} điểm = {Math.min(currentUser?.points || 0, subtotal - previewDiscount).toLocaleString()}đ)
                    </div>
                  </div>
                )}
              </div>
            </div>
            
          </div>

          {/* ─── RIGHT COLUMN (SUMMARY) ──────────────────────── */}
          <div className="pay-right">
            <div className="pay-summary-card">
              <div className="pay-card-header">
                <span className="pay-card-icon">💰</span>
                <h3>Tổng kết đơn hàng</h3>
              </div>

              <div className="pay-summary-rows">
                <div className="pay-summary-row">
                  <span>Số ghế</span>
                  <span>{seatCount} ghế</span>
                </div>
                <div className="pay-summary-row">
                  <span>Giá/ghế</span>
                  <span>{showtime?.price?.toLocaleString()}đ</span>
                </div>
                <div className="pay-summary-row">
                  <span>Tạm tính</span>
                  <span>{subtotal.toLocaleString()}đ</span>
                </div>
                {selectedVoucher && (
                  <div className="pay-summary-row discount">
                    <span>Voucher ({selectedVoucher.code})</span>
                    <span>-{previewDiscount.toLocaleString()}đ</span>
                  </div>
                )}
                {usePoints && pointsToUse > 0 && (
                  <div className="pay-summary-row discount">
                    <span>Dùng điểm</span>
                    <span>-{pointsToUse.toLocaleString()}đ</span>
                  </div>
                )}
                <div className="pay-summary-row method">
                  <span>Phương thức</span>
                  <span>{PAYMENT_METHODS.find(m => m.id === paymentMethod)?.icon} {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}</span>
                </div>
              </div>

              <div className="pay-summary-divider" />

              <div className="pay-summary-total">
                <span>Tổng cộng</span>
                <span className="pay-total-amount">{finalTotal.toLocaleString()}đ</span>
              </div>

              {selectedVoucher && previewDiscount > 0 && (
                <div className="pay-saving-badge">
                  🎉 Bạn tiết kiệm được {previewDiscount.toLocaleString()}đ
                </div>
              )}

              <button
                className="pay-checkout-btn"
                onClick={handleCheckout}
                disabled={submitting}
                id="checkout-btn"
              >
                {submitting
                  ? <><span className="pay-btn-spinner" /> Đang xử lý…</>
                  : `💳 Thanh toán ${finalTotal.toLocaleString()}đ`
                }
              </button>

              <p className="pay-terms-note">
                Bằng cách thanh toán, bạn đồng ý với{' '}
                <a href="/terms" target="_blank">điều khoản sử dụng</a> của CinemaXP.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}