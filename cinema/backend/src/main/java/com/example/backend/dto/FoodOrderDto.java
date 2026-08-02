package com.example.backend.dto;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FoodOrderDto {
    private Long userId;
    private List<FoodOrderItemRequest> items;
    private LocalDate pickupDate;
    private String pickupTime;
    private String paymentMethod;
    private Long pointsUsed;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FoodOrderItemRequest {
        private Long foodItemId;
        private String sizeLabel; // null nếu không có size
        private Integer quantity;
    }
}
