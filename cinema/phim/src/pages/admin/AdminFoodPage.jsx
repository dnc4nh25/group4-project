import { useState, useEffect, useRef } from 'react'
import { Container, Badge, Spinner, Modal, Button, Form, Alert, Card, Table } from 'react-bootstrap'
import { foodItemApi, foodOrderApi } from '../../services/api'
import '../admin/AdminCommon.css'
import './AdminFoodPage.css'

const CATEGORIES = ['POPCORN', 'DRINK', 'COMBO', 'SNACK']
const CATEGORY_LABELS = { POPCORN: '🍿 Bỏng ngô', DRINK: '🥤 Nước', COMBO: '🎁 Combo', SNACK: '🌭 Snack' }

const STATUS_FLOW = {
  PENDING:   { label: 'Chờ xử lý',    next: 'PREPARING', nextLabel: '▶ Bắt đầu chuẩn bị' },
  PREPARING: { label: 'Chuẩn bị',     next: 'READY',     nextLabel: '✅ Sẵn sàng lấy' },
  READY:     { label: 'Sẵn lấy',      next: 'COMPLETED', nextLabel: '🎉 Hoàn tất' },
  COMPLETED: { label: 'Đã hoàn tất',  next: null,        nextLabel: null },
  CANCELLED: { label: 'Đã hủy',       next: null,        nextLabel: null },
}

const STATUS_BADGE = {
  PENDING:   'warning',
  PREPARING: 'info',
  READY:     'success',
  COMPLETED: 'secondary',
  CANCELLED: 'danger',
}

const TAG_LABELS = {
  bestseller: '🔥 Best Seller',
  new: '✨ Mới'
}

const emptyForm = {
  name: '', category: 'POPCORN', description: '', imageUrl: '',
  basePrice: '', stock: '', isAvailable: true, isFeatured: false, tag: '',
  sizes: [],
}

