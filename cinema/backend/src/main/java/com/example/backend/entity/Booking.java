package com.example.backend.entity;

import com.example.backend.enums.BookingStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Người đặt vé
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Suất chiếu
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "showtime_id", nullable = false)
    private Showtime showtime;



    // Danh sách mã ghế: ["A1","A2"...] lưu dạng JSON string
    @Column(name = "seat_nums", columnDefinition = "NVARCHAR(MAX)")
    private String seatNums;

    // Tổng tiền sau giảm giá
    @Column(name = "total_price", nullable = false)
    private Long totalPrice;

    // Giá gốc trước giảm
    @Column(name = "original_price")
    private Long originalPrice;

    // Số tiền được giảm
    @Builder.Default
    private Long discount = 0L;

    // Mã voucher đã dùng (nếu có)
    @Column(name = "voucher_code", length = 50, columnDefinition = "NVARCHAR(50)")
    private String voucherCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BookingStatus status = BookingStatus.CONFIRMED;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;
}
