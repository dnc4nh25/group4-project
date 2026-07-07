import { Row, Col } from 'react-bootstrap'

export function MovieCardSkeleton() {
  return (
    <div className="movie-card" style={{ pointerEvents: 'none' }}>
      <div className="movie-poster-wrapper">
        <div className="skeleton skeleton-image" />
      </div>
      <div style={{ padding: '1rem' }}>
        <div className="skeleton skeleton-text" style={{ height: '1.2em', width: '80%' }} />
        <div className="skeleton skeleton-text" style={{ height: '1em', width: '60%', marginTop: '0.5rem' }} />
        <div className="skeleton skeleton-text" style={{ height: '0.8em', width: '40%', marginTop: '0.5rem' }} />
      </div>
    </div>
  )
}

export function MovieGridSkeleton({ count = 4 }) {
  return (
    <Row xs={1} sm={2} lg={4} className="g-4">
      {Array.from({ length: count }).map((_, i) => (
        <Col key={i}>
          <MovieCardSkeleton />
        </Col>
      ))}
    </Row>
  )
}

export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="table-responsive">
      <table className="admin-table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}>
                <div className="skeleton skeleton-text" style={{ height: '0.8em', width: '60px' }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: cols }).map((_, colIndex) => (
                <td key={colIndex}>
                  <div 
                    className="skeleton skeleton-text" 
                    style={{ 
                      height: colIndex === 1 ? '40px' : '1em', 
                      width: colIndex === 1 ? '50px' : `${Math.random() * 40 + 40}%` 
                    }} 
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function TextSkeleton({ lines = 3 }) {
  return (
    <div>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className="skeleton skeleton-text" 
          style={{ 
            width: `${Math.random() * 30 + 50}%`,
            opacity: 1 - (i * 0.1)
          }} 
        />
      ))}
    </div>
  )
}

export function ShowtimeSkeleton({ count = 4 }) {
  return (
    <div className="d-flex flex-wrap gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="showtime-card p-3" 
          style={{ minWidth: '170px', pointerEvents: 'none' }}
        >
          <div className="skeleton skeleton-text" style={{ height: '1.5em', width: '70%', margin: '0 auto 0.5rem' }} />
          <div className="skeleton skeleton-text" style={{ height: '0.8em', width: '50%', margin: '0 auto 0.5rem' }} />
          <div className="skeleton skeleton-text" style={{ height: '6px', width: '100%', margin: '0.5rem 0' }} />
          <div className="skeleton skeleton-text" style={{ height: '0.8em', width: '60%', margin: '0.5rem auto' }} />
          <div className="skeleton skeleton-text" style={{ height: '1.2em', width: '80%', margin: '0.5rem auto' }} />
        </div>
      ))}
    </div>
  )
}

export function PageLoader() {
  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        flexDirection: 'column',
        gap: '1.5rem'
      }}
    >
      <div 
        style={{
          width: '50px',
          height: '50px',
          border: '3px solid var(--border)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
      <div className="text-muted">Đang tải...</div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default { 
  MovieCardSkeleton, 
  MovieGridSkeleton, 
  TableSkeleton, 
  TextSkeleton, 
  ShowtimeSkeleton,
  PageLoader 
}