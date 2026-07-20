# 🗑️ Sửa lỗi không thể xóa xuất chiếu

## 📋 Vấn đề

Admin không thể xóa xuất chiếu trong trang quản lý xuất chiếu.

### Nguyên nhân:
**Foreign Key Constraint Violation** - Database có ràng buộc khóa ngoại:
- Bảng `bookings` có cột `showtime_id` tham chiếu đến bảng `showtimes`
- Khi có booking nào tham chiếu đến showtime, không thể xóa showtime đó
- Backend trả về lỗi 500 Internal Server Error
- Frontend chỉ hiển thị "Xóa thất bại" không rõ nguyên nhân

---

## ✅ Giải pháp đã thực hiện

### 1. **Backend: Thêm validation trước khi xóa**

#### File: `BookingRepository.java`
Thêm 2 phương thức query:

```java
@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserId(Long userId);
    List<Booking> findByShowtimeId(Long showtimeId);      // ✅ Mới
    boolean existsByShowtimeId(Long showtimeId);          // ✅ Mới
}
```

#### File: `ShowtimeController.java`

**Thêm dependency injection:**
```java
@Autowired
private com.example.backend.repository.BookingRepository bookingRepository;
```

**Cập nhật endpoint DELETE:**
```java
@DeleteMapping("/{id}")
public ResponseEntity<?> deleteShowtime(@PathVariable Long id) {
    if (!showtimeRepository.existsById(id)) {
        return ResponseEntity.notFound().build();
    }
    
    // ✅ Check if there are any bookings for this showtime
    boolean hasBookings = bookingRepository.existsByShowtimeId(id);
    if (hasBookings) {
        return ResponseEntity.badRequest()
            .body(Map.of(
                "error", "Không thể xóa suất chiếu này vì đã có người đặt vé",
                "message", "Suất chiếu đã có booking không thể xóa"
            ));
    }
    
    showtimeRepository.deleteById(id);
    return ResponseEntity.ok().build();
}
```

**Logic:**
1. Kiểm tra showtime có tồn tại không
2. Kiểm tra showtime có booking nào không (`existsByShowtimeId`)
3. Nếu có booking → Trả về 400 Bad Request với message rõ ràng
4. Nếu không có booking → Xóa thành công

---

### 2. **Frontend: Cải thiện UX và hiển thị lỗi**

#### File: `AdminShowtimesPage.jsx`

**Thêm state để track số booking:**
```javascript
const [bookingCounts, setBookingCounts] = useState({})
```

**Load bookings khi load trang:**
```javascript
const load = async () => {
  setLoading(true)
  try {
    const [stRes, mvRes, bookingsRes] = await Promise.all([
      axios.get('http://localhost:8080/api/showtimes'),
      axios.get('http://localhost:8080/api/movies'),
      axios.get('http://localhost:8080/api/bookings')  // ✅ Mới
    ])
    setShowtimes(stRes.data)
    setMovies(mvRes.data)
    
    // ✅ Count bookings per showtime
    const counts = {}
    bookingsRes.data.forEach(booking => {
      counts[booking.showtimeId] = (counts[booking.showtimeId] || 0) + 1
    })
    setBookingCounts(counts)
  } catch { setError('Lỗi tải dữ liệu') }
  finally { setLoading(false) }
}
```

**Cải thiện error handling:**
```javascript
const handleConfirmDelete = async () => {
  try {
    await axios.delete(`http://localhost:8080/api/showtimes/${deletingId}`)
    setShowDeleteConfirm(false)
    load()
  } catch (err) {
    setShowDeleteConfirm(false)
    
    // ✅ Display specific error message
    if (err.response?.data?.error) {
      setError(`❌ ${err.response.data.error}`)
    } else if (err.response?.status === 400) {
      setError('❌ Không thể xóa suất chiếu này vì đã có người đặt vé.')
    } else {
      setError('❌ Xóa thất bại. Vui lòng thử lại.')
    }
  }
}
```

**Hiển thị icon khóa cho suất chiếu có booking:**
```javascript
<Button 
  size="sm" 
  variant="outline-danger" 
  className="action-btn"
  onClick={() => handleDeleteClick(st.id)}
  title={bookingCounts[st.id] > 0 
    ? `Có ${bookingCounts[st.id]} vé đã đặt - Không thể xóa` 
    : 'Xóa'
  }
>
  {bookingCounts[st.id] > 0 ? '🔒' : '🗑️'}
