const fs = require('fs')
const db = JSON.parse(fs.readFileSync('./database.json', 'utf8'))

function generateBookedSeats(totalSeats, bookedCount) {
  const seatsPerRow = 10
  const numRows = Math.ceil(totalSeats / seatsPerRow)
  const rowLabels = 'ABCDEFGHIJKLMNOP'.split('')
  const allSeats = []
  for (let r = 0; r < numRows; r++) {
    for (let s = 1; s <= seatsPerRow; s++) {
      const seatNum = r * seatsPerRow + s
      if (seatNum <= totalSeats) allSeats.push(rowLabels[r] + s)
    }
  }
  const middle = Math.floor(allSeats.length / 2)
  const start = Math.max(0, middle - Math.floor(bookedCount / 2))
  return allSeats.slice(start, start + bookedCount)
}

db.showtimes = db.showtimes.map(st => ({
  ...st,
  bookedSeatNums: generateBookedSeats(st.totalSeats, st.bookedSeats)
}))

fs.writeFileSync('./database.json', JSON.stringify(db, null, 2))
console.log('Done! Added bookedSeatNums to', db.showtimes.length, 'showtimes.')
