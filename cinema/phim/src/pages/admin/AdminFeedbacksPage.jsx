import { useState, useEffect } from 'react'
import { Container, Card, Table, Badge, Button, Modal, Form, Spinner } from 'react-bootstrap'
import axios from 'axios'
import './AdminCommon.css'

export default function AdminFeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState(null)
  const [replyContent, setReplyContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [feedbacksRes, usersRes] = await Promise.all([
        axios.get('http://localhost:3001/contactMessages?_sort=-createdAt'),
        axios.get('http://localhost:3001/users')
      ])
      setFeedbacks(feedbacksRes.data)
      setUsers(usersRes.data)
    } catch (err) {
      console.error('Error fetching data:', err)
      alert('Không thể tải dữ liệu góp ý.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenReply = (feedback) => {
    setSelectedFeedback(feedback)
    setReplyContent(feedback.adminReply || '')
    setShowReplyModal(true)
  }

  const handleCloseReply = () => {
    setShowReplyModal(false)
    setSelectedFeedback(null)
    setReplyContent('')
  }

  const handleSendReply = async () => {
    if (!replyContent.trim()) {
      alert('Vui lòng nhập nội dung trả lời')
      return
    }
    setIsSubmitting(true)
    try {
      await axios.patch(`http://localhost:3001/contactMessages/${selectedFeedback.id}`, {
        status: 'replied',
        adminReply: replyContent,
        repliedAt: new Date().toISOString()
      })
      setFeedbacks(feedbacks.map(fb =>
        fb.id === selectedFeedback.id
          ? { ...fb, status: 'replied', adminReply: replyContent, repliedAt: new Date().toISOString() }
          : fb
      ))
      handleCloseReply()
    } catch (err) {
      console.error('Error sending reply:', err)
      alert('Lỗi gửi câu trả lời, vui lòng thử lại!')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId)
    return user ? user.fullName || user.username : 'Unknown User'
  }

  const getSubjectText = (subject) => {
    switch (subject) {
      case 'booking': return 'Vé'
      case 'payment': return 'Thanh toán'
      case 'technical': return 'Kỹ thuật'
      case 'feedback': return 'Góp ý'
      case 'partnership': return 'Hợp tác'
      default: return 'Khác'
    }
  }

  return (
    <Container fluid className="py-4 admin-movies-page admin-feedbacks-page page-wrapper">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="admin-page-title">
          <span className="title-icon">💬</span>
          Quản lý Góp ý &amp; Liên hệ
        </h2>
      </div>

      <Card className="admin-card" style={{ border: 'none' }}>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="warning" /></div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-5 text-muted">Chưa có liên hệ hay góp ý nào.</div>
          ) : (
            <div className="table-responsive">
              <Table hover className="admin-table align-middle mb-0">
                <thead>
                  <tr>
                    <th width="15%">Người gửi</th>
                    <th width="10%">Chủ đề</th>
                    <th width="30%">Tin nhắn</th>
                    <th width="15%">Thời gian</th>
                    <th width="10%">Trạng thái</th>
                    <th width="10%" className="text-end">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map((fb) => (
                    <tr key={fb.id}>
                      <td>
                        <div className="fw-bold">{fb.name || getUserName(fb.userId)}</div>
                        <div className="small text-muted">{fb.email}</div>
                      </td>
                      <td>
                        <Badge bg="secondary">{getSubjectText(fb.subject)}</Badge>
                      </td>
                      <td>
                        <div className="text-truncate" style={{ maxWidth: '300px' }} title={fb.message}>
                          {fb.message}
                        </div>
                      </td>
                      <td>
                        <div className="small">{new Date(fb.createdAt).toLocaleString('vi-VN')}</div>
                      </td>
                      <td>
                        {fb.status === 'replied' ? (
                          <Badge bg="success">Đã trả lời</Badge>
                        ) : (
                          <Badge bg="warning">Chờ xử lý</Badge>
                        )}
                      </td>
                      <td className="text-end">
                        <Button
                          variant="outline-warning"
                          size="sm"
                          onClick={() => handleOpenReply(fb)}
                        >
                          {fb.status === 'replied' ? 'Xem/Sửa' : 'Trả lời'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal show={showReplyModal} onHide={handleCloseReply} centered contentClassName="bg-dark text-white">
        <Modal.Header closeButton closeVariant="white" className="border-secondary">
          <Modal.Title>
            {selectedFeedback?.status === 'replied' ? 'Chỉnh sửa phản hồi' : 'Phản hồi Góp ý'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-4 p-3 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
            <h6 className="text-warning mb-2">Thông tin người gửi:</h6>
            <div><strong>Tên:</strong> {selectedFeedback?.name} <span className="text-muted">({selectedFeedback?.email})</span></div>
            <div><strong>Chủ đề:</strong> {selectedFeedback && getSubjectText(selectedFeedback.subject)}</div>
            <div className="mt-2 text-wrap text-break"><strong>Nội dung:</strong> {selectedFeedback?.message}</div>
          </div>
          <Form.Group>
            <Form.Label>Nội dung câu trả lời của Admin:</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Nhập nội dung phản hồi cho khách hàng..."
              className="bg-dark text-white border-secondary"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-secondary">
          <Button variant="secondary" onClick={handleCloseReply}>Huỷ</Button>
          <Button variant="warning" onClick={handleSendReply} disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" /> : 'Gửi phản hồi'}
          </Button>
        </Modal.Footer>
      </Modal>

    </Container>
  )
}
