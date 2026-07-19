import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { paymentApi } from '../services/api'
import VoucherValidator from '../utils/voucherValidation'
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
  {
    id: 'CASH',
    label: 'Tiền mặt tại quầy',
    icon: '🏧',
    desc: 'Thanh toán trực tiếp tại rạp',
  },
]

export default function PaymentPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser } = useAuth()

  const bookingData = location.state

  // ─── State ───────────────────────────────────────────────
  const [vouchers, setVouchers] = useState([])
  const [selectedVoucher, setSelectedVoucher] = useState(null)
  const [voucherCode, setVoucherCode] = useState('')
  const [voucherValidation, setVoucherValidation] = useState(null) // { valid, message, discountAmount }
  const [applyingVoucher, setApplyingVoucher] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('QR')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [successData, setSuccessData] = useState(null)

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

  const finalTotal = (bookingData?.subtotal || 0) - previewDiscount

  // ─── Apply voucher từ input ────────────────────────────────
  const handleApplyVoucher = useCallback(async () => {
    if (!voucherCode.trim()) return
    setApplyingVoucher(true)
    setVoucherValidation(null)

    const result = await paymentApi.validateVoucher({
      voucherCode: voucherCode.trim().toUpperCase(),
      userId: currentUser?.id,
      subtotal: bookingData?.subtotal,
      seatCount: bookingData?.seatCount,
    }).then(r => r.data).catch(() => ({
      valid: false,
      message: 'Lỗi kết nối, vui lòng thử lại'
    }))

    setVoucherValidation(result)
    if (result.valid) {
      // Tìm trong danh sách hoặc tạo object tạm
      const found = vouchers.find(v =>
        v.code?.toUpperCase() === voucherCode.trim().toUpperCase()
      )
      setSelectedVoucher(found || {
        id: result.voucherId,
        code: result.voucherCode,
        title: result.voucherTitle,
        discountAmount: result.discountAmount,
      })
      setVoucherCode('')
    }
    setApplyingVoucher(false)
  }, [voucherCode, currentUser, bookingData, vouchers])

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
      subtotal: bookingData?.subtotal,
      seatCount: bookingData?.seatCount,
    }).then(r => r.data).catch(() => ({
      valid: false,
      message: 'Lỗi kết nối, vui lòng thử lại'
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
    setVoucherCode('')
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
      })

      setSuccessData(res.data)
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
    return (
      <div className="pay-success-wrapper">
        <div className="pay-success-card">
          <div className="pay-success-icon">🎉</div>
          <h2>Thanh toán thành công!</h2>
          <p className="pay-success-sub">Chúc bạn xem phim vui vẻ! Vé đã được ghi nhận.</p>

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
                  {selectedSeats.map(seat => (
                    <span key={seat} className="pay-seat-badge">{seat}</span>
                  ))}
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

              {/* Voucher input */}
              <div className="pay-voucher-input-row">
                <input
                  type="text"
                  placeholder="Nhập mã voucher (VD: WELCOME20)..."
                  value={voucherCode}
                  onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleApplyVoucher()}
                  className="pay-voucher-input"
                  disabled={!!selectedVoucher || applyingVoucher}
                />
                <button
                  className="pay-voucher-btn"
                  onClick={handleApplyVoucher}
                  disabled={!voucherCode.trim() || !!selectedVoucher || applyingVoucher}
                >
                  {applyingVoucher ? <span className="pay-btn-spinner" /> : 'Áp dụng'}
                </button>
              </div>

              {/* Validation message (từ server) */}
              {voucherValidation && !voucherValidation.valid && (
                <div className="pay-voucher-error">
                  ❌ {voucherValidation.message}
                </div>
              )}

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
          </div>

          {/* ─── RIGHT COLUMN (Sticky Summary) ───────────────── */}
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
                {selectedVoucher && previewDiscount > 0 && (
                  <div className="pay-summary-row discount">
                    <span>🎫 Giảm giá ({selectedVoucher.code})</span>
                    <span>-{previewDiscount.toLocaleString()}đ</span>
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