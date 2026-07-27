package com.example.backend.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckoutRequest {
    private Long userId;
    private Long showtimeId;
    private String seatNums;        // JSON array string ["A1","A2"]
    private Long subtotal;          // Giá gốc
    private String voucherCode;     // null nếu không dùng voucher
    private String paymentMethod;   // "QR", "CARD", "CASH"
}
