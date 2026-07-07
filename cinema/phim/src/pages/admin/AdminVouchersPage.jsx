import { useState, useEffect } from 'react'
import { Container, Table, Button, Modal, Form, Alert, Spinner, Badge, Row, Col, Card, InputGroup } from 'react-bootstrap'
import axios from 'axios'
import './AdminCommon.css'

const API = 'http://localhost:3001'

const EMPTY_FORM = {
  code: '',
  title: '',
  description: '',
  type: 'percentage',
  value: '',
  minOrderValue: '',
  minSeats: '',
  maxDiscount: '',
  usageLimit: '',
  validFrom: '',
  validTo: '',
  isActive: true
}

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/vouchers`)
      setVouchers(res.data)
    } catch {
      setError('Lỗi tải dữ liệu voucher')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()

    const interval = setInterval(() => {
      load()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const handleOpenAdd = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setError('')
    setShowModal(true)
  }

  const handleOpenEdit = (voucher) => {
    setForm({
      ...voucher,
      validFrom: voucher.validFrom ? voucher.validFrom.split('T')[0] : '',
      validTo: voucher.validTo ? voucher.validTo.split('T')[0] : ''
    })
    setEditingId(voucher.id)
    setError('')
    setShowModal(true)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.code?.trim()) {
      setError('❌ Mã voucher không được để trống.')
      return
    }

    if (!form.title?.trim()) {
      setError('❌ Tiêu đề không được để trống.')
      return
    }

    if (!form.value || form.value <= 0) {
      setError('❌ Giá trị giảm giá phải lớn hơn 0.')
      return
    }

    if (form.type === 'percentage' && form.value > 100) {
      setError('❌ Phần trăm giảm giá không được vượt quá 100%.')
      return
    }

    if (!form.usageLimit || form.usageLimit <= 0) {
      setError('❌ Giới hạn sử dụng phải lớn hơn 0.')
      return
    }

    if (!form.validFrom || !form.validTo) {
      setError('❌ Vui lòng chọn thời gian hiệu lực.')
      return
    }

    if (new Date(form.validFrom) >= new Date(form.validTo)) {
      setError('❌ Ngày bắt đầu phải trước ngày kết thúc.')
      return
    }

    const existingVoucher = vouchers.find(v =>
      v.code.toLowerCase() === form.code.toLowerCase() &&
      String(v.id) !== String(editingId)
    )
    if (existingVoucher) {
      setError('❌ Mã voucher đã tồn tại.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        code: form.code.toUpperCase().trim(),
        title: form.title.trim(),
        description: form.description?.trim() || '',
        value: parseFloat(form.value),
        minOrderValue: form.minOrderValue ? parseFloat(form.minOrderValue) : 0,
        minSeats: form.minSeats ? parseInt(form.minSeats) : 0,
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
        usageLimit: parseInt(form.usageLimit),
        usedCount: editingId ? vouchers.find(v => v.id === editingId)?.usedCount || 0 : 0,
        createdAt: editingId ? vouchers.find(v => v.id === editingId)?.createdAt : new Date().toISOString()
      }

      if (editingId) {
        await axios.put(`${API}/vouchers/${editingId}`, payload)
      } else {
        await axios.post(`${API}/vouchers`, payload)
      }

      setShowModal(false)
      load()
    } catch (err) {
      setError('❌ Lưu thất bại. Vui lòng thử lại.')
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (id) => {
    setDeletingId(id)
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(`${API}/vouchers/${deletingId}`)
      setShowDeleteConfirm(false)
      load()
    } catch {
      setError('Xóa thất bại.')
    }
  }

  const handleToggleStatus = async (voucher) => {
    try {
      await axios.patch(`${API}/vouchers/${voucher.id}`, {
        isActive: !voucher.isActive
      })
      load()
    } catch {
      setError('Cập nhật trạng thái thất bại.')
    }
  }

  const filtered = vouchers.filter(v =>
    v.code.toLowerCase().includes(search.toLowerCase()) ||
    v.title.toLowerCase().includes(search.toLowerCase())
  )

  const totalVouchers = vouchers.length
  const activeVouchers = vouchers.filter(v => v.isActive).length
  const totalUsed = vouchers.reduce((sum, v) => sum + (v.usedCount || 0), 0)
  const totalLimit = vouchers.reduce((sum, v) => sum + (v.usageLimit || 0), 0)

  return (
    <div className="page-wrapper">
      
      <div className="page-header-banner py-4">
        <Container>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="fw-bold mb-1">🎫 Quản lý Voucher</h1>
              <p className="text-muted mb-0">Quản lý mã giảm giá và ưu đãi cho khách hàng</p>
            </div>
            <Button className="btn-primary-custom" onClick={handleOpenAdd}>
              ➕ Thêm voucher mới
            </Button>
          </div>
        </Container>
      </div>

      <Container className="py-4">
        
        <Row className="admin-stats-row g-3 mb-4">
          <Col xs={6} lg={3}>
            <div className="admin-stat-card-custom">
              <div className="stat-card-icon primary">🎫</div>
              <div className="stat-card-value">{totalVouchers}</div>
              <div className="stat-card-label">Tổng voucher</div>
            </div>
          </Col>
          <Col xs={6} lg={3}>
            <div className="admin-stat-card-custom">
              <div className="stat-card-icon success">✅</div>
              <div className="stat-card-value">{activeVouchers}</div>
              <div className="stat-card-label">Đang hoạt động</div>
            </div>
          </Col>
          <Col xs={6} lg={3}>
            <div className="admin-stat-card-custom">
              <div className="stat-card-icon secondary">📊</div>
              <div className="stat-card-value">{totalUsed}</div>
              <div className="stat-card-label">Lượt sử dụng</div>
            </div>
          </Col>
          <Col xs={6} lg={3}>
            <div className="admin-stat-card-custom">
              <div className="stat-card-icon primary">🎯</div>
              <div className="stat-card-value">{totalLimit}</div>
              <div className="stat-card-label">Tổng giới hạn</div>
            </div>
          </Col>
        </Row>

        
        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

        
        <Card className="filter-card mb-4">
          <Card.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small text-muted">Tìm kiếm</Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="search-addon">🔍</InputGroup.Text>
                    <Form.Control
                      type="text"
                      className="filter-input"
                      placeholder="Tìm kiếm theo mã hoặc tiêu đề..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        
        {loading ? (
          <div className="loading-spinner-wrapper">
            <div className="loading-spinner"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎫</div>
            <div className="empty-state-title">Không tìm thấy voucher nào</div>
            <div className="empty-state-text">
              {search ? 'Thử thay đổi từ khóa tìm kiếm' : 'Bắt đầu bằng cách thêm voucher mới'}
            </div>
            {!search && (
              <Button className="btn-primary-custom" onClick={handleOpenAdd}>
                ➕ Thêm voucher đầu tiên
              </Button>
            )}
          </div>
        ) : (
          <Card className="table-card">
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table className="admin-table modern-table" hover responsive>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Mã voucher</th>
                      <th>Tiêu đề</th>
                      <th>Loại</th>
                      <th>Giá trị</th>
                      <th>Sử dụng</th>
                      <th>Hiệu lực</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((voucher, index) => (
                      <tr key={voucher.id} className="table-row-hover">
                        <td className="text-muted">{index + 1}</td>
                        <td>
                          <div className="voucher-code-cell">
                            <strong>{voucher.code}</strong>
                          </div>
                        </td>
                        <td>
                          <div className="voucher-title-cell">
                            <strong>{voucher.title}</strong>
                            <small className="text-muted d-block">{voucher.description}</small>
                          </div>
                        </td>
                        <td>
                          <Badge bg={voucher.type === 'percentage' ? 'info' : 'warning'} className="time-badge">
                            {voucher.type === 'percentage' ? 'Phần trăm' : 'Cố định'}
                          </Badge>
                        </td>
                        <td>
                          <span className="price-cell">
                            {voucher.type === 'percentage'
                              ? `${voucher.value}%`
                              : `${voucher.value.toLocaleString()}đ`
                            }
                          </span>
                        </td>
                        <td>
                          <div className="usage-cell">
                            <span className={voucher.usedCount >= voucher.usageLimit ? 'text-danger' : 'text-success'}>
                              {voucher.usedCount || 0}/{voucher.usageLimit}
                            </span>
                            <div className="usage-bar">
                              <div
                                className="usage-fill"
                                style={{
                                  width: `${Math.min((voucher.usedCount || 0) / voucher.usageLimit * 100, 100)}%`,
                                  backgroundColor: voucher.usedCount >= voucher.usageLimit ? '#dc3545' : '#28a745'
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="validity-cell">
                            <small className="text-muted">
                              {new Date(voucher.validFrom).toLocaleDateString()} - {new Date(voucher.validTo).toLocaleDateString()}
                            </small>
                          </div>
                        </td>
                        <td>
                          <Badge
                            bg={voucher.isActive ? 'success' : 'secondary'}
                            className="time-badge"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleToggleStatus(voucher)}
                          >
                            {voucher.isActive ? 'Hoạt động' : 'Tạm dừng'}
                          </Badge>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <Button
                              size="sm"
                              variant="outline-primary"
                              className="action-btn me-1"
                              onClick={() => handleOpenEdit(voucher)}
                              title="Sửa"
                            >
                              ✏️
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              className="action-btn"
                              onClick={() => handleDeleteClick(voucher.id)}
                              title="Xóa"
                            >
                              🗑️
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        )}
      </Container>

      
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingId ? '✏️ Sửa voucher' : '➕ Thêm voucher mới'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Mã voucher *</Form.Label>
                  <Form.Control
                    type="text"
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    placeholder="VD: WELCOME20"
                    style={{ textTransform: 'uppercase' }}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Loại giảm giá *</Form.Label>
                  <Form.Select name="type" value={form.type} onChange={handleChange} required>
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (đ)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Tiêu đề *</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="VD: Chào mừng thành viên mới"
                    required
                  />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Mô tả</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Mô tả chi tiết về voucher..."
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>
                    Giá trị giảm * {form.type === 'percentage' ? '(%)' : '(đ)'}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="value"
                    value={form.value}
                    onChange={handleChange}
                    min="0"
                    max={form.type === 'percentage' ? '100' : undefined}
                    step={form.type === 'percentage' ? '0.1' : '1000'}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Đơn hàng tối thiểu (đ)</Form.Label>
                  <Form.Control
                    type="number"
                    name="minOrderValue"
                    value={form.minOrderValue}
                    onChange={handleChange}
                    min="0"
                    step="1000"
                    placeholder="0"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Số ghế tối thiểu</Form.Label>
                  <Form.Control
                    type="number"
                    name="minSeats"
                    value={form.minSeats}
                    onChange={handleChange}
                    min="0"
                    placeholder="0"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Giảm tối đa (đ)</Form.Label>
                  <Form.Control
                    type="number"
                    name="maxDiscount"
                    value={form.maxDiscount}
                    onChange={handleChange}
                    min="0"
                    step="1000"
                    placeholder="Không giới hạn"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Giới hạn sử dụng *</Form.Label>
                  <Form.Control
                    type="number"
                    name="usageLimit"
                    value={form.usageLimit}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Trạng thái</Form.Label>
                  <Form.Check
                    type="switch"
                    name="isActive"
                    label="Kích hoạt"
                    checked={form.isActive}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Ngày bắt đầu *</Form.Label>
                  <Form.Control
                    type="date"
                    name="validFrom"
                    value={form.validFrom}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Ngày kết thúc *</Form.Label>
                  <Form.Control
                    type="date"
                    name="validTo"
                    value={form.validTo}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button type="submit" className="btn-primary-custom" disabled={saving}>
              {saving ? <Spinner size="sm" /> : (editingId ? 'Cập nhật' : 'Thêm mới')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>🗑️ Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn muốn xóa voucher này không?</p>
          <p className="text-muted small">Hành động này không thể hoàn tác.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Xóa
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}