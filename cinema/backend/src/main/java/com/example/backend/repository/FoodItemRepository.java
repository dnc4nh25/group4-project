package com.example.backend.repository;

import com.example.backend.entity.FoodItem;
import com.example.backend.enums.FoodCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FoodItemRepository extends JpaRepository<FoodItem, Long> {
    List<FoodItem> findByIsAvailableTrue();
    List<FoodItem> findByCategory(FoodCategory category);
    List<FoodItem> findByIsAvailableTrueAndCategory(FoodCategory category);
    List<FoodItem> findByStockLessThan(Integer threshold);
    List<FoodItem> findByIsFeaturedTrue();
}
