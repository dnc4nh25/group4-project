// Script: thêm bookedSeatNums vào tất cả showtimes trong database.json
const fs = require('fs')
const db = JSON.parse(fs.readFileSync('./database.json', 'utf8'))

function generateBookedSeats(totalSeats, bookedCount) {
  const seatsPerRow = 10
  const numRows = Math.ceil(totalSeats / seatsPerRow)
  const rowLabels = 'ABCDEFGHIJKLMNOP'.split('')

  // Tạo tất cả ghế
  const allSeats = []
  for (let r = 0; r < numRows; r++) {
    for (let s = 1; s <= seatsPerRow; s++) {
      const seatNum = r * seatsPerRow + s
      if (seatNum <= totalSeats) {
        allSeats.push(rowLabels[r] + s)
      }
    }
  }

  // Lấy ghế ở giữa rạp (thực tế người dùng hay chọn giữa)
  const middle = Math.floor(allSeats.length / 2)
  const start = Math.max(0, middle - Math.floor(bookedCount / 2))
  return allSeats.slice(start, start + bookedCount)
}

// Thêm bookedSeatNums nếu chưa có
db.showtimes = db.showtimes.map(st => {
  if (!st.bookedSeatNums || st.bookedSeatNums.length !== st.bookedSeats) {
    return {
      ...st,
      bookedSeatNums: generateBookedSeats(st.totalSeats, st.bookedSeats)
    }
  }
  return st
})

fs.writeFileSync('./database.json', JSON.stringify(db, null, 2))
console.log('✅ Đã thêm bookedSeatNums cho', db.showtimes.length, 'suất chiếu!')
