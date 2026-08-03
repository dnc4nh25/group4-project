package com.example.backend.repository;

import com.example.backend.entity.FoodOrder;
import com.example.backend.enums.FoodOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FoodOrderRepository extends JpaRepository<FoodOrder, Long> {
    List<FoodOrder> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<FoodOrder> findByStatusOrderByCreatedAtDesc(FoodOrderStatus status);
    Optional<FoodOrder> findByOrderCode(String orderCode);
    List<FoodOrder> findAllByOrderByCreatedAtDesc();
}
