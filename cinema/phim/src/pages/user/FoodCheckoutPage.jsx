import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { foodOrderApi } from '../../services/api'
import './PaymentPage.css'
import './FoodPage.css'

const PAYMENT_METHODS = [
  { id: 'QR', label: 'Ví điện tử / QR', icon: '📱', desc: 'MoMo, ZaloPay, VNPay, QR Banking' },
  { id: 'CARD', label: 'Thẻ ngân hàng', icon: '💳', desc: 'Visa, Mastercard, ATM nội địa' },
]

const generateTimeSlots = () => {
  const slots = []
  for (let h = 9; h <= 21; h++) {
    slots.push(`${String(h).padStart(2,'0')}:00`)
    if (h < 21) slots.push(`${String(h).padStart(2,'0')}:30`)
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()

const formatDateInput = (d) => d.toISOString().split('T')[0]

export default function FoodCheckoutPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser } = useAuth()

  const { cart = [], total = 0 } = location.state || {}

  const today = new Date()
  const maxDate = new Date(today); maxDate.setDate(today.getDate() + 7)

  const [pickupDate, setPickupDate] = useState(formatDateInput(today))
  const [pickupTime, setPickupTime] = useState('10:00')
  const [paymentMethod, setPaymentMethod] = useState('QR')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [orderResult, setOrderResult] = useState(null)

  const [usePoints, setUsePoints] = useState(false)
  const [pointsToUse, setPointsToUse] = useState(0)

  useEffect(() => {
    if (usePoints) {
      const maxUsable = Math.min(currentUser?.points || 0, total)
      if (pointsToUse > maxUsable) {
        setPointsToUse(maxUsable)
      } else if (pointsToUse === 0 && maxUsable > 0) {
        setPointsToUse(maxUsable)
      }
    } else {
      setPointsToUse(0)
    }
  }, [usePoints, currentUser?.points, total, pointsToUse])

  const handlePointsChange = (val) => {
    let pts = parseInt(val, 10)
    if (isNaN(pts)) pts = 0
    const maxUsable = Math.min(currentUser?.points || 0, total)
    if (pts > maxUsable) pts = maxUsable
    if (pts < 0) pts = 0
    setPointsToUse(pts)
  }

  const finalTotal = Math.max(0, total - pointsToUse)

  if (!cart.length) {
    navigate('/food')
    return null
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        userId: currentUser.id,
        items: cart.map(c => ({
          foodItemId: c.item.id,
          sizeLabel: c.sizeLabel || null,
          quantity: c.quantity,
        })),
        pickupDate,
        pickupTime,
        paymentMethod,
        pointsUsed: pointsToUse
      }
      const res = await foodOrderApi.create(payload)
      setOrderResult(res.data)
      setSuccess(true)
    } catch (err) {
      const msg = err.response?.data || 'Đặt hàng thất bại. Vui lòng thử lại.'
      setError(typeof msg === 'string' ? msg : 'Đặt hàng thất bại. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── SUCCESS SCREEN ─────────────────────────────
  if (success && orderResult) {
    const qrData = encodeURIComponent(orderResult.orderCode)
    return (
      <div className="pay-success-wrapper">
        <div className="pay-success-card">
          <div className="pay-success-icon">✅</div>
          <h2>Đặt đồ ăn thành công!</h2>
          <p className="pay-success-sub">Mang mã QR này đến quầy F&B khi đến rạp để nhận đồ ăn.</p>

          {/* QR Code */}
          <div className="food-qr-box">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`}
              alt={`QR Code ${orderResult.orderCode}`}
              className="food-qr-img"
            />
            <div className="food-qr-code">{orderResult.orderCode}</div>
            <p className="food-qr-hint">📲 Chụp màn hình hoặc screenshot để lưu</p>
          </div>

          {/* Pickup info */}
          <div className="pay-ticket">
            <div className="pay-ticket-grid">
              <div>
                <span>📅 Ngày lấy</span>
                <strong>{new Date(pickupDate).toLocaleDateString('vi-VN')}</strong>
              </div>
              <div>
                <span>⏰ Giờ lấy</span>
                <strong>{pickupTime}</strong>
              </div>
              <div>
                <span>🍿 Số món</span>
                <strong>{cart.reduce((s, c) => s + c.quantity, 0)} sản phẩm</strong>
              </div>
              <div>
                <span>💰 Tổng tiền</span>
                <strong className="pay-ticket-total">{orderResult?.totalAmount?.toLocaleString('vi-VN')}đ</strong>
              </div>
              {orderResult?.pointsUsed > 0 && (
                <div>
                  <span>⭐ Điểm đã dùng</span>
                  <strong className="pay-ticket-discount">-{orderResult.pointsUsed.toLocaleString('vi-VN')}đ</strong>
                </div>
              )}
              <div>
                <span>💳 Thanh toán</span>
                <strong>{PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}</strong>
              </div>
            </div>
          </div>

          <div className="pay-success-actions">
            <button className="pay-btn-primary" onClick={() => navigate('/my-bookings')}>
              📋 Xem lịch sử đơn hàng
            </button>
            <button className="pay-btn-outline" onClick={() => navigate('/food')}>
              🍿 Đặt thêm đồ ăn
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── CHECKOUT FORM ───────────────────────────────
  return (
    <div className="pay-wrapper">
      <div className="pay-header">
        <div className="pay-header-inner">
          <h1>🍿 Xác nhận đặt đồ ăn</h1>
          <p>Kiểm tra đơn hàng và chọn thời gian lấy</p>
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
          {/* LEFT — Order Summary + Pickup */}
          <div className="pay-left">
            {/* Order Items */}
            <div className="pay-card">
              <div className="pay-card-header">
                <span className="pay-card-icon">🍿</span>
                <h3>Đơn hàng của bạn</h3>
              </div>
              <div className="pay-card-body">
                {cart.map((c, idx) => (
                  <div key={idx} className="food-checkout-item">
                    <div>
                      <div className="food-checkout-item-name">{c.item.name}</div>
                      {c.sizeLabel && <div className="food-checkout-item-meta">Size {c.sizeLabel} × {c.quantity}</div>}
                      {!c.sizeLabel && <div className="food-checkout-item-meta">× {c.quantity}</div>}
                    </div>
                    <div className="food-checkout-item-price">
                      {(c.unitPrice * c.quantity).toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                ))}
                <div className="food-checkout-divider" />
                <div className="food-checkout-total">
                  <span>Tổng cộng</span>
                  <strong>{total.toLocaleString('vi-VN')}đ</strong>
                </div>
              </div>
            </div>

            {/* Pickup Time */}
            <div className="pay-card">
              <div className="pay-card-header">
                <span className="pay-card-icon">📅</span>
                <h3>Thời gian lấy hàng</h3>
              </div>
              <div className="pay-card-body">
                <div className="food-pickup-grid">
                  <div className="food-pickup-field">
                    <label>Ngày lấy</label>
                    <input
                      type="date"
                      value={pickupDate}
                      min={formatDateInput(today)}
                      max={formatDateInput(maxDate)}
                      onChange={e => setPickupDate(e.target.value)}
                      className="food-pickup-input"
                    />
                  </div>
                  <div className="food-pickup-field">
                    <label>Giờ lấy</label>
                    <select
                      value={pickupTime}
                      onChange={e => setPickupTime(e.target.value)}
                      className="food-pickup-input"
                    >
                      {TIME_SLOTS.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="food-pickup-note">
                  ℹ️ Vui lòng đến quầy F&B đúng giờ. Đơn hàng sẽ được giữ trong 15 phút.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT — Payment */}
          <div className="pay-right">
            <div className="pay-card pay-summary-card">
              <div className="pay-card-header">
                <span className="pay-card-icon">💳</span>
                <h3>Thanh toán</h3>
              </div>
              <div className="pay-card-body">
                <div className="pay-methods">
                  {PAYMENT_METHODS.map(m => (
                    <div
                      key={m.id}
                      className={`pay-method-item ${paymentMethod === m.id ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod(m.id)}
                    >
                      <span className="pay-method-icon">{m.icon}</span>
                      <div>
                        <div className="pay-method-label">{m.label}</div>
                        <div className="pay-method-desc">{m.desc}</div>
                      </div>
                      <div className="pay-method-radio">
                        {paymentMethod === m.id && <span className="pay-radio-dot" />}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pay-summary-rows">
                  <div className="pay-summary-row">
                    <span>Tổng đơn hàng</span>
                    <span>{total.toLocaleString('vi-VN')}đ</span>
                  </div>

                  {/* ─── Dùng điểm tích luỹ ─── */}
                  <div className="pay-points-section" style={{ marginTop: '1rem', borderTop: '1px dashed #3a3a5a', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div>
                        <span style={{ fontWeight: 600, color: '#f0f0f0' }}>⭐ Điểm tích lũy</span>
                        <div style={{ fontSize: '0.8rem', color: '#a8a8b8' }}>Hiện có: {(currentUser?.points || 0).toLocaleString()}đ</div>
                      </div>
                      <div className="pay-switch-wrap">
                        <input
                          type="checkbox"
                          id="usePointsToggle"
                          className="pay-switch"
                          checked={usePoints}
                          onChange={e => setUsePoints(e.target.checked)}
                          disabled={!currentUser?.points || currentUser.points <= 0}
                        />
                        <label htmlFor="usePointsToggle" className="pay-switch-label"></label>
                      </div>
                    </div>
                    {usePoints && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                        <input
                          type="number"
                          value={pointsToUse}
                          onChange={e => handlePointsChange(e.target.value)}
                          style={{
                            flex: 1, background: '#0d0d0d', border: '1px solid #3a3a5a',
                            borderRadius: '8px', padding: '8px 12px', color: '#f0f0f0', outline: 'none'
                          }}
                        />
                        <span style={{ fontSize: '0.9rem', color: '#a8a8b8' }}>đ</span>
                      </div>
                    )}
                  </div>

                  {usePoints && pointsToUse > 0 && (
                    <div className="pay-summary-row" style={{ color: '#2ecc71', marginTop: '0.5rem' }}>
                      <span>Dùng điểm</span>
                      <span>-{pointsToUse.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}

                  <div className="pay-summary-row pay-summary-total" style={{ marginTop: '1rem' }}>
                    <span>Thanh toán</span>
                    <strong>{finalTotal.toLocaleString('vi-VN')}đ</strong>
                  </div>
                </div>

                <button
                  className="pay-checkout-btn"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <><span className="pay-btn-spinner" /> Đang xử lý…</>
                  ) : (
                    '✅ Xác nhận đặt hàng'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inline styles for food-specific elements */}
      <style>{`
        .food-checkout-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 10px 0;
          border-bottom: 1px solid var(--border, #2a2a4a);
        }
        .food-checkout-item:last-of-type { border-bottom: none; }
        .food-checkout-item-name { font-weight: 600; font-size: 0.95rem; }
        .food-checkout-item-meta { font-size: 0.82rem; color: var(--text-muted, #a8a8b8); margin-top: 2px; }
        .food-checkout-item-price { font-weight: 700; color: var(--primary, #f5a623); white-space: nowrap; }
        .food-checkout-divider { height: 1px; background: var(--border, #2a2a4a); margin: 12px 0; }
        .food-checkout-total { display: flex; justify-content: space-between; font-size: 1.05rem; }
        .food-checkout-total strong { color: var(--primary, #f5a623); font-size: 1.15rem; }
        .food-pickup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 12px; }
        .food-pickup-field label { display: block; font-size: 0.85rem; color: var(--text-muted, #a8a8b8); margin-bottom: 6px; font-weight: 500; }
        .food-pickup-input {
          width: 100%; background: var(--bg-dark, #0d0d0d); border: 1px solid var(--border-light, #3a3a5a);
          border-radius: 8px; padding: 10px 12px; color: var(--text-light, #f0f0f0); font-size: 0.9rem;
          font-family: 'Inter', sans-serif; transition: border-color 0.2s;
        }
        .food-pickup-input:focus { outline: none; border-color: var(--primary, #f5a623); }
        .food-pickup-note { font-size: 0.82rem; color: var(--text-muted, #a8a8b8); margin: 0; padding-top: 8px; }
        .food-qr-box { text-align: center; margin: 24px 0 16px; }
        .food-qr-img { width: 200px; height: 200px; border-radius: 12px; border: 3px solid var(--primary, #f5a623); }
        .food-qr-code { font-size: 1.2rem; font-weight: 800; letter-spacing: 2px; margin-top: 12px; color: var(--primary, #f5a623); }
        .food-qr-hint { font-size: 0.82rem; color: var(--text-muted, #a8a8b8); margin-top: 8px; }
        :root[data-theme='light'] .food-pickup-input { background: #f8f9fa !important; color: #1e293b !important; border-color: #e5e7eb !important; }
        :root[data-theme='light'] .food-checkout-item { border-bottom-color: #e5e7eb !important; }
        :root[data-theme='light'] .food-checkout-divider { background: #e5e7eb !important; }
      `}</style>
    </div>
  )
}
