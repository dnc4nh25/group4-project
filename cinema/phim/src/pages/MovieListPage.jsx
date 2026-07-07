import { useState, useMemo, useRef, useEffect } from 'react'
import { Container, Row, Col, Form, InputGroup, Button, Spinner, Alert, Badge, Pagination } from 'react-bootstrap'
import { useFetch } from '../hooks/useFetch'
import MovieCard from '../components/MovieCard'
import { MovieGridSkeleton } from '../components/LoadingSkeleton'

const GENRES = [
  { key: 'all', label: 'Tất cả', icon: '🎬' },
  { key: 'Hành động', label: 'Hành động', icon: '🔥' },
  { key: 'Giật gân', label: 'Giật gân', icon: '😱' },
  { key: 'Khoa học viễn tưởng', label: 'Khoa học viễn tưởng', icon: '🚀' },
  { key: 'Hoạt hình', label: 'Hoạt hình', icon: '🎨' },
  { key: 'Lịch sử', label: 'Lịch sử', icon: '📜' },
  { key: 'Tình cảm', label: 'Tình cảm', icon: '💕' }
]

const SORT_OPTIONS = [
  { value: 'default', label: 'Mặc định', icon: '📋' },
  { value: 'rating-desc', label: '⭐ Đánh giá cao nhất', icon: '⭐' },
  { value: 'rating-asc', label: '⭐ Đánh giá thấp nhất', icon: '📉' },
  { value: 'title-az', label: 'A → Z', icon: '🔤' },
  { value: 'title-za', label: 'Z → A', icon: '🔡' },
  { value: 'duration-desc', label: 'Thời lượng dài nhất', icon: '⏱️' }
]