</Button>
```

**Cải thiện modal xác nhận xóa:**
```javascript
<Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
  <Modal.Header closeButton>
    <Modal.Title>🗑️ Xác nhận xóa suất chiếu</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {deletingId && (() => {
      const showtime = showtimes.find(st => st.id === deletingId)
      const bookingCount = bookingCounts[deletingId] || 0
      
      return (
        <div>
          {bookingCount > 0 ? (
            <Alert variant="warning" className="mb-3">
              <strong>⚠️ Cảnh báo:</strong> Suất chiếu này đã có 
              <strong>{bookingCount} vé</strong> được đặt. Không thể xóa!
            </Alert>
          ) : (
            <p>Bạn có chắc chắn muốn xóa suất chiếu này?</p>
          )}
          
          {/* Display showtime info */}
          {showtime && (
            <div className="mt-3 p-3 bg-dark bg-opacity-25 rounded">
              <div><strong>Phim:</strong> {getMovieTitle(showtime.movieId)}</div>
              <div><strong>Ngày giờ:</strong> {showtime.date} {showtime.time}</div>
              <div><strong>Phòng:</strong> {showtime.room}</div>
              <div><strong>Ghế đã đặt:</strong> {showtime.bookedSeats}/{showtime.totalSeats}</div>
            </div>
          )}
        </div>
      )
    })()}
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
      Hủy
    </Button>
    <Button 
      variant="danger" 
      onClick={handleConfirmDelete}
      disabled={bookingCounts[deletingId] > 0}  // ✅ Disable nếu có booking
    >
      {bookingCounts[deletingId] > 0 ? '🔒 Không thể xóa' : '🗑️ Xác nhận xóa'}
    </Button>
  </Modal.Footer>
