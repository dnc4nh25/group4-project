import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert, Tab, Tabs } from 'react-bootstrap'
import axios from 'axios'
import './AdminFooterPage.css'

export default function AdminFooterPage() {
  const [footerData, setFooterData] = useState({
    brand: {
      name: 'CinemaXP',
      description: 'Trải nghiệm điện ảnh đỉnh cao với công nghệ hiện đại và dịch vụ tuyệt vời. Nơi mang đến những giây phút giải trí tuyệt vời cho bạn và gia đình.',
      socialLinks: {
        facebook: 'https://www.facebook.com/minhhieu.hoang.522066',
        instagram: '#',
        youtube: '#',
        twitter: '#'
      }
    },
    contact: {
      address: 'Nhà anh Minh, Thạch Hoà, Thạch Thất, Hà Nội',
      phone: '1900 1234',
      email: 'anhminhgay@gmail.com',
      hours: '8:00 - 24:00 (Hàng ngày)'
    },
    locations: [
      {
        id: 1,
        name: 'CinemaXP Hà Nội',
        address: 'Nhà anh Minh, Thạch Hoà, Thạch Thất, Hà Nội',
        phone: '(024) 3851 9012',
        email: 'hanoi@cinemaxp.vn',
        manager: 'Nguyễn Văn Minh'
      },
      {
        id: 2,
        name: 'CinemaXP TP.HCM',
        address: '123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
        phone: '(028) 3822 1234',
        email: 'hcm@cinemaxp.vn',
        manager: 'Trần Thị Lan'
      }
    ],
    copyright: '© 2026 CinemaXP. Tất cả quyền được bảo lưu.',
    paymentText: 'Chấp nhận thanh toán:'
  })

  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState({ show: false, type: '', message: '' })
  const [activeTab, setActiveTab] = useState('brand')

  useEffect(() => {
    loadFooterData()
  }, [])

  const loadFooterData = async () => {
    try {
      const response = await axios.get('http://localhost:3001/footerSettings/1')
      setFooterData(response.data)
      console.log('Footer data loaded:', response.data)
    } catch (error) {
      console.error('Error loading footer data:', error)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const updatedData = {
        ...footerData,
        updatedAt: new Date().toISOString()
      }
      
      await axios.put('http://localhost:3001/footerSettings/1', updatedData)
      setFooterData(updatedData)
      
      localStorage.setItem('footerUpdated', Date.now().toString())
      
      showAlert('success', 'Cập nhật thông tin footer thành công!')
    } catch (error) {
      console.error('Error saving footer data:', error)
      showAlert('error', 'Có lỗi xảy ra khi cập nhật thông tin footer!')
    } finally {
      setLoading(false)
    }
  }

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message })
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3000)
  }

  const handleBrandChange = (field, value) => {
    setFooterData(prev => ({
      ...prev,
      brand: {
        ...prev.brand,
        [field]: value
      }
    }))
  }

  const handleSocialChange = (platform, value) => {
    setFooterData(prev => ({
      ...prev,
      brand: {
        ...prev.brand,
        socialLinks: {
          ...prev.brand.socialLinks,
          [platform]: value
        }
      }
    }))
  }

  const handleContactChange = (field, value) => {
    setFooterData(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        [field]: value
      }
    }))
  }

  const handleLocationChange = (index, field, value) => {
    setFooterData(prev => ({
      ...prev,
      locations: prev.locations.map((location, i) => 
        i === index ? { ...location, [field]: value } : location
      )
    }))
  }

  const addLocation = () => {
    const newLocation = {
      id: Date.now(),
      name: '',
      address: '',
      phone: '',
      email: '',
      manager: ''
    }
    setFooterData(prev => ({
      ...prev,
      locations: [...prev.locations, newLocation]
    }))
  }

  const removeLocation = (index) => {
    setFooterData(prev => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== index)
    }))
  }

  return (
    <Container fluid className="py-4 admin-footer-page page-wrapper">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="admin-page-title">
              <span className="title-icon">🔧</span>
              Quản lý Footer
            </h2>
            <Button 
              variant="success" 
              onClick={handleSave}
              disabled={loading}
              className="admin-btn-primary"
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Đang lưu...
                </>
              ) : (
                <>💾 Lưu thay đổi</>
              )}
            </Button>
          </div>

          {alert.show && (
            <Alert variant={alert.type === 'success' ? 'success' : 'danger'} className="mb-4">
              {alert.message}
            </Alert>
          )}

          <Card className="admin-card">
            <Card.Body>
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-4"
              >
                
                <Tab eventKey="brand" title="🏢 Thương hiệu">
                  <Row className="g-4">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Tên thương hiệu</Form.Label>
                        <Form.Control
                          type="text"
                          value={footerData.brand.name}
                          onChange={(e) => handleBrandChange('name', e.target.value)}
                          placeholder="Nhập tên thương hiệu"
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12}>
                      <Form.Group>
                        <Form.Label>Mô tả thương hiệu</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={footerData.brand.description}
                          onChange={(e) => handleBrandChange('description', e.target.value)}
                          placeholder="Nhập mô tả thương hiệu"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>📘 Facebook</Form.Label>
                        <Form.Control
                          type="url"
                          value={footerData.brand.socialLinks.facebook}
                          onChange={(e) => handleSocialChange('facebook', e.target.value)}
                          placeholder="https://facebook.com/..."
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>📷 Instagram</Form.Label>
                        <Form.Control
                          type="url"
                          value={footerData.brand.socialLinks.instagram}
                          onChange={(e) => handleSocialChange('instagram', e.target.value)}
                          placeholder="https://instagram.com/..."
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>📺 YouTube</Form.Label>
                        <Form.Control
                          type="url"
                          value={footerData.brand.socialLinks.youtube}
                          onChange={(e) => handleSocialChange('youtube', e.target.value)}
                          placeholder="https://youtube.com/..."
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>🐦 Twitter</Form.Label>
                        <Form.Control
                          type="url"
                          value={footerData.brand.socialLinks.twitter}
                          onChange={(e) => handleSocialChange('twitter', e.target.value)}
                          placeholder="https://twitter.com/..."
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Tab>

                
                <Tab eventKey="contact" title="📞 Liên hệ">
                  <Row className="g-4">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>📍 Địa chỉ</Form.Label>
                        <Form.Control
                          type="text"
                          value={footerData.contact.address}
                          onChange={(e) => handleContactChange('address', e.target.value)}
                          placeholder="Nhập địa chỉ"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>📞 Số điện thoại</Form.Label>
                        <Form.Control
                          type="text"
                          value={footerData.contact.phone}
                          onChange={(e) => handleContactChange('phone', e.target.value)}
                          placeholder="Nhập số điện thoại"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>✉️ Email</Form.Label>
                        <Form.Control
                          type="email"
                          value={footerData.contact.email}
                          onChange={(e) => handleContactChange('email', e.target.value)}
                          placeholder="Nhập email"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>🕒 Giờ làm việc</Form.Label>
                        <Form.Control
                          type="text"
                          value={footerData.contact.hours}
                          onChange={(e) => handleContactChange('hours', e.target.value)}
                          placeholder="Nhập giờ làm việc"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Tab>

                
                <Tab eventKey="locations" title="🏢 Cơ sở">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5>Danh sách cơ sở</h5>
                    <Button variant="primary" onClick={addLocation} size="sm">
                      ➕ Thêm cơ sở
                    </Button>
                  </div>
                  
                  {footerData.locations.map((location, index) => (
                    <Card key={location.id} className="mb-3 border-secondary">
                      <Card.Header className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">Cơ sở {index + 1}</h6>
                        {footerData.locations.length > 1 && (
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => removeLocation(index)}
                          >
                            🗑️ Xóa
                          </Button>
                        )}
                      </Card.Header>
                      <Card.Body>
                        <Row className="g-3">
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label>Tên cơ sở</Form.Label>
                              <Form.Control
                                type="text"
                                value={location.name}
                                onChange={(e) => handleLocationChange(index, 'name', e.target.value)}
                                placeholder="Nhập tên cơ sở"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label>Số điện thoại</Form.Label>
                              <Form.Control
                                type="text"
                                value={location.phone}
                                onChange={(e) => handleLocationChange(index, 'phone', e.target.value)}
                                placeholder="Nhập số điện thoại"
                              />
                            </Form.Group>
                          </Col>
                          <Col xs={12}>
                            <Form.Group>
                              <Form.Label>Địa chỉ</Form.Label>
                              <Form.Control
                                type="text"
                                value={location.address}
                                onChange={(e) => handleLocationChange(index, 'address', e.target.value)}
                                placeholder="Nhập địa chỉ"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label>Email</Form.Label>
                              <Form.Control
                                type="email"
                                value={location.email}
                                onChange={(e) => handleLocationChange(index, 'email', e.target.value)}
                                placeholder="Nhập email"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label>Quản lý</Form.Label>
                              <Form.Control
                                type="text"
                                value={location.manager}
                                onChange={(e) => handleLocationChange(index, 'manager', e.target.value)}
                                placeholder="Nhập tên quản lý"
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  ))}
                </Tab>

                
                <Tab eventKey="other" title="⚙️ Khác">
                  <Row className="g-4">
                    <Col xs={12}>
                      <Form.Group>
                        <Form.Label>Bản quyền</Form.Label>
                        <Form.Control
                          type="text"
                          value={footerData.copyright}
                          onChange={(e) => setFooterData(prev => ({ ...prev, copyright: e.target.value }))}
                          placeholder="Nhập thông tin bản quyền"
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12}>
                      <Form.Group>
                        <Form.Label>Text thanh toán</Form.Label>
                        <Form.Control
                          type="text"
                          value={footerData.paymentText}
                          onChange={(e) => setFooterData(prev => ({ ...prev, paymentText: e.target.value }))}
                          placeholder="Nhập text thanh toán"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}