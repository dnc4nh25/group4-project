-- Kiểm tra tất cả bookings của suất chiếu cụ thể
-- Thay {SHOWTIME_ID} bằng ID suất chiếu bạn muốn xóa

SELECT 
    id,
    showtime_id,
    user_id,
    status,
    created_at,
    cancelled_at
FROM bookings
WHERE showtime_id = {SHOWTIME_ID};

-- Kiểm tra chỉ bookings CONFIRMED
SELECT COUNT(*) as confirmed_count
FROM bookings
WHERE showtime_id = {SHOWTIME_ID} 
AND status = 'CONFIRMED';

-- Kiểm tra chỉ bookings CANCELLED
SELECT COUNT(*) as cancelled_count
FROM bookings
WHERE showtime_id = {SHOWTIME_ID} 
AND status = 'CANCELLED';
