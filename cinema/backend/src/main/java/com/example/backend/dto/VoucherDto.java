package com.example.backend.dto;

import com.example.backend.enums.VoucherType;
import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoucherDto {
    private Long id;
    private String code;
    private String title;
    private String description;
    private VoucherType type;
    private Double value;
    private Long minOrderValue;
    private Integer minSeats;
    private Long maxDiscount;
    private Integer usageLimit;
    private Integer usedCount;
    private Boolean newUsersOnly;
    private Boolean oneTimePerUser;
    private Integer daysAfterRegistration;
    private Boolean weekendOnly;
    private LocalDate validFrom;
    private LocalDate validTo;
    private Boolean isActive;
}
