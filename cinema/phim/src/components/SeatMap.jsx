import { buildSeatLayout } from '../utils/seatPricing'

export default function SeatMap({ totalSeats, bookedSeatNums = [], selectedSeats = [], onToggleSeat, maxSelect }) {
  const { rows } = buildSeatLayout(totalSeats || 0)

  const isBooked   = (id) => bookedSeatNums.includes(id)
  const isSelected = (id) => selectedSeats.includes(id)

  const handleClickSingle = (seatId) => {
    if (isBooked(seatId)) return
    if (!isSelected(seatId) && maxSelect && selectedSeats.length >= maxSelect) return
    onToggleSeat(seatId)
  }

  const handleClickCouple = (ids) => {
    const anyBooked   = ids.some(id => isBooked(id))
    if (anyBooked) return
    const allSelected = ids.every(id => isSelected(id))
    // Nếu chưa chọn thì cần 2 slot trống
    if (!allSelected && maxSelect && selectedSeats.length + 2 > maxSelect) return
    onToggleSeat(ids) // truyền mảng lên BookingPage
  }

  return (
    <div className="seat-map-wrapper">

      {/* Màn hình */}
      <div className="screen-container" style={{ textAlign: 'center', marginBottom: '3rem', position: 'relative', width: '100%' }}>
        <svg viewBox="0 0 800 120" style={{ width: '100%', maxWidth: '600px', height: 'auto', filter: 'drop-shadow(0px 10px 15px rgba(255,107,53,0.3))' }}>
          <defs>
            <linearGradient id="screenGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ff6b35" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M 50 80 Q 400 -20 750 80 L 750 120 Q 400 20 50 120 Z" fill="url(#screenGlow)" />
          <path d="M 50 80 Q 400 -20 750 80" fill="none" stroke="#ff6b35" strokeWidth="8" strokeLinecap="round" />
          <text x="400" y="60" fill="#fff" fontSize="20" fontWeight="bold" letterSpacing="10" textAnchor="middle" style={{ textShadow: '0 2px 10px rgba(255,107,53,0.8)' }}>
            MÀN HÌNH
          </text>
        </svg>
      </div>

      <div className="seat-grid">
        {rows.map(({ label, seats, type: rowType }) => {
          const isCouple = rowType === 'couple'

          return (
            <div key={label} className="seat-row">
              <span className="row-label">{label}</span>

              <div className="seats-in-row">
                {isCouple
                  ? seats.map((seat) => {
                      const { ids } = seat
                      const anyBooked   = ids.some(id => isBooked(id))
                      const allSelected = ids.every(id => isSelected(id))

                      let btnClass = 'seat-couple'
                      if (anyBooked)    btnClass = 'seat-booked'
                      else if (allSelected) btnClass = 'seat-selected'

                      return (
                        <button
                          key={ids[0]}
                          className={`seat-btn seat-btn-couple ${btnClass}`}
                          onClick={() => handleClickCouple(ids)}
                          disabled={anyBooked}
                          title={
                            anyBooked   ? `${ids.join(' + ')} – Đã đặt` :
                            allSelected ? `${ids.join(' + ')} – Click để bỏ chọn` :
                                          `${ids.join(' + ')} – Ghế Đôi`
                          }
                        >
                          {ids[0]}·{ids[1]}
                        </button>
                      )
                    })
                  : seats.map((seat) => {
                      const seatId  = seat.id
                      const booked  = isBooked(seatId)
                      const selected = isSelected(seatId)

                      let btnClass = `seat-${seat.type}`
                      if (booked)   btnClass = 'seat-booked'
                      else if (selected) btnClass = 'seat-selected'

                      return (
                        <button
                          key={seatId}
                          className={`seat-btn ${btnClass}`}
                          onClick={() => handleClickSingle(seatId)}
                          disabled={booked}
                          title={
                            booked   ? `${seatId} – Đã đặt` :
                            selected ? `${seatId} – Click để bỏ chọn` :
                                       `${seatId} – Click để chọn`
                          }
                        >
                          {seatId}
                        </button>
                      )
                    })
                }
              </div>

              <span className="row-label">{label}</span>
            </div>
          )
        })}
      </div>

      {/* Chú thích */}
      <div className="seat-legend">
        <div className="legend-item"><span className="legend-dot seat-standard-dot"></span> Thường</div>
        <div className="legend-item"><span className="legend-dot seat-vip-dot"></span> VIP</div>
        <div className="legend-item"><span className="legend-dot seat-couple-dot"></span> Ghế Đôi</div>
        <div className="legend-item"><span className="legend-dot seat-selected-dot"></span> Đang chọn</div>
        <div className="legend-item"><span className="legend-dot seat-booked-dot"></span> Đã đặt</div>
      </div>
    </div>
  )
}
