import { getSeatInfo } from '../utils/seatPricing'

export default function SeatMap({ totalSeats, bookedSeatNums = [], selectedSeats = [], onToggleSeat, maxSelect }) {
  const SEATS_PER_ROW = 10
  const ROW_LABELS = 'ABCDEFGHIJKLMNOP'.split('')
  const numRows = Math.ceil(totalSeats / SEATS_PER_ROW)

  const rows = []
  for (let r = 0; r < numRows; r++) {
    const seats = []
    for (let s = 1; s <= SEATS_PER_ROW; s++) {
      const seatNum = r * SEATS_PER_ROW + s
      if (seatNum <= totalSeats) seats.push(ROW_LABELS[r] + s)
    }
    rows.push({ label: ROW_LABELS[r], seats })
  }

  const isBooked = (id) => bookedSeatNums.includes(id)
  const isSelected = (id) => selectedSeats.includes(id)

  const handleClick = (id) => {
    if (isBooked(id)) return
    if (!isSelected(id) && maxSelect && selectedSeats.length >= maxSelect) return
    onToggleSeat(id)
  }

  return (
    <div className="seat-map-wrapper">

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
        {rows.map(({ label, seats }) => (
          <div key={label} className="seat-row">
            <span className="row-label">{label}</span>
            <div className="seats-in-row">
              {seats.map((seatId, idx) => {
                const booked = isBooked(seatId)
                const selected = isSelected(seatId)
                const seatType = getSeatInfo(seatId, 0).type
                
                let btnClass = `seat-${seatType}`
                if (booked) btnClass = 'seat-booked'
                else if (selected) btnClass = 'seat-selected'

                return (
                  <button
                    key={seatId}
                    className={`seat-btn ${btnClass}`}
                    onClick={() => handleClick(seatId)}
                    disabled={booked}
                    title={booked ? `${seatId} – Đã đặt` : selected ? `${seatId} – Click để bỏ chọn` : `${seatId} – Click để chọn`}
                    style={{ marginLeft: idx === 5 ? '1.5rem' : undefined }}
                  >
                    {seatId}
                  </button>
                )
              })}
            </div>
            <span className="row-label">{label}</span>
          </div>
        ))}
      </div>


      <div className="seat-legend">
        <div className="legend-item"><span className="legend-dot seat-standard-dot"></span> Thường</div>
        <div className="legend-item"><span className="legend-dot seat-vip-dot"></span> VIP</div>
        <div className="legend-item"><span className="legend-dot seat-couple-dot"></span> Đôi</div>
        <div className="legend-item"><span className="legend-dot seat-selected-dot"></span> Đang chọn</div>
        <div className="legend-item"><span className="legend-dot seat-booked-dot"></span> Đã đặt</div>
      </div>
    </div>
  )
}
