package com.example.backend.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoucherValidateRequest {
    private String voucherCode;
    private Long userId;
    private Long subtotal;
    private Integer seatCount;
}