export default function AdminFoodPage() {
  const [activeTab, setActiveTab] = useState('menu')

  // ─── Menu State ──────────────────────────────────────────
  const [items, setItems] = useState([])
  const [itemsLoading, setItemsLoading] = useState(true)
  const [searchItem, setSearchItem] = useState('')
  const [filterCat, setFilterCat] = useState('ALL')

  // ─── Orders State ─────────────────────────────────────────
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [searchCode, setSearchCode] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [searchResult, setSearchResult] = useState(null)
  const [searchError, setSearchError] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)

  // ─── Item Modal State ─────────────────────────────────────
  const [itemModal, setItemModal] = useState({ show: false, mode: 'create', item: null })
  const [form, setForm] = useState(emptyForm)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  // ─── Restock Modal ────────────────────────────────────────
  const [restockModal, setRestockModal] = useState({ show: false, item: null })
  const [restockQty, setRestockQty] = useState('')

  // ─── Order Detail Modal ───────────────────────────────────
  const [orderDetailModal, setOrderDetailModal] = useState({ show: false, order: null })
  const [statusUpdating, setStatusUpdating] = useState(null)

  // ─── Toast ────────────────────────────────────────────────
  const [toast, setToast] = useState({ show: false, message: '', type: '' })

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000)
  }

  useEffect(() => {
    loadItems()
    loadOrders()
  }, [])

  const loadItems = async () => {
    try {
      const res = await foodItemApi.getAll()
      setItems(res.data)
    } catch (e) { showToast('Lỗi tải menu', 'error') }
    finally { setItemsLoading(false) }
  }

  const loadOrders = async () => {
    try {
      const res = await foodOrderApi.getAll()
      setOrders(res.data)
    } catch (e) { showToast('Lỗi tải đơn hàng', 'error') }
    finally { setOrdersLoading(false) }
  }

  // ─── Item CRUD ────────────────────────────────────────────
  const openCreateModal = () => {
    setForm(emptyForm)
    setFormError('')
    setItemModal({ show: true, mode: 'create', item: null })
  }

  const openEditModal = (item) => {
    setForm({
      name: item.name || '',
      category: item.category || 'POPCORN',
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      basePrice: item.basePrice || '',
      stock: item.stock ?? '',
      isAvailable: item.isAvailable ?? true,
      isFeatured: item.isFeatured ?? false,
      tag: item.tag || '',
      sizes: item.sizes || [],
    })
    setFormError('')
    setItemModal({ show: true, mode: 'edit', item })
  }

  const handleFormSave = async () => {
    if (!form.name.trim()) { setFormError('Tên sản phẩm không được để trống'); return }
    if (!form.basePrice || isNaN(form.basePrice)) { setFormError('Giá không hợp lệ'); return }

    setFormLoading(true)
    setFormError('')
    try {
      const payload = {
        ...form,
        basePrice: parseInt(form.basePrice),
        stock: parseInt(form.stock) || 0,
      }
      if (itemModal.mode === 'create') {
        await foodItemApi.create(payload)
        showToast('Thêm sản phẩm thành công!')
      } else {
        await foodItemApi.update(itemModal.item.id, payload)
        showToast('Cập nhật thành công!')
      }
      setItemModal({ show: false, mode: 'create', item: null })
      loadItems()
    } catch (e) {
      setFormError(e.response?.data || 'Có lỗi xảy ra')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Xóa sản phẩm này?')) return
    try {
      await foodItemApi.delete(id)
      showToast('Đã xóa sản phẩm')
      loadItems()
    } catch (e) { showToast('Lỗi xóa sản phẩm', 'error') }
  }

  const handleToggle = async (item) => {
    try {
      await foodItemApi.toggle(item.id)
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i))
    } catch (e) { showToast('Lỗi cập nhật', 'error') }
  }

  const handleRestock = async () => {
    const qty = parseInt(restockQty)
    if (!qty || qty <= 0) { showToast('Số lượng không hợp lệ', 'error'); return }
    try {
      await foodItemApi.restock(restockModal.item.id, qty)
      showToast(`Đã nhập thêm ${qty} sản phẩm`)
      setRestockModal({ show: false, item: null })
      setRestockQty('')
      loadItems()
    } catch (e) { showToast('Lỗi nhập kho', 'error') }
  }

  // ─── Sizes Management ─────────────────────────────────────
  const addSize = () => {
    setForm(f => ({ ...f, sizes: [...f.sizes, { label: '', price: '' }] }))
  }
  const removeSize = (idx) => {
    setForm(f => ({ ...f, sizes: f.sizes.filter((_, i) => i !== idx) }))
  }
  const updateSize = (idx, field, val) => {
    setForm(f => ({ ...f, sizes: f.sizes.map((s, i) => i === idx ? { ...s, [field]: val } : s) }))
  }

  // ─── Order Actions ────────────────────────────────────────
  const handleUpdateStatus = async (orderId, newStatus) => {
    setStatusUpdating(orderId)
    try {
      await foodOrderApi.updateStatus(orderId, newStatus)
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      if (orderDetailModal.order?.id === orderId) {
        setOrderDetailModal(m => ({ ...m, order: { ...m.order, status: newStatus } }))
      }
      showToast('Cập nhật trạng thái thành công!')
    } catch (e) { showToast('Lỗi cập nhật', 'error') }
    finally { setStatusUpdating(null) }
  }

  const handleSearchOrder = async () => {
    if (!searchCode.trim()) return
    setSearchLoading(true)
    setSearchError('')
    setSearchResult(null)
    try {
      const res = await foodOrderApi.getByCode(searchCode.trim().toUpperCase())
      setSearchResult(res.data)
    } catch (e) {
      setSearchError(`Không tìm thấy đơn hàng "${searchCode}"`)
    } finally {
      setSearchLoading(false)
    }
  }

  // ─── Filtered Data ────────────────────────────────────────
  const filteredItems = items.filter(i => {
    const matchCat = filterCat === 'ALL' || i.category === filterCat
    const matchSearch = !searchItem || i.name.toLowerCase().includes(searchItem.toLowerCase())
    return matchCat && matchSearch
  })

  const filteredOrders = orders.filter(o => {
    const matchStatus = filterStatus === 'ALL' || o.status === filterStatus
    return matchStatus
  })

  return (
    <div className="admin-page">
      {/* Toast */}
      {toast.show && (
        <div className={`admin-toast admin-toast-${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="page-header-banner py-4">
        <Container>
          <h1 className="mb-1">🍿 Quản lý F&B</h1>
          <p className="mb-0">Quản lý menu đồ ăn và đơn hàng Food Store</p>
        </Container>
      </div>

      <Container className="py-4">
        {/* Tab Navigation */}
        <div className="admin-food-tabs mb-4">
          <button
            className={`admin-tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
          >
            🍽️ Quản lý Menu
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            📋 Đơn hàng F&B
            {orders.filter(o => o.status === 'PENDING').length > 0 && (
              <span className="admin-tab-badge">
                {orders.filter(o => o.status === 'PENDING').length}
              </span>
            )}
          </button>
        </div>

        {/* ─── MENU TAB ──────────────────────────────────── */}
        {activeTab === 'menu' && (
          <div className="admin-food-section">
            <div className="admin-food-toolbar mb-3">
              <div className="d-flex gap-2 flex-wrap align-items-center">
                <input
                  type="text"
                  placeholder="🔍 Tìm sản phẩm..."
                  value={searchItem}
                  onChange={e => setSearchItem(e.target.value)}
                  className="admin-food-search"
                />
                <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="admin-food-select">
                  <option value="ALL">Tất cả danh mục</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                </select>
              </div>
              <button className="admin-food-btn-primary" onClick={openCreateModal}>
                + Thêm món mới
              </button>
            </div>

            {itemsLoading ? (
              <div className="text-center py-5"><Spinner variant="warning" /></div>
            ) : (
              <Card className="table-card bg-transparent">
                <Card.Body className="p-0">
                  <div className="table-responsive">
                    <Table className="admin-table modern-table" hover responsive>
                      <thead>
                    <tr>
                      <th>Ảnh</th>
                      <th>Tên sản phẩm</th>
                      <th>Danh mục</th>
                      <th>Giá</th>
                      <th>Tồn kho</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map(item => (
                      <tr key={item.id}>
                        <td>
                          <img
                            src={item.imageUrl || 'https://via.placeholder.com/48'}
                            alt={item.name}
                            style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }}
                          />
                        </td>
                        <td>
                          <div className="fw-bold">{item.name}</div>
                          {item.sizes?.length > 0 && (
                            <div style={{ fontSize: '0.75rem', color: '#a8a8b8' }}>
                              {item.sizes.map(s => `${s.label}: ${s.price?.toLocaleString()}đ`).join(' | ')}
                            </div>
                          )}
                        </td>
                        <td><span className="admin-cat-badge">{CATEGORY_LABELS[item.category]}</span></td>
                        <td className="fw-bold" style={{ color: '#f5a623' }}>
                          {item.basePrice?.toLocaleString('vi-VN')}đ
                        </td>
                        <td>
                          <span className={`admin-stock-badge ${item.stock === 0 ? 'out' : item.stock < 5 ? 'low' : 'ok'}`}>
                            {item.stock}
                          </span>
                        </td>
                        <td>
                          <select
                            value={item.isAvailable ? 'true' : 'false'}
                            onChange={() => handleToggle(item)}
                            className="admin-food-select"
                            style={{ padding: '4px 8px', fontSize: '0.85rem', width: 'auto' }}
                          >
                            <option value="true">Đang bán</option>
                            <option value="false">Tạm ngưng</option>
                          </select>
                        </td>
                        <td>
                          <div className="action-buttons d-flex gap-1 flex-wrap">
                            <Button size="sm" variant="outline-primary" className="action-btn" onClick={() => openEditModal(item)} title="Chỉnh sửa">✏️</Button>
                            <Button size="sm" variant="outline-danger" className="action-btn" onClick={() => handleDeleteItem(item.id)} title="Xóa">🗑</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                    </Table>
                    {filteredItems.length === 0 && (
                      <div className="text-center py-5" style={{ color: '#a8a8b8' }}>Không có sản phẩm nào</div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            )}
          </div>
        )}

        {/* ─── ORDERS TAB ────────────────────────────────── */}
        {activeTab === 'orders' && (
          <div className="admin-food-section">
            <div className="admin-food-toolbar mb-3">
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="admin-food-select">
                <option value="ALL">Tất cả trạng thái</option>
                {Object.entries(STATUS_FLOW).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <span style={{ color: '#a8a8b8', fontSize: '0.9rem' }}>
                {filteredOrders.length} đơn hàng
              </span>
            </div>

            {ordersLoading ? (
              <div className="text-center py-5"><Spinner variant="warning" /></div>
            ) : (
              <Card className="table-card bg-transparent">
                <Card.Body className="p-0">
                  <div className="table-responsive">
                    <Table className="admin-table modern-table" hover responsive>
                      <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Khách hàng</th>
                      <th>Items</th>
                      <th>Tổng tiền</th>
                      <th>Pickup</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(order => {
                      const sf = STATUS_FLOW[order.status]
                      return (
                        <tr key={order.id}>
                          <td>
                            <div className="fw-bold font-monospace" style={{ color: '#f5a623', fontSize: '0.85rem' }}>
                              {order.orderCode}
                            </div>
                            <small style={{ color: '#666' }}>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</small>
                          </td>
                          <td>{order.userName}</td>
                          <td>
                            <div style={{ fontSize: '0.82rem', color: '#d4d4d4' }}>
                              {order.items?.slice(0, 2).map((item, i) => (
                                <div key={i}>{item.foodItemName} ×{item.quantity}</div>
                              ))}
                              {order.items?.length > 2 && <div style={{ color: '#a8a8b8' }}>+{order.items.length - 2} more</div>}
                            </div>
                          </td>
                          <td className="fw-bold" style={{ color: '#f5a623' }}>
                            {order.totalAmount?.toLocaleString('vi-VN')}đ
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>
                            {order.pickupDate && <div>{new Date(order.pickupDate).toLocaleDateString('vi-VN')}</div>}
                            {order.pickupTime && <div style={{ color: '#a8a8b8' }}>{order.pickupTime}</div>}
                          </td>
                          <td>
                            <Badge bg={STATUS_BADGE[order.status] || 'secondary'}>
                              {STATUS_FLOW[order.status]?.label || order.status}
                            </Badge>
                          </td>
                          <td>
                            <div className="action-buttons d-flex gap-1 flex-wrap">
                              <Button size="sm" variant="outline-primary" className="action-btn"
                                onClick={() => setOrderDetailModal({ show: true, order })}
                                title="Xem chi tiết"
                              >👁️</Button>
                              {sf?.next && (
                                <Button size="sm" variant="outline-success" className="action-btn"
                                  onClick={() => handleUpdateStatus(order.id, sf.next)}
                                  disabled={statusUpdating === order.id}
                                  title={sf.nextLabel}
                                >▶</Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                    </Table>
                    {filteredOrders.length === 0 && (
                      <div className="text-center py-5" style={{ color: '#a8a8b8' }}>Không có đơn hàng</div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            )}
          </div>
        )}

      </Container>

      {/* ─── Item Create/Edit Modal ──────────────────────── */}
      <Modal show={itemModal.show} onHide={() => setItemModal(m => ({ ...m, show: false }))} size="lg" centered contentClassName="cancel-modal-content">
        <Modal.Header className="cancel-modal-header border-0">
          <Modal.Title className="text-white">{itemModal.mode === 'create' ? '+ Thêm sản phẩm mới' : '✏️ Sửa sản phẩm'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="cancel-modal-body">
          {formError && <Alert variant="danger" className="py-2">{formError}</Alert>}
          <div className="admin-form-grid">
            <Form.Group>
              <Form.Label style={{ color: '#a8a8b8' }}>Tên sản phẩm *</Form.Label>
              <input className="admin-food-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Bỏng ngô bơ thơm..." />
            </Form.Group>
            <Form.Group>
              <Form.Label style={{ color: '#a8a8b8' }}>Danh mục</Form.Label>
              <select className="admin-food-select w-100" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </Form.Group>
            <Form.Group>
              <Form.Label style={{ color: '#a8a8b8' }}>Giá cơ bản (đ) *</Form.Label>
              <input className="admin-food-input" type="number" value={form.basePrice} onChange={e => setForm(f => ({ ...f, basePrice: e.target.value }))} placeholder="45000" />
            </Form.Group>
            <Form.Group>
              <Form.Label style={{ color: '#a8a8b8' }}>Tồn kho</Form.Label>
              <input className="admin-food-input" type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="100" />
            </Form.Group>
            <Form.Group style={{ gridColumn: '1 / -1' }}>
              <Form.Label style={{ color: '#a8a8b8' }}>URL ảnh</Form.Label>
              <input className="admin-food-input" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." />
            </Form.Group>
            <Form.Group style={{ gridColumn: '1 / -1' }}>
              <Form.Label style={{ color: '#a8a8b8' }}>Mô tả</Form.Label>
              <textarea className="admin-food-input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Mô tả sản phẩm..." />
            </Form.Group>
            <Form.Group>
              <Form.Label style={{ color: '#a8a8b8' }}>Trạng thái hiển thị</Form.Label>
              <select className="admin-food-select w-100" value={form.isAvailable ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, isAvailable: e.target.value === 'true' }))}>
                <option value="true">Đang bán</option>
                <option value="false">Tạm ngưng</option>
              </select>
            </Form.Group>
          </div>

          {/* Sizes */}
          <div className="mt-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <Form.Label style={{ color: '#a8a8b8', marginBottom: 0 }}>Sizes (M/L/XL kèm giá)</Form.Label>
              <button className="admin-food-btn-sm" onClick={addSize}>+ Thêm size</button>
            </div>
            {form.sizes.map((s, idx) => (
              <div key={idx} className="d-flex gap-2 mb-2 align-items-center">
                <input className="admin-food-input" style={{ width: 80 }} placeholder="L" value={s.label} onChange={e => updateSize(idx, 'label', e.target.value)} />
                <input className="admin-food-input" type="number" placeholder="65000" value={s.price} onChange={e => updateSize(idx, 'price', e.target.value)} />
                <button className="admin-action-btn delete" onClick={() => removeSize(idx)}>✕</button>
              </div>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer className="cancel-modal-footer border-0">
          <Button variant="outline-secondary" onClick={() => setItemModal(m => ({ ...m, show: false }))}>Hủy</Button>
          <Button style={{ background: '#f5a623', border: 'none', color: '#000', fontWeight: 700 }} onClick={handleFormSave} disabled={formLoading}>
            {formLoading ? <Spinner size="sm" /> : (itemModal.mode === 'create' ? '+ Thêm sản phẩm' : '💾 Lưu thay đổi')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ─── Restock Modal ───────────────────────────────── */}
      <Modal show={restockModal.show} onHide={() => setRestockModal({ show: false, item: null })} centered contentClassName="cancel-modal-content">
        <Modal.Header className="cancel-modal-header border-0">
          <Modal.Title className="text-white">📦 Nhập kho — {restockModal.item?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="cancel-modal-body">
          <p style={{ color: '#a8a8b8' }}>Tồn kho hiện tại: <strong style={{ color: '#f5a623' }}>{restockModal.item?.stock}</strong></p>
          <Form.Label style={{ color: '#a8a8b8' }}>Số lượng nhập thêm</Form.Label>
          <input
            className="admin-food-input"
            type="number"
            min="1"
            value={restockQty}
            onChange={e => setRestockQty(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRestock()}
            placeholder="50"
            autoFocus
          />
        </Modal.Body>
        <Modal.Footer className="cancel-modal-footer border-0">
          <Button variant="outline-secondary" onClick={() => setRestockModal({ show: false, item: null })}>Hủy</Button>
          <Button style={{ background: '#f5a623', border: 'none', color: '#000', fontWeight: 700 }} onClick={handleRestock}>
            📦 Nhập kho
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ─── Order Detail Modal ──────────────────────────── */}
      <Modal show={orderDetailModal.show} onHide={() => setOrderDetailModal({ show: false, order: null })} centered contentClassName="cancel-modal-content">
        <Modal.Header className="cancel-modal-header border-0">
          <Modal.Title className="text-white">📋 Chi tiết đơn — {orderDetailModal.order?.orderCode}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="cancel-modal-body">
          {orderDetailModal.order && (
            <>
              <div className="mb-3">
                <Badge bg={STATUS_BADGE[orderDetailModal.order.status] || 'secondary'}>
                  {STATUS_FLOW[orderDetailModal.order.status]?.label || orderDetailModal.order.status}
                </Badge>
                <span className="ms-3" style={{ color: '#a8a8b8', fontSize: '0.85rem' }}>
                  Khách: <strong className="text-white">{orderDetailModal.order.userName}</strong>
                </span>
              </div>
              {orderDetailModal.order.items?.map((item, i) => (
                <div key={i} className="d-flex justify-content-between py-2 border-bottom border-secondary border-opacity-25">
                  <span className="text-white">{item.foodItemName} {item.sizeLabel && `(${item.sizeLabel})`} ×{item.quantity}</span>
                  <span style={{ color: '#f5a623' }}>{(item.unitPrice * item.quantity).toLocaleString()}đ</span>
                </div>
              ))}
              <div className="d-flex justify-content-between pt-2 mt-1">
                <strong className="text-white">Tổng</strong>
                <strong style={{ color: '#f5a623' }}>{orderDetailModal.order.totalAmount?.toLocaleString()}đ</strong>
              </div>
              <div className="mt-3" style={{ color: '#a8a8b8', fontSize: '0.85rem' }}>
                📅 Pickup: {orderDetailModal.order.pickupTime} — {orderDetailModal.order.pickupDate && new Date(orderDetailModal.order.pickupDate).toLocaleDateString('vi-VN')}
              </div>
              {STATUS_FLOW[orderDetailModal.order.status]?.next && (
                <button
                  className="admin-food-btn-primary w-100 mt-3"
                  onClick={() => handleUpdateStatus(orderDetailModal.order.id, STATUS_FLOW[orderDetailModal.order.status].next)}
                  disabled={statusUpdating === orderDetailModal.order.id}
                >
                  {statusUpdating === orderDetailModal.order.id ? <Spinner size="sm" /> : STATUS_FLOW[orderDetailModal.order.status].nextLabel}
                </button>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="cancel-modal-footer border-0">
          <Button variant="outline-light" onClick={() => setOrderDetailModal({ show: false, order: null })}>Đóng</Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