export default function MovieListPage() {
  const { data: movies, loading, error } = useFetch('http://localhost:3001/movies')
  const [search, setSearch] = useState('')
  const [searchFocus, setSearchFocus] = useState(false)
  const [genre, setGenre] = useState('all')
  const [sortBy, setSortBy] = useState('default')
  const [showFilters, setShowFilters] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const searchInputRef = useRef(null)

  const MOVIES_PER_PAGE = 12

  const filteredMovies = useMemo(() => {
    if (!movies) return []
    let result = [...movies]

    if (genre !== 'all') {
      result = result.filter(m => {
        if (m.genres && Array.isArray(m.genres)) {
          return m.genres.includes(genre)
        }
        return m.genre === genre
      })
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(m => {
        const genreText = m.genres && Array.isArray(m.genres)
          ? m.genres.join(' ').toLowerCase()
          : (m.genre || '').toLowerCase()

        return m.title.toLowerCase().includes(q) ||
          m.director?.toLowerCase().includes(q) ||
          genreText.includes(q)
      })
    }

    if (sortBy === 'rating-desc') result.sort((a, b) => b.rating - a.rating)
    else if (sortBy === 'rating-asc') result.sort((a, b) => a.rating - b.rating)
    else if (sortBy === 'title-az') result.sort((a, b) => a.title.localeCompare(b.title))
    else if (sortBy === 'title-za') result.sort((a, b) => b.title.localeCompare(a.title))
    else if (sortBy === 'duration-desc') result.sort((a, b) => b.duration - a.duration)

    return result
  }, [movies, search, genre, sortBy])

  const totalPages = Math.ceil(filteredMovies.length / MOVIES_PER_PAGE)
  const startIndex = (currentPage - 1) * MOVIES_PER_PAGE
  const endIndex = startIndex + MOVIES_PER_PAGE
  const currentMovies = filteredMovies.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, genre, sortBy])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="page-wrapper movie-list-page">

      <Container className="py-4">
        
        <div className="search-filter-section mb-4 animate-fade-in-up">
          
          <div className={`advanced-search-bar p-1 rounded-4 mb-3 ${searchFocus ? 'search-focused' : ''}`}>
            <div className="search-wrapper d-flex align-items-center p-2">
              <div className="search-icon-wrapper me-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={searchFocus ? 'search-icon-active' : ''}>
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </div>
              <input
                ref={searchInputRef}
                type="text"
                className="modern-search-input flex-grow-1"
                placeholder="Tìm kiếm phim, đạo diễn, thể loại..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => setSearchFocus(true)}
                onBlur={() => setSearchFocus(false)}
              />
              {search && (
                <button
                  className="clear-search-btn ms-2"
                  onClick={() => { setSearch(''); searchInputRef.current?.focus() }}
                  title="Xóa tìm kiếm"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18"></path>
                    <path d="m6 6 12 12"></path>
                  </svg>
                </button>
              )}
            </div>
            
            {searchFocus && search && movies && (
              <div className="search-suggestions">
                {(() => {
                  const q = search.toLowerCase()
                  const suggestions = movies.filter(m =>
                    m.title.toLowerCase().includes(q) ||
                    m.director?.toLowerCase().includes(q)
                  ).slice(0, 4)
                  if (suggestions.length === 0) return null
                  return suggestions.map(movie => (
                    <div key={movie.id} className="suggestion-item" onClick={() => setSearch(movie.title)}>
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        className="suggestion-poster"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/48x68?text=No+Image'
                        }}
                      />
                      <span className="suggestion-text">{movie.title}</span>
                      <Badge bg="secondary" className="ms-auto" style={{ fontSize: '0.65rem' }}>{movie.genre}</Badge>
                    </div>
                  ))
                })()}
              </div>
            )}
          </div>

          
          <div className="filter-controls-card rounded-4 p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="filter-tabs d-flex gap-2 flex-wrap">
                {GENRES.map(g => (
                  <button
                    key={g.key}
                    className={`genre-tab-btn ${genre === g.key ? 'active' : ''}`}
                    onClick={() => setGenre(g.key)}
                  >
                    <span className="genre-icon">{g.icon}</span>
                    <span className="genre-label">{g.label}</span>
                  </button>
                ))}
              </div>
              <button
                className="filter-toggle-btn"
                onClick={() => setShowFilters(!showFilters)}
                title={showFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
              </button>
            </div>

            {showFilters && (
              <div className="sort-filter-row d-flex gap-3 align-items-center flex-wrap animate-fade-in-up">
                <div className="sort-control">
                  <label className="filter-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1">
                      <path d="m3 6 7 4-7 4"></path>
                      <path d="M21 6v6"></path>
                      <path d="M21 18v-6"></path>
                    </svg>
                    Sắp xếp:
                  </label>
                  <div className="custom-select-wrapper">
                    <select
                      className="modern-select"
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value)}
                    >
                      {SORT_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                
                {(search || genre !== 'all') && (
                  <div className="active-filters d-flex gap-2 align-items-center flex-wrap ms-auto">
                    <span className="filter-info-text text-muted">Bộ lọc đang áp dụng:</span>
                    {search && (
                      <Badge className="active-filter-badge" bg="primary">
                        🔍 "{search}"
                        <button className="filter-badge-remove" onClick={() => setSearch('')}>×</button>
                      </Badge>
                    )}
                    {genre !== 'all' && (
                      <Badge className="active-filter-badge" bg="primary">
                        🎬 {GENRES.find(g => g.key === genre)?.label}
                        <button className="filter-badge-remove" onClick={() => setGenre('all')}>×</button>
                      </Badge>
                    )}
                    <button className="clear-all-filters" onClick={() => { setSearch(''); setGenre('all'); setSortBy('default') }}>
                      Xóa tất cả
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        
        <div className="results-info mb-4 animate-fade-in-up">
          {!loading && (
            <div className="results-count-badge">
              <span className="results-icon">🎞️</span>
              <span className="results-text">
                Tìm thấy <strong className="results-number">{filteredMovies.length}</strong> phim
                {totalPages > 1 && (
                  <span className="pagination-info"> • Trang {currentPage}/{totalPages}</span>
                )}
              </span>
              {search && <span className="results-query">cho "<strong>{search}</strong>"</span>}
            </div>
          )}
        </div>

        
        {loading ? (
          <MovieGridSkeleton count={8} />
        ) : error ? (
          <Alert variant="danger" className="animate-fade-in-up">Lỗi tải dữ liệu: {error}</Alert>
        ) : filteredMovies.length === 0 ? (
          <div className="text-center py-5 animate-fade-in-up">
            <div style={{ fontSize: 60, animation: 'float 3s ease-in-out infinite' }}>🎭</div>
            <h5 className="mt-3 text-muted">Không tìm thấy phim phù hợp</h5>
            <p className="text-muted mb-3">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            <Button
              variant="link"
              className="text-warning btn-primary-custom"
              onClick={() => { setSearch(''); setGenre('all') }}
            >
              Xóa bộ lọc
            </Button>
          </div>
        ) : (
          <>
            <Row xs={1} sm={2} md={3} lg={4} className="g-4">
              {currentMovies.map((movie, index) => (
                <Col key={movie.id}>
                  <div className="animate-fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                    <MovieCard movie={movie} />
                  </div>
                </Col>
              ))}
            </Row>

            
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-5 animate-fade-in-up">
                <Pagination className="custom-pagination">
                  <Pagination.First
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                  />
                  <Pagination.Prev
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  />

                  
                  {(() => {
                    const pages = []
                    const maxVisiblePages = 5
                    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
                    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

                    if (endPage - startPage + 1 < maxVisiblePages) {
                      startPage = Math.max(1, endPage - maxVisiblePages + 1)
                    }

                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <Pagination.Item
                          key={i}
                          active={i === currentPage}
                          onClick={() => handlePageChange(i)}
                        >
                          {i}
                        </Pagination.Item>
                      )
                    }
                    return pages
                  })()}

                  <Pagination.Next
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  />
                  <Pagination.Last
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                  />
                </Pagination>
              </div>
            )}

            
            {totalPages > 1 && (
              <div className="text-center mt-3 animate-fade-in-up">
                <small className="text-muted">
                  Trang {currentPage} / {totalPages} •
                  Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredMovies.length)} trong {filteredMovies.length} phim
                </small>
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  )
}
