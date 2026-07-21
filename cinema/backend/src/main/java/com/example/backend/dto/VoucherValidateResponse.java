package com.example.backend.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoucherValidateResponse {
    private boolean valid;
    private String message;
    private Long discountAmount;
    private Long finalTotal;
    // Voucher info nếu valid
    private Long voucherId;
    private String voucherCode;
    private String voucherTitle;
}
