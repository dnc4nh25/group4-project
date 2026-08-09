package com.example.backend.entity;

import com.example.backend.enums.FoodOrderStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "food_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FoodOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Mã đơn hàng: FO-20260802-00001
    @Column(name = "order_code", unique = true, length = 30, columnDefinition = "NVARCHAR(30)")
    private String orderCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToMany(mappedBy = "foodOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<FoodOrderItem> items = new ArrayList<>();

    @Column(name = "total_amount", nullable = false)
    private Long totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private FoodOrderStatus status = FoodOrderStatus.PENDING;

    @Column(name = "points_used")
    @Builder.Default
    private Long pointsUsed = 0L;

    // Ngày lấy đồ
    @Column(name = "pickup_date")
    private LocalDate pickupDate;

    // Giờ lấy: "14:00"
    @Column(name = "pickup_time", length = 5, columnDefinition = "NVARCHAR(5)")
    private String pickupTime;

    @Column(name = "payment_method", length = 20, columnDefinition = "NVARCHAR(20)")
    private String paymentMethod;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    // Trạng thái đã gửi email nhắc nhở lấy đồ hay chưa
    @Column(name = "reminder_sent")
    @Builder.Default
    private Boolean reminderSent = false;
}
