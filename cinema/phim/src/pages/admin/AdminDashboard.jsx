import { useMemo, useState } from 'react'
import { Container, Card, Row, Col, Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts'
import { useFetch } from '../../hooks/useFetch'
import './AdminCommon.css'

const formatVND = (value) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return `${value}`
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(20,20,35,0.97)',
        border: '1px solid rgba(255,193,7,0.3)',
        borderRadius: 10,
        padding: '10px 16px',
        color: '#fff',
        fontSize: 13
      }}>
        <div style={{ color: '#ffc107', fontWeight: 700, marginBottom: 4 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i}>
            {p.name}: <strong style={{ color: p.color }}>{p.value.toLocaleString()}đ</strong>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function AdminDashboard() {
  const [dateFilter, setDateFilter] = useState(14)
  const { data: bookings } = useFetch('http://localhost:3001/bookings')

  const totalRevenue = useMemo(
    () => bookings?.reduce((s, b) => s + (b.totalPrice || 0), 0) || 0,
    [bookings]
  )

  const dailyData = useMemo(() => {
    if (!bookings) return []
    const map = {}
    bookings.forEach(b => {
      const day = (b.createdAt || '').split('T')[0]
      if (!day) return
      map[day] = (map[day] || 0) + (b.totalPrice || 0)
    })
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-dateFilter)
      .map(([date, revenue]) => ({ date, 'Doanh thu': revenue }))
  }, [bookings, dateFilter])

  const { data: movies } = useFetch('http://localhost:3001/movies')
  const { data: showtimes } = useFetch('http://localhost:3001/showtimes')

  const movieData = useMemo(() => {
    if (!bookings || !showtimes || !movies) return []
    const map = {}
    bookings.forEach(b => {
      const st = showtimes.find(s => String(s.id) === String(b.showtimeId))
      if (!st) return
      const mv = movies.find(m => String(m.id) === String(st.movieId))
      const title = mv?.title || 'Khác'
      map[title] = (map[title] || 0) + (b.totalPrice || 0)
    })
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([title, revenue]) => ({ title: title.length > 16 ? title.slice(0, 14) + '…' : title, 'Doanh thu': revenue }))
  }, [bookings, showtimes, movies])

  return (
    <div className="page-wrapper admin-dashboard-page">
      <div className="page-header-banner py-4">
        <Container>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h1 className="fw-bold mb-1">⚙️ Admin Dashboard</h1>
              <p className="text-muted mb-0">Tổng quan doanh thu và thống kê CinemaXP</p>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-4">
        <Row className="g-4 mb-4 justify-content-center">
          <Col xs={12} md={6} lg={4}>
            <Card className="stat-card-enhanced text-center">
              <Card.Body className="p-4">
                <div className="stat-icon">💰</div>
                <div className="stat-value">
                  {totalRevenue.toLocaleString()}đ
                </div>
                <div className="stat-label">Tổng doanh thu</div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} md={6} lg={4}>
            <Card className="stat-card-enhanced text-center">
              <Card.Body className="p-4">
                <div className="stat-icon">🎟️</div>
                <div className="stat-value text-enhanced-success">
                  {bookings?.length || 0}
                </div>
                <div className="stat-label">Tổng vé đã đặt</div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} md={6} lg={4}>
            <Card className="stat-card-enhanced text-center">
              <Card.Body className="p-4">
                <div className="stat-icon">📊</div>
                <div className="stat-value" style={{ color: '#3498db' }}>
                  {bookings?.length
                    ? Math.round(totalRevenue / bookings.length).toLocaleString() + 'đ'
                    : '—'}
                </div>
                <div className="stat-label">Doanh thu TB / vé</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Card className="chart-card">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h5 className="fw-bold mb-0 text-enhanced-light">📈 Doanh thu theo ngày ({dateFilter} ngày gần nhất)</h5>
            <div className="d-flex gap-2">
              <Button
                variant={dateFilter === 7 ? 'warning' : 'outline-secondary'}
                size="sm"
                className="px-3"
                onClick={() => setDateFilter(7)}
              >
                7 ngày
              </Button>
              <Button
                variant={dateFilter === 14 ? 'warning' : 'outline-secondary'}
                size="sm"
                className="px-3"
                onClick={() => setDateFilter(14)}
              >
                14 ngày
              </Button>
              <Button
                variant={dateFilter === 30 ? 'warning' : 'outline-secondary'}
                size="sm"
                className="px-3"
                onClick={() => setDateFilter(30)}
              >
                30 ngày
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            {dailyData.length === 0 ? (
              <p className="text-enhanced-muted text-center py-4">Chưa có dữ liệu</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#D1D5DB', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={formatVND}
                    tick={{ fill: '#D1D5DB', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="Doanh thu"
                    stroke="#F59E0B"
                    strokeWidth={3}
                    fill="url(#revenueGrad)"
                    dot={{ fill: '#F59E0B', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, fill: '#F59E0B', stroke: '#fff', strokeWidth: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card.Body>
        </Card>

        <Card className="chart-card">
          <Card.Header>
            <h5 className="fw-bold mb-0 text-enhanced-light">🎬 Doanh thu theo phim (Top 6)</h5>
          </Card.Header>
          <Card.Body>
            {movieData.length === 0 ? (
              <p className="text-enhanced-muted text-center py-4">Chưa có dữ liệu</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={movieData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="title"
                    tick={{ fill: '#D1D5DB', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={formatVND}
                    tick={{ fill: '#D1D5DB', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#D1D5DB' }} />
                  <Bar
                    dataKey="Doanh thu"
                    fill="#F59E0B"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  )
}
