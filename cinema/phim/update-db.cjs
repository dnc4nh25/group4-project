const fs = require('fs')
const db = JSON.parse(fs.readFileSync('./database.json', 'utf8'))

// Thêm 2 suất chiếu trong quá khứ vào mảng showtimes chính
const pastShowtimes = [
  {
    id: 'past-st-1',
    movieId: 1,
    date: '2026-04-05',
    time: '19:00',
    room: 'Phòng 1',
    totalSeats: 100,
    bookedSeats: 35,
    price: 80000,
    bookedSeatNums: ['D3','D4','D5']
  },
  {
    id: 'past-st-2',
    movieId: 3,
    date: '2026-04-06',
    time: '20:00',
    room: 'Phòng 2',
    totalSeats: 80,
    bookedSeats: 22,
    price: 90000,
    bookedSeatNums: ['E5','E6']
  }
]

// Chỉ thêm nếu chưa có
if (!db.showtimes.find(s => s.id === 'past-st-1')) {
  db.showtimes.push(...pastShowtimes)
  console.log('✅ Thêm 2 suất chiếu quá khứ')
}

// Thêm bookings quá khứ
const pastBookings = [
  {
    id: 'past-booking-1',
    userId: '2',
    showtimeId: 'past-st-1',
    seats: 2,
    seatNums: ['D3', 'D4'],
    totalPrice: 160000,
    createdAt: '2026-04-05',
    status: 'confirmed'
  },
  {
    id: 'past-booking-2',
    userId: '3',
    showtimeId: 'past-st-2',
    seats: 2,
    seatNums: ['E5', 'E6'],
    totalPrice: 180000,
    createdAt: '2026-04-06',
    status: 'confirmed'
  },
  {
    id: 'past-booking-3',
    userId: 'GvoVeP5fAEs',
    showtimeId: 'past-st-1',
    seats: 1,
    seatNums: ['D5'],
    totalPrice: 80000,
    createdAt: '2026-04-05',
    status: 'confirmed'
  }
]

if (!db.bookings.find(b => b.id === 'past-booking-1')) {
  db.bookings.push(...pastBookings)
  console.log('✅ Thêm 3 booking quá khứ')
}

// Thêm reviews collection nếu chưa có
if (!db.reviews) {
  db.reviews = [
    {
      id: 'review-sample-1',
      movieId: '1',
      userId: '3',
      rating: 5,
      comment: 'Một bộ phim siêu phẩm! Cảnh chiến đấu cuối cùng rất hoành tráng và đầy cảm xúc.',
      createdAt: '2026-04-06'
    }
  ]
  console.log('✅ Thêm reviews collection')
}

fs.writeFileSync('./database.json', JSON.stringify(db, null, 2))
console.log('✅ database.json đã được cập nhật!')
