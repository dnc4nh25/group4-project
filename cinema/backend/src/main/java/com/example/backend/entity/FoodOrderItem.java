package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "food_order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FoodOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "food_order_id", nullable = false)
    private FoodOrder foodOrder;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "food_item_id", nullable = false)
    private FoodItem foodItem;

    // Size đã chọn (M/L/XL), null nếu không có size
    @Column(name = "size_label", length = 10, columnDefinition = "NVARCHAR(10)")
    private String sizeLabel;

    @Column(nullable = false)
    private Integer quantity;

    // Giá tại thời điểm đặt (snapshot để không bị ảnh hưởng nếu admin sửa giá sau)
    @Column(name = "unit_price", nullable = false)
    private Long unitPrice;
}
