import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { foodItemApi } from '../../services/api'
import './FoodPage.css'

const CATEGORIES = [
  { key: 'ALL', label: 'Tất cả', icon: '🍽️' },
  { key: 'COMBO', label: 'Combo', icon: '🎁' },
  { key: 'POPCORN', label: 'Bỏng ngô', icon: '🍿' },
  { key: 'DRINK', label: 'Nước uống', icon: '🥤' },
  { key: 'SNACK', label: 'Snack', icon: '🌭' },
]

const LOW_STOCK_THRESHOLD = 5

export default function FoodPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [cart, setCart] = useState([]) // [{item, sizeLabel, quantity, unitPrice}]
  const [selectedSizes, setSelectedSizes] = useState({}) // {itemId: sizeLabel}
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    foodItemApi.getAvailable()
      .then(r => setItems(r.data))
      .catch(err => console.error('Lỗi tải menu:', err))
      .finally(() => setLoading(false))
  }, [])

  // ─── Filter theo category ───────────────────────────────
  const filtered = useMemo(() => {
    if (activeCategory === 'ALL') return items
    return items.filter(i => i.category === activeCategory)
  }, [items, activeCategory])

  // ─── Tính giá theo size đã chọn ────────────────────────
  const resolvePrice = (item, sizeLabel) => {
    if (sizeLabel && item.sizes?.length > 0) {
      const s = item.sizes.find(s => s.label === sizeLabel)
      if (s) return s.price
    }
    return item.basePrice
  }

  // ─── Chọn size ─────────────────────────────────────────
  const handleSelectSize = (itemId, sizeLabel) => {
    setSelectedSizes(prev => ({ ...prev, [itemId]: sizeLabel }))
  }

  // ─── Thêm vào giỏ ──────────────────────────────────────
  const handleAddToCart = (item) => {
    const hasSizes = item.sizes?.length > 0
    const sizeLabel = hasSizes ? (selectedSizes[item.id] || item.sizes[0].label) : null
    const unitPrice = resolvePrice(item, sizeLabel)

    setCart(prev => {
      const key = `${item.id}-${sizeLabel || 'none'}`
      const existing = prev.find(c => `${c.item.id}-${c.sizeLabel || 'none'}` === key)
      if (existing) {
        return prev.map(c => c === existing ? { ...c, quantity: c.quantity + 1 } : c)
      }
      return [...prev, { item, sizeLabel, quantity: 1, unitPrice }]
    })
    setCartOpen(true)
  }

  // ─── Thay đổi qty trong giỏ ────────────────────────────
  const handleQtyChange = (idx, delta) => {
    setCart(prev => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + delta }
      if (updated[idx].quantity <= 0) updated.splice(idx, 1)
      return updated
    })
  }

  // ─── Nhập trực tiếp số lượng ───────────────────────────
  const handleQtyInput = (idx, val) => {
    const num = parseInt(val, 10)
    setCart(prev => {
      const updated = [...prev]
      if (isNaN(num) || val === '') {
        updated[idx] = { ...updated[idx], quantity: '' }
      } else if (num <= 0) {
        updated.splice(idx, 1)
      } else {
        updated[idx] = { ...updated[idx], quantity: Math.min(num, 99) }
      }
      return updated
    })
  }

  const handleQtyBlur = (idx) => {
    setCart(prev => {
      const updated = [...prev]
      if (!updated[idx]) return updated
      if (!updated[idx].quantity || updated[idx].quantity === '') {
        updated[idx] = { ...updated[idx], quantity: 1 }
      }
      return updated
    })
  }

  const handleRemoveFromCart = (idx) => {
    setCart(prev => prev.filter((_, i) => i !== idx))
  }

  const cartTotal = cart.reduce((sum, c) => sum + c.unitPrice * c.quantity, 0)
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0)

  const handleCheckout = () => {
    if (!currentUser) {
      navigate('/login', { state: { from: '/food' } })
      return
    }
    navigate('/food/checkout', { state: { cart, total: cartTotal } })
  }

  return (
    <div className="food-page">
      {/* ─── HEADER ─────────────────────────────────────── */}
      <div className="food-header">
        <div className="food-header-inner">
          <div className="food-header-text">
            <h1>🍿 CinemaXP <span>Food Store</span></h1>
            <p>Đặt trước đồ ăn — nhận tại quầy khi đến rạp</p>
          </div>
          <button
            className="food-cart-fab"
            onClick={() => setCartOpen(o => !o)}
            aria-label="Giỏ hàng"
          >
            🛒
            {cartCount > 0 && <span className="food-cart-fab-count">{cartCount}</span>}
          </button>
        </div>
      </div>

      {/* ─── CATEGORY TABS ──────────────────────────────── */}
      <div className="food-category-bar">
        <div className="food-category-inner">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              className={`food-cat-btn ${activeCategory === cat.key ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.key)}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── MAIN CONTENT ───────────────────────────────── */}
      <div className="food-main">
        <div className={`food-grid-area ${cartOpen && cartCount > 0 ? 'with-cart' : ''}`}>
          {loading ? (
            <div className="food-loading">
              <div className="food-spinner" />
              <p>Đang tải menu…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="food-empty">
              <div className="food-empty-icon">🍽️</div>
              <p>Không có sản phẩm nào trong mục này</p>
            </div>
          ) : (
            <div className="food-grid">
              {filtered.map(item => {
                const soldOut = !item.isAvailable || item.stock === 0
                const lowStock = !soldOut && item.stock < LOW_STOCK_THRESHOLD
                const hasSizes = item.sizes?.length > 0
                const chosenSize = selectedSizes[item.id] || (hasSizes ? item.sizes[0].label : null)
                const displayPrice = resolvePrice(item, chosenSize)

                return (
                  <div key={item.id} className={`food-card ${soldOut ? 'sold-out' : ''}`}>
                    {/* Image */}
                    <div className="food-card-img-wrap">
                      <img
                        src={item.imageUrl || 'https://via.placeholder.com/300x200?text=🍿'}
                        alt={item.name}
                        className="food-card-img"
                        onError={e => { e.target.src = 'https://via.placeholder.com/300x200?text=%F0%9F%8D%BF' }}
                      />
                      {lowStock && (
                        <span className="food-lowstock-badge">⚠️ Sắp hết</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="food-card-body">
                      <h3 className="food-card-name">{item.name}</h3>
                      {item.description && (
                        <p className="food-card-desc">{item.description}</p>
                      )}

                      {/* Size selector */}
                      {hasSizes && !soldOut && (
                        <div className="food-sizes">
                          {item.sizes.map(s => (
                            <button
                              key={s.label}
                              className={`food-size-btn ${chosenSize === s.label ? 'active' : ''}`}
                              onClick={() => handleSelectSize(item.id, s.label)}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Price + Add */}
                      <div className="food-card-footer">
                        <span className="food-price">
                          {displayPrice.toLocaleString('vi-VN')}đ
                        </span>
                        <button
                          className={`food-add-btn ${soldOut ? 'disabled' : ''}`}
                          onClick={() => !soldOut && handleAddToCart(item)}
                          disabled={soldOut}
                        >
                          {soldOut ? 'Sold out' : '+ Thêm'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ─── CART PANEL ─────────────────────────────────── */}
        {cartOpen && (
          <div className="food-cart-panel">
            <div className="food-cart-header">
              <h3>🛒 Giỏ hàng {cartCount > 0 && <span className="cart-count-badge">{cartCount}</span>}</h3>
              <button className="food-cart-close" onClick={() => setCartOpen(false)}>✕</button>
            </div>

            {cart.length === 0 ? (
              <div className="food-cart-empty">
                <div>🛒</div>
                <p>Giỏ hàng trống</p>
                <p className="text-muted">Thêm đồ ăn yêu thích vào giỏ</p>
              </div>
            ) : (
              <>
                <div className="food-cart-items">
                  {cart.map((c, idx) => (
                    <div key={idx} className="food-cart-item">
                      <div className="food-cart-item-info">
                        <span className="food-cart-item-name">{c.item.name}</span>
                        {c.sizeLabel && <span className="food-cart-item-size">Size {c.sizeLabel}</span>}
                        <span className="food-cart-item-price">
                          {(c.unitPrice * c.quantity).toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                      <div className="food-cart-qty">
                        <button onClick={() => handleQtyChange(idx, -1)}>−</button>
                        <input
                          type="number"
                          className="food-cart-qty-input"
                          value={c.quantity}
                          min={1}
                          max={99}
                          onChange={e => handleQtyInput(idx, e.target.value)}
                          onBlur={() => handleQtyBlur(idx)}
                        />
                        <button onClick={() => handleQtyChange(idx, +1)}>+</button>
                        <button className="food-cart-remove" onClick={() => handleRemoveFromCart(idx)}>🗑</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="food-cart-footer">
                  <div className="food-cart-total">
                    <span>Tổng cộng</span>
                    <strong>{cartTotal.toLocaleString('vi-VN')}đ</strong>
                  </div>
                  <button className="food-checkout-btn" onClick={handleCheckout}>
                    Đặt ngay →
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
