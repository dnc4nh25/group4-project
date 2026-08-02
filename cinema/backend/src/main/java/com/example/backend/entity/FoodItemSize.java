package com.example.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
public class FoodItemSize {

    @Column(name = "size_label", length = 10, columnDefinition = "NVARCHAR(10)")
    private String label; // M, L, XL

    @Column(name = "size_price")
    private Long price;
}
