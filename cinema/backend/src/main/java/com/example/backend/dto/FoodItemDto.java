package com.example.backend.dto;

import com.example.backend.enums.FoodCategory;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FoodItemDto {
    private Long id;
    private String name;
    private FoodCategory category;
    private String description;
    private String imageUrl;
    private Long basePrice;
    private List<FoodItemSizeDto> sizes;
    private Integer stock;
    private Boolean isAvailable;
    private Boolean isFeatured;
    private String tag;
    private LocalDateTime createdAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FoodItemSizeDto {
        private String label;
        private Long price;
    }
}
