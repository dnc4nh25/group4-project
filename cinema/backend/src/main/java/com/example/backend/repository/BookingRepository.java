package com.example.backend.repository;

import com.example.backend.entity.Booking;
import com.example.backend.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserId(Long userId);
    List<Booking> findByShowtimeId(Long showtimeId);
    boolean existsByShowtimeId(Long showtimeId);
    
    // Sử dụng query tường minh để tránh lỗi
    @Query("SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END FROM Booking b WHERE b.showtime.id = :showtimeId AND b.status = :status")
    boolean existsByShowtimeIdAndStatus(@Param("showtimeId") Long showtimeId, @Param("status") BookingStatus status);
    
    boolean existsByUserIdAndVoucherCode(Long userId, String voucherCode);
    long countByUserId(Long userId);
}
