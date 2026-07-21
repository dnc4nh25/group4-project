import { useState, useEffect } from 'react'
import { Card, Button, Form, Alert, Spinner, Badge } from 'react-bootstrap'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import './ReviewSection.css'

const API = 'http://localhost:8080/api'

function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="star-input d-flex gap-1 mb-2">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          className={`star-btn-input ${(hover || value) >= s ? 'star-on' : 'star-off'}`}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          title={`${s} sao`}
        >
          ★
        </button>
      ))}
      <span className="ms-2 text-muted small align-self-center">
        {value ? `${value}/5` : 'Chọn số sao'}
      </span>
    </div>
  )
}

function StarDisplay({ value }) {
  return (
    <span className="star-display">
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} className={s <= value ? 'star-filled-r' : 'star-empty-r'}>★</span>
      ))}
    </span>
  )
}

export default function ReviewSection({ movieId, movie }) {
  const { currentUser } = useAuth()

  const [reviews, setReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [eligible, setEligible] = useState(false)   // đã xem phim trong quá khứ
  const [checking, setChecking] = useState(true)
  const [myReview, setMyReview] = useState(null)    // đánh giá của tôi (nếu có)

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null) // { type, msg }
  const [isEditing, setIsEditing] = useState(false)

  const loadReviews = async () => {
    setLoadingReviews(true)
    try {
      const res = await axios.get(`${API}/reviews`)
      const movieReviews = res.data.filter(r => String(r.movieId) === String(movieId))
      setReviews(movieReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
      if (currentUser) {
        const mine = movieReviews.find(r => String(r.userId) === String(currentUser.id))
        setMyReview(mine || null)
      }
    } catch {
      setReviews([])
    } finally {
      setLoadingReviews(false)
    }
  }

  const checkEligibility = async () => {
    if (!currentUser) { setChecking(false); return }
    try {
      const [bookingsRes, showtimesRes] = await Promise.all([
        axios.get(`${API}/bookings`),
        axios.get(`${API}/showtimes`)
      ])

      const myBookings = bookingsRes.data.filter(
        b => String(b.userId) === String(currentUser.id)
      )
      const movieShowtimes = showtimesRes.data.filter(
        st => String(st.movieId) === String(movieId)
      )

      const now = new Date()
      const duration = movie?.duration || 120 // phút

      for (const booking of myBookings) {
        const showtime = movieShowtimes.find(
          st => String(st.id) === String(booking.showtimeId)
        )
        if (!showtime) continue

        const startTime = new Date(`${showtime.date}T${showtime.time}:00`)
        const endTime = new Date(startTime.getTime() + duration * 60 * 1000)

        if (endTime < now) {
          setEligible(true)
          break
        }
      }
    } catch {
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    loadReviews()
    checkEligibility()
  }, [movieId, currentUser])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!comment.trim()) { setFeedback({ type: 'warning', msg: 'Vui lòng nhập nhận xét.' }); return }
    setSubmitting(true)
    setFeedback(null)
    try {
      if (isEditing && myReview) {
        await axios.put(`${API}/reviews/${myReview.id}`, {
          ...myReview,
          rating,
          comment: comment.trim(),
          updatedAt: new Date().toISOString().split('T')[0]
        })
        setFeedback({ type: 'success', msg: 'Đánh giá của bạn đã được cập nhật!' })
      } else {
        await axios.post(`${API}/reviews`, {
          movieId: String(movieId),
          userId: currentUser.id,
          rating,
          comment: comment.trim(),
          createdAt: new Date().toISOString().split('T')[0]
        })
        setFeedback({ type: 'success', msg: 'Cảm ơn bạn đã đánh giá!' })
      }
      setComment('')
      setRating(5)
      setIsEditing(false)
      await loadReviews()
    } catch {
      setFeedback({ type: 'danger', msg: 'Gửi đánh giá thất bại. Vui lòng thử lại.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = () => {
    if (myReview) {
      setRating(myReview.rating)
      setComment(myReview.comment)
      setIsEditing(true)
      setFeedback(null)
    }
  }

  const handleCancelEdit = () => {
    setRating(5)
    setComment('')
    setIsEditing(false)
    setFeedback(null)
  }

  const handleToggleHidden = async (reviewId, currentHidden) => {
    try {
      const review = reviews.find(r => r.id === reviewId)
      await axios.put(`${API}/reviews/${reviewId}`, {
        ...review,
        hidden: !currentHidden
      })
      setReviews(reviews.map(r =>
        r.id === reviewId ? { ...r, hidden: !currentHidden } : r
      ))
    } catch {
      setFeedback({ type: 'danger', msg: 'Cập nhật trạng thái thất bại.' })
    }
  }

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  return (
  <div className="review-section mt-5 mb-4">
    
    <div className="d-flex align-items-center gap-3 mb-4">
      <h3 className="fw-bold mb-0">💬 Đánh Giá Phim</h3>
      {avgRating && (
        <Badge bg="warning" text="dark" className="px-3 py-2 fs-6">
          ⭐ {avgRating} / 5 &nbsp;({reviews.length} đánh giá)
        </Badge>
      )}
    </div>

    
    {!currentUser ? (
      <Card className="review-prompt-card mb-4">
        <Card.Body className="text-center py-4">
          <div style={{ fontSize: 36 }}>🔐</div>
          <p className="mt-2 mb-3">Hãy đăng nhập để đánh giá phim</p>
          <Button as={Link} to="/login" className="btn-primary-custom">Đăng nhập</Button>
        </Card.Body>
      </Card>
    ) : checking ? (
      <div className="text-center py-3"><Spinner size="sm" variant="warning" /> <span className="text-muted ms-2">Đang kiểm tra quyền đánh giá...</span></div>
    ) : myReview && !isEditing ? (
      <Card className="my-review-card mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <strong className="text-success">Đánh giá của bạn</strong>
              <div className="mt-1"><StarDisplay value={myReview.rating} /></div>
            </div>
            <div className="d-flex gap-2">

              <Button
                size="sm"
                variant="outline-warning"
                onClick={handleEdit}
                className="d-flex align-items-center gap-1"
              >
                Chỉnh sửa
              </Button>
            </div>
          </div>
          <p className="mt-2 mb-0 fst-italic">
            {myReview.hidden ? (
              <span className="text-muted">
                [Nội dung đánh giá đã bị ẩn bởi quản trị viên]
              </span>
            ) : (
              `"${myReview.comment}"`
            )}
          </p>
          <small className="text-muted">{myReview.createdAt}</small>
        </Card.Body>
      </Card>
    ) : (eligible || isEditing) ? (
      <Card className="review-form-card mb-4">
        <Card.Body>
          <h5 className="fw-bold mb-3">{isEditing ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá của bạn'}</h5>
          {feedback && <Alert variant={feedback.type} className="py-2">{feedback.msg}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Đánh giá sao</Form.Label>
              <StarInput value={rating} onChange={setRating} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nhận xét</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Chia sẻ cảm nhận của bạn về bộ phim..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                maxLength={500}
              />
              <Form.Text>{comment.length}/500 ký tự</Form.Text>
            </Form.Group>
            <div className="d-flex gap-2">
              <Button
                type="submit"
                className="btn-primary-custom"
                disabled={submitting}
              >
                {submitting ? <Spinner size="sm" /> : (isEditing ? 'Cập nhật' : 'Gửi đánh giá')}
              </Button>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={handleCancelEdit}
                  disabled={submitting}
                >
                  Hủy
                </Button>
              )}
            </div>
          </Form>
        </Card.Body>
      </Card>
    ) : (
      <Card className="review-prompt-card mb-4">
        <Card.Body className="text-center py-4">
          <div style={{ fontSize: 36 }}>🎫</div>
          <p className="mt-2 mb-0 text-muted">
            Bạn chỉ có thể đánh giá sau khi đã xem phim này.<br />
            <small>Đặt vé và xem phim để mở khóa tính năng đánh giá.</small>
          </p>
        </Card.Body>
      </Card>
    )}

    
    {loadingReviews ? (
      <div className="text-center py-3"><Spinner variant="warning" size="sm" /></div>
    ) : reviews.length === 0 ? (
      <p className="text-muted fst-italic text-center py-3">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
    ) : (
      <div className="review-list d-flex flex-column gap-3">
        
        {reviews.filter(r => !myReview || r.id !== myReview.id).map(r => (
          <Card key={r.id} className="review-card">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="d-flex align-items-center gap-2">
                  <div className="reviewer-avatar">{r.userId?.charAt(0)?.toUpperCase() || 'U'}</div>
                  <div>
                    <div className="fw-semibold reviewer-name">Người dùng #{String(r.userId).slice(-4)}</div>
                    <StarDisplay value={r.rating} />
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <small className="text-muted">{r.createdAt}</small>
                  
                  {currentUser?.role === 'admin' && (
                    <Button
                      size="sm"
                      variant={r.hidden ? 'outline-success' : 'outline-warning'}
                      onClick={() => handleToggleHidden(r.id, r.hidden)}
                      title={r.hidden ? 'Hiển thị comment' : 'Ẩn comment'}
                      className="admin-hide-btn"
                    >
                      {r.hidden ? '👁️' : '🙈'}
                    </Button>
                  )}
                </div>
              </div>
              <p className="review-comment mb-0">
                {r.hidden ? (
                  <span className="text-muted fst-italic">
                    [Nội dung đánh giá đã bị ẩn bởi quản trị viên]
                  </span>
                ) : (
                  `"${r.comment}"`
                )}
              </p>
            </Card.Body>
          </Card>
        ))}
      </div>
    )}
  </div>
)
}
