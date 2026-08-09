package com.example.backend.repository;

import com.example.backend.entity.FoodOrder;
import com.example.backend.enums.FoodOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FoodOrderRepository extends JpaRepository<FoodOrder, Long> {
    List<FoodOrder> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<FoodOrder> findByStatusOrderByCreatedAtDesc(FoodOrderStatus status);
    Optional<FoodOrder> findByOrderCode(String orderCode);
    List<FoodOrder> findAllByOrderByCreatedAtDesc();

    // Lấy các đơn F&B chưa gửi mail nhắc nhở, chưa hủy, theo ngày lấy đồ
    @Query("SELECT fo FROM FoodOrder fo WHERE fo.status NOT IN ('CANCELLED', 'COMPLETED') " +
           "AND (fo.reminderSent = false OR fo.reminderSent IS NULL) " +
           "AND fo.pickupDate = :date")
    List<FoodOrder> findFoodOrdersForReminderByDate(@Param("date") LocalDate date);
}
