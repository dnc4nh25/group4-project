package com.example.backend.dto;

import com.example.backend.enums.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MyBookingResponse {
    private Long id;
    private String movieName;
    private String moviePoster;
    private String theaterName;
    private String roomName;
    private LocalDate showDate;
    private LocalTime showTime;
    private String seatNums;
    private Long totalPrice;
    private Long originalPrice;
    private Long discount;
    private String voucherCode;
    private BookingStatus status;
    private LocalDateTime createdAt;
}
