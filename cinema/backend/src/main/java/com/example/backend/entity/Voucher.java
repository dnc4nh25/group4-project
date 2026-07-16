package com.example.backend.entity;

import com.example.backend.enums.VoucherType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "vouchers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Voucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50, columnDefinition = "NVARCHAR(50)")
    private String code;

    @Column(nullable = false, length = 200, columnDefinition = "NVARCHAR(200)")
    private String title;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String description;

    // PERCENTAGE hoặc FIXED
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VoucherType type;

    // Giá trị giảm: nếu PERCENTAGE thì là %, nếu FIXED thì là VNĐ
    @Column(nullable = false)
    private Double value;

    // Đơn hàng tối thiểu để áp dụng (VNĐ)
    @Column(name = "min_order_value")
    @Builder.Default
    private Long minOrderValue = 0L;

    // Số ghế tối thiểu để áp dụng
    @Column(name = "min_seats")
    @Builder.Default
    private Integer minSeats = 0;

    // Giảm tối đa (VNĐ) - dùng cho PERCENTAGE
    @Column(name = "max_discount")
    private Long maxDiscount;

    // Tổng số lượt có thể dùng
    @Column(name = "usage_limit", nullable = false)
    private Integer usageLimit;

    @Column(name = "used_count")
    @Builder.Default
    private Integer usedCount = 0;

    // --- Các luật giới hạn của Voucher ---
    @Column(name = "new_users_only")
    @Builder.Default
    private Boolean newUsersOnly = false;

    @Column(name = "one_time_per_user")
    @Builder.Default
    private Boolean oneTimePerUser = false;

    @Column(name = "days_after_registration")
    private Integer daysAfterRegistration;

    @Column(name = "weekend_only")
    @Builder.Default
    private Boolean weekendOnly = false;

    @Column(name = "valid_from")
    private LocalDate validFrom;

    @Column(name = "valid_to")
    private LocalDate validTo;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