</Modal>
```

---

### 3. **Loại bỏ button Copy/Duplicate**

Theo yêu cầu, đã xóa:
- ❌ Button "📋 Sao chép" trong table view
- ❌ Button "📋" trong calendar view  
- ❌ Hàm `handleDuplicate()`

Chỉ giữ lại 2 button:
- ✅ ✏️ Sửa
- ✅ 🗑️ (hoặc 🔒 nếu có booking)

---

## 🎯 User Experience Flow

### Trường hợp 1: Xóa xuất chiếu KHÔNG có booking
1. Admin click nút 🗑️
2. Modal hiển thị thông tin xuất chiếu
3. Nút "Xác nhận xóa" enabled
4. Click xác nhận → Xóa thành công ✅

### Trường hợp 2: Xóa xuất chiếu CÓ booking
1. Admin thấy icon 🔒 thay vì 🗑️
2. Hover vào button → Tooltip: "Có X vé đã đặt - Không thể xóa"
3. Click vào button → Modal mở ra
4. Modal hiển thị:
   - ⚠️ Cảnh báo có X vé đã đặt
   - Thông tin chi tiết xuất chiếu
   - Nút "Không thể xóa" bị **disabled**
5. Admin chỉ có thể click "Hủy" ❌

---

## 🧪 Test Cases

### ✅ Test 1: Xóa xuất chiếu chưa có booking
**Steps:**
1. Tạo xuất chiếu mới (chưa có ai đặt vé)
2. Click nút xóa 🗑️
3. Xác nhận xóa

**Expected:** 
- Xóa thành công
- Xuất chiếu biến mất khỏi danh sách

**Result:** ✅ Pass

---

### ✅ Test 2: Xóa xuất chiếu đã có booking
**Steps:**
1. Tạo xuất chiếu
2. Đặt vé cho xuất chiếu đó (1 hoặc nhiều vé)
3. Quay lại trang admin
4. Thử xóa xuất chiếu

**Expected:**
- Icon button hiển thị 🔒 thay vì 🗑️
- Tooltip hiển thị "Có X vé đã đặt"
- Modal hiển thị cảnh báo
- Nút xóa bị disable
- Không thể xóa

**Result:** ✅ Pass

---

### ✅ Test 3: Backend validation
**Steps:**
1. Gửi DELETE request trực tiếp qua Postman/curl
2. Showtime có booking

**Expected:**
- Response: 400 Bad Request
- Body: `{"error": "Không thể xóa suất chiếu này vì đã có người đặt vé"}`

**Result:** ✅ Pass

---

### ✅ Test 4: Hiển thị số lượng booking
**Steps:**
1. Có xuất chiếu với 5 vé đã đặt
2. Hover vào button xóa

**Expected:**
- Tooltip: "Có 5 vé đã đặt - Không thể xóa"

**Result:** ✅ Pass

---

## 📊 So sánh trước và sau

| Tình huống | Trước khi sửa | Sau khi sửa |
|------------|---------------|-------------|
| Xóa xuất chiếu có booking | ❌ Lỗi 500, "Xóa thất bại" | ✅ Hiển thị 🔒, cảnh báo rõ ràng, disable nút |
| Thông báo lỗi | "Xóa thất bại" (không rõ nguyên nhân) | "Không thể xóa vì đã có X vé được đặt" |
| Modal xác nhận | Thông tin ít | Hiển thị đầy đủ: phim, ngày giờ, số vé |
| Icon button | Luôn là 🗑️ | 🗑️ hoặc 🔒 tùy tình huống |
| Backend validation | Không có | Kiểm tra booking trước khi xóa |

---

## 🔐 Database Integrity

### Foreign Key Constraint được giữ nguyên:
```sql
ALTER TABLE bookings 
ADD CONSTRAINT fk_booking_showtime 
FOREIGN KEY (showtime_id) REFERENCES showtimes(id);
```

**Lý do giữ constraint:**
- ✅ Đảm bảo data integrity
- ✅ Tránh orphan records (booking không có showtime)
- ✅ Business logic đúng: không xóa được suất chiếu đã bán vé

**Không sử dụng CASCADE DELETE vì:**
- ❌ Nguy hiểm: Xóa showtime sẽ xóa luôn tất cả booking
- ❌ Mất dữ liệu lịch sử đặt vé
- ❌ Không phù hợp với business requirement

---

## 🚀 Cải tiến tương lai

### 1. Soft Delete
Thay vì xóa hẳn, đánh dấu `deleted = true`:
```java
@Column(name = "deleted")
private Boolean deleted = false;
```

**Lợi ích:**
- Giữ lại lịch sử
- Có thể khôi phục
- Báo cáo chính xác hơn

### 2. Batch Operations
Cho phép xóa nhiều xuất chiếu cùng lúc:
```javascript
const handleBatchDelete = async (ids) => {
  // Chỉ xóa các showtime không có booking
  const deletableIds = ids.filter(id => !bookingCounts[id])
  // ...
}
```

### 3. Archive Feature
Di chuyển xuất chiếu cũ vào archive thay vì xóa:
- Xuất chiếu đã qua + đã có booking → Archive
- Admin vẫn xem được trong mục "Lịch sử"

### 4. Real-time Updates
WebSocket để update số lượng booking real-time:
- Admin thấy ngay khi có booking mới
- Icon 🗑️ → 🔒 ngay lập tức

---

## 📂 Files đã thay đổi

### Backend:
1. ✏️ `BookingRepository.java` - Thêm 2 query methods
2. ✏️ `ShowtimeController.java` - Cập nhật DELETE endpoint với validation

### Frontend:
1. ✏️ `AdminShowtimesPage.jsx`:
   - Thêm state `bookingCounts`
   - Load bookings trong `load()`
   - Cải thiện `handleConfirmDelete()` error handling
   - Cập nhật icon button conditional rendering
   - Cải thiện modal xác nhận xóa
   - ❌ Xóa button Copy và hàm `handleDuplicate()`

---

## 💡 Best Practices áp dụng

### 1. ✅ Defensive Programming
- Validate trên cả backend VÀ frontend
- Frontend: Prevent action (disable button)
- Backend: Final check (business logic)

### 2. ✅ User Feedback
- Icon thay đổi (🗑️ → 🔒)
- Tooltip rõ ràng
- Modal với thông tin đầy đủ
- Error message cụ thể

### 3. ✅ Data Integrity
- Giữ foreign key constraints
- Không cascade delete
- Validate trước khi thao tác

### 4. ✅ Error Handling
- Try-catch ở mọi async operation
- Parse error response từ backend
- Hiển thị error message user-friendly

---

## 📝 API Documentation

### DELETE /api/showtimes/{id}

**Success Response (200 OK):**
```json
{}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Không thể xóa suất chiếu này vì đã có người đặt vé",
  "message": "Suất chiếu đã có booking không thể xóa"
}
```

**Error Response (404 Not Found):**
```json
{}
```

---

**Ngày hoàn thành:** 16/07/2026  
**Người thực hiện:** Kiro AI Assistant  
**Status:** ✅ Completed & Tested
