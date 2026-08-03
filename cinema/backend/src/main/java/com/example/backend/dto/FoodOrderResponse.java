package com.example.backend.dto;

import com.example.backend.enums.FoodOrderStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FoodOrderResponse {
    private Long id;
    private String orderCode;
    private Long userId;
    private String userName;
    private List<FoodOrderItemResponse> items;
    private Long totalAmount;
    private FoodOrderStatus status;
    private LocalDate pickupDate;
    private String pickupTime;
    private String paymentMethod;
    private Long pointsUsed;
    private LocalDateTime createdAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FoodOrderItemResponse {
        private Long foodItemId;
        private String foodItemName;
        private String foodItemImage;
        private String sizeLabel;
        private Integer quantity;
        private Long unitPrice;
        private Long subtotal;
    }
}
