import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { paymentApi } from '../../services/api'
import VoucherValidator from '../../utils/voucherValidation'
import './PaymentPage.css'

const PAYMENT_METHODS = [
  {
    id: 'QR',
    label: 'VÃ­ Ä‘iá»‡n tá»­ / QR',
    icon: 'ðŸ“±',
    desc: 'MoMo, ZaloPay, VNPay, QR Banking',
  },
  {
    id: 'CARD',
    label: 'Tháº» ngÃ¢n hÃ ng',
    icon: 'ðŸ’³',
    desc: 'Visa, Mastercard, ATM ná»™i Ä‘á»‹a',
  },
  {
    id: 'CASH',
    label: 'Tiá»n máº·t táº¡i quáº§y',
    icon: 'ðŸ§',
    desc: 'Thanh toÃ¡n trá»±c tiáº¿p táº¡i ráº¡p',
  },
]

export default function PaymentPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser } = useAuth()

  const bookingData = location.state

  // â”€â”€â”€ State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ Redirect náº¿u khÃ´ng cÃ³ data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        console.error('Lá»—i táº£i voucher:', err)
      } finally {
        setLoading(false)
      }
    }
    loadVouchers()
  }, [bookingData, navigate, currentUser])

  // â”€â”€â”€ TÃ­nh giáº£m giÃ¡ preview (client-side) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const previewDiscount = selectedVoucher
    ? VoucherValidator.calculateDiscount(selectedVoucher, bookingData?.subtotal || 0)
    : (voucherValidation?.valid ? (voucherValidation.discountAmount || 0) : 0)

  const finalTotal = (bookingData?.subtotal || 0) - previewDiscount

  // â”€â”€â”€ Apply voucher tá»« input â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      message: 'Lá»—i káº¿t ná»‘i, vui lÃ²ng thá»­ láº¡i'
    }))

    setVoucherValidation(result)
    if (result.valid) {
      // TÃ¬m trong danh sÃ¡ch hoáº·c táº¡o object táº¡m
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

  // â”€â”€â”€ Click chá»n voucher tá»« danh sÃ¡ch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      message: 'Lá»—i káº¿t ná»‘i, vui lÃ²ng thá»­ láº¡i'
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

  // â”€â”€â”€ Checkout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      const msg = err.response?.data || 'Thanh toÃ¡n tháº¥t báº¡i. Vui lÃ²ng thá»­ láº¡i.'
      setError(typeof msg === 'string' ? msg : 'Thanh toÃ¡n tháº¥t báº¡i. Vui lÃ²ng thá»­ láº¡i.')
      console.error('Payment error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // â”€â”€â”€ Guard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (!bookingData) return null

  if (loading) {
    return (
      <div className="pay-loading">
        <div className="pay-spinner" />
        <p>Äang táº£i thÃ´ng tin thanh toÃ¡nâ€¦</p>
      </div>
    )
  }

  // â”€â”€â”€ SUCCESS SCREEN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (success) {
    const { selectedSeats, showtime, movie } = bookingData
    return (
      <div className="pay-success-wrapper">
        <div className="pay-success-card">
          <div className="pay-success-icon">ðŸŽ‰</div>
          <h2>Thanh toÃ¡n thÃ nh cÃ´ng!</h2>
          <p className="pay-success-sub">ChÃºc báº¡n xem phim vui váº»! VÃ© Ä‘Ã£ Ä‘Æ°á»£c ghi nháº­n.</p>

          <div className="pay-ticket">
            <div className="pay-ticket-movie">{movie?.title}</div>
            <div className="pay-ticket-grid">
              <div><span>ðŸ“… NgÃ y</span><strong>{showtime?.date}</strong></div>
              <div><span>â° Giá»</span><strong>{showtime?.time}</strong></div>
              <div><span>ðŸŸï¸ PhÃ²ng</span><strong>{showtime?.room}</strong></div>
              <div>
                <span>ðŸ’º Gháº¿</span>
                <strong className="pay-ticket-seats">{selectedSeats.join(', ')}</strong>
              </div>
              {selectedVoucher && (
                <div>
                  <span>ðŸŽ« Voucher</span>
                  <strong className="pay-ticket-discount">-{previewDiscount.toLocaleString()}Ä‘</strong>
                </div>
              )}
              <div>
                <span>ðŸ’° Tá»•ng tiá»n</span>
                <strong className="pay-ticket-total">{finalTotal.toLocaleString()}Ä‘</strong>
              </div>
              <div>
                <span>ðŸ’³ PhÆ°Æ¡ng thá»©c</span>
                <strong>{PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}</strong>
              </div>
            </div>
          </div>

          <div className="pay-success-actions">
            <button className="pay-btn-primary" onClick={() => navigate('/my-bookings')}>
              ðŸŽ« Xem vÃ© cá»§a tÃ´i
            </button>
            <button className="pay-btn-outline" onClick={() => navigate('/movies')}>
              Äáº·t vÃ© khÃ¡c
            </button>
          </div>
        </div>
      </div>
    )
  }

  // â”€â”€â”€ MAIN PAYMENT PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { selectedSeats, subtotal, seatCount, showtime, movie } = bookingData

  return (
    <div className="pay-wrapper">
      {/* Header */}
      <div className="pay-header">
        <div className="pay-header-inner">
          <h1>ðŸ’³ Thanh ToÃ¡n</h1>
          <p>XÃ¡c nháº­n thÃ´ng tin vÃ  hoÃ n táº¥t Ä‘áº·t vÃ©</p>
        </div>
      </div>

      <div className="pay-container">
        {error && (
          <div className="pay-error-banner">
            <span>âš ï¸ {error}</span>
            <button onClick={() => setError('')}>âœ•</button>
          </div>
        )}

        <div className="pay-grid">
          {/* â”€â”€â”€ LEFT COLUMN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="pay-left">

            {/* ThÃ´ng tin Ä‘áº·t vÃ© */}
            <div className="pay-card">
              <div className="pay-card-header">
                <span className="pay-card-icon">ðŸŽ¬</span>
                <h3>ThÃ´ng tin Ä‘áº·t vÃ©</h3>
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
                      ? movie.genres.slice(0, 2).join(' Â· ')
                      : movie?.genre}
                    {movie?.duration ? ` Â· ${movie.duration} phÃºt` : ''}
                  </div>
                  <div className="pay-meta">ðŸ“… {showtime?.date} Â· â° {showtime?.time}</div>
                  <div className="pay-meta">ðŸŸï¸ {showtime?.room}</div>
                </div>
              </div>
              <div className="pay-seats-row">
                <span>ðŸ’º Gháº¿ Ä‘Ã£ chá»n:</span>
                <div className="pay-seat-badges">
                  {selectedSeats.map(seat => (
                    <span key={seat} className="pay-seat-badge">{seat}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* PhÆ°Æ¡ng thá»©c thanh toÃ¡n */}
            <div className="pay-card">
              <div className="pay-card-header">
                <span className="pay-card-icon">ðŸ’³</span>
                <h3>PhÆ°Æ¡ng thá»©c thanh toÃ¡n</h3>
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

            {/* MÃ£ giáº£m giÃ¡ */}
            <div className="pay-card">
              <div className="pay-card-header">
                <span className="pay-card-icon">ðŸŽ«</span>
                <h3>MÃ£ giáº£m giÃ¡</h3>
              </div>

              {/* Voucher input */}
              <div className="pay-voucher-input-row">
                <input
                  type="text"
                  placeholder="Nháº­p mÃ£ voucher (VD: WELCOME20)..."
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
                  {applyingVoucher ? <span className="pay-btn-spinner" /> : 'Ãp dá»¥ng'}
                </button>
              </div>

              {/* Validation message (tá»« server) */}
              {voucherValidation && !voucherValidation.valid && (
                <div className="pay-voucher-error">
                  âŒ {voucherValidation.message}
                </div>
              )}

              {/* Voucher Ä‘ang Ã¡p dá»¥ng */}
              {selectedVoucher && (
                <div className="pay-voucher-applied">
                  <div className="pay-voucher-applied-left">
                    <div className="pay-voucher-applied-icon">âœ…</div>
                    <div>
                      <div className="pay-voucher-applied-title">{selectedVoucher.title || selectedVoucher.code}</div>
                      <div className="pay-voucher-applied-code">
                        MÃ£: <strong>{selectedVoucher.code}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="pay-voucher-applied-right">
                    <div className="pay-voucher-applied-discount">
                      -{previewDiscount.toLocaleString()}Ä‘
                    </div>
                    <button className="pay-voucher-remove" onClick={handleRemoveVoucher}>
                      Bá» chá»n
                    </button>
                  </div>
                </div>
              )}

              {/* Danh sÃ¡ch voucher cÃ³ sáºµn */}
              {vouchers.length > 0 && (
                <div className="pay-voucher-list">
                  <div className="pay-voucher-list-title">Voucher kháº£ dá»¥ng:</div>
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

          {/* â”€â”€â”€ RIGHT COLUMN (Sticky Summary) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="pay-right">
            <div className="pay-summary-card">
              <div className="pay-card-header">
                <span className="pay-card-icon">ðŸ’°</span>
                <h3>Tá»•ng káº¿t Ä‘Æ¡n hÃ ng</h3>
              </div>

              <div className="pay-summary-rows">
                <div className="pay-summary-row">
                  <span>Sá»‘ gháº¿</span>
                  <span>{seatCount} gháº¿</span>
                </div>
                <div className="pay-summary-row">
                  <span>GiÃ¡/gháº¿</span>
                  <span>{showtime?.price?.toLocaleString()}Ä‘</span>
                </div>
                <div className="pay-summary-row">
                  <span>Táº¡m tÃ­nh</span>
                  <span>{subtotal.toLocaleString()}Ä‘</span>
                </div>
                {selectedVoucher && previewDiscount > 0 && (
                  <div className="pay-summary-row discount">
                    <span>ðŸŽ« Giáº£m giÃ¡ ({selectedVoucher.code})</span>
                    <span>-{previewDiscount.toLocaleString()}Ä‘</span>
                  </div>
                )}
                <div className="pay-summary-row method">
                  <span>PhÆ°Æ¡ng thá»©c</span>
                  <span>{PAYMENT_METHODS.find(m => m.id === paymentMethod)?.icon} {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}</span>
                </div>
              </div>

              <div className="pay-summary-divider" />

              <div className="pay-summary-total">
                <span>Tá»•ng cá»™ng</span>
                <span className="pay-total-amount">{finalTotal.toLocaleString()}Ä‘</span>
              </div>

              {selectedVoucher && previewDiscount > 0 && (
                <div className="pay-saving-badge">
                  ðŸŽ‰ Báº¡n tiáº¿t kiá»‡m Ä‘Æ°á»£c {previewDiscount.toLocaleString()}Ä‘
                </div>
              )}

              <button
                className="pay-checkout-btn"
                onClick={handleCheckout}
                disabled={submitting}
                id="checkout-btn"
              >
                {submitting
                  ? <><span className="pay-btn-spinner" /> Äang xá»­ lÃ½â€¦</>
                  : `ðŸ’³ Thanh toÃ¡n ${finalTotal.toLocaleString()}Ä‘`
                }
              </button>

              <p className="pay-terms-note">
                Báº±ng cÃ¡ch thanh toÃ¡n, báº¡n Ä‘á»“ng Ã½ vá»›i{' '}
                <a href="/terms" target="_blank">Ä‘iá»u khoáº£n sá»­ dá»¥ng</a> cá»§a CinemaXP.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
