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

  const isBooked   = (id) => bookedSeatNums.includes(id)
  const isSelected = (id) => selectedSeats.includes(id)

  const handleClick = (id) => {
    if (isBooked(id)) return
    if (!isSelected(id) && maxSelect && selectedSeats.length >= maxSelect) return
    onToggleSeat(id)
  }

  return (
    <div className="seat-map-wrapper">
      
      <div className="screen-bar">
        <span>MÀN HÌNH</span>
      </div>

      
      <div className="seat-grid">
        {rows.map(({ label, seats }) => (
          <div key={label} className="seat-row">
            <span className="row-label">{label}</span>
            <div className="seats-in-row">
              {seats.map((seatId, idx) => {
                const booked   = isBooked(seatId)
                const selected = isSelected(seatId)
                const unavailable = booked || selected
                return (
                  <button
                    key={seatId}
                    className={`seat-btn ${unavailable ? 'seat-booked' : 'seat-available'}`}
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
        <div className="legend-item"><span className="legend-dot seat-available-dot"></span> Còn trống (click để chọn)</div>
        <div className="legend-item"><span className="legend-dot seat-booked-dot"></span> Đã đặt / Đang chọn</div>
      </div>
    </div>
  )
}
