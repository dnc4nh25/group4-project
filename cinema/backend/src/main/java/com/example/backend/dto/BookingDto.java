package com.example.backend.dto;

import com.example.backend.enums.BookingStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingDto {
    private Long id;
    private Long userId;
    private Long showtimeId;
    private String seatNums;
    private Long totalPrice;
    private Long originalPrice;
    private Long discount;
    private String voucherCode;
    private BookingStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime cancelledAt;
}
