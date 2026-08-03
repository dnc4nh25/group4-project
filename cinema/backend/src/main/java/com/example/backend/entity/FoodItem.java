package com.example.backend.entity;

import com.example.backend.enums.FoodCategory;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "food_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FoodItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "NVARCHAR(200)")
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FoodCategory category;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "image_url", columnDefinition = "NVARCHAR(500)")
    private String imageUrl;

    // Giá cơ bản (dùng khi không có sizes, hoặc size đầu tiên)
    @Column(name = "base_price", nullable = false)
    private Long basePrice;

    // Sizes (M/L/XL kèm giá) — bảng food_item_sizes
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "food_item_sizes",
        joinColumns = @JoinColumn(name = "food_item_id")
    )
    @Builder.Default
    private List<FoodItemSize> sizes = new ArrayList<>();

    // Tồn kho
    @Column(nullable = false)
    @Builder.Default
    private Integer stock = 0;

    // Admin có thể toggle on/off, cũng tự off khi stock=0
    @Column(name = "is_available")
    @Builder.Default
    private Boolean isAvailable = true;

    // Hiện trên banner/featured
    @Column(name = "is_featured")
    @Builder.Default
    private Boolean isFeatured = false;

    // Tag: "bestseller", "new", null
    @Column(length = 50, columnDefinition = "NVARCHAR(50)")
    private String tag;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
