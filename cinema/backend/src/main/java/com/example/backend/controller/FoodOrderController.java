package com.example.backend.controller;

import com.example.backend.dto.FoodOrderDto;
import com.example.backend.dto.FoodOrderResponse;
import com.example.backend.entity.*;
import com.example.backend.enums.FoodOrderStatus;
import com.example.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "/api/food-orders", produces = MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8")
@CrossOrigin(origins = "*")
public class FoodOrderController {

    @Autowired
    private FoodOrderRepository foodOrderRepository;

    @Autowired
    private FoodItemRepository foodItemRepository;

    @Autowired
    private UserRepository userRepository;

    // ─── GET ALL (Admin) ─────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<FoodOrderResponse>> getAllOrders() {
        List<FoodOrderResponse> orders = foodOrderRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(orders);
    }

    // ─── GET BY USER ─────────────────────────────────────────
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<FoodOrderResponse>> getOrdersByUser(@PathVariable Long userId) {
        List<FoodOrderResponse> orders = foodOrderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(orders);
    }

    // ─── GET BY ID ───────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<FoodOrderResponse> getOrderById(@PathVariable Long id) {
        return foodOrderRepository.findById(id)
                .map(order -> ResponseEntity.ok(convertToResponse(order)))
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── GET BY ORDER CODE (Admin checkin) ───────────────────
    @GetMapping("/code/{orderCode}")
    public ResponseEntity<?> getByOrderCode(@PathVariable String orderCode) {
        return foodOrderRepository.findByOrderCode(orderCode.toUpperCase())
                .map(order -> ResponseEntity.ok(convertToResponse(order)))
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── CREATE ORDER ────────────────────────────────────────
    @PostMapping
    @Transactional
    public ResponseEntity<?> createOrder(@RequestBody FoodOrderDto dto) {
        // Validate user
        User user = userRepository.findById(dto.getUserId()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("Người dùng không tồn tại");
        }
        if (dto.getItems() == null || dto.getItems().isEmpty()) {
            return ResponseEntity.badRequest().body("Giỏ hàng trống");
        }

        // Validate items & stock
        List<FoodOrderItem> orderItems = new ArrayList<>();
        long totalAmount = 0L;

        for (FoodOrderDto.FoodOrderItemRequest itemReq : dto.getItems()) {
            FoodItem foodItem = foodItemRepository.findById(itemReq.getFoodItemId()).orElse(null);
            if (foodItem == null) {
                return ResponseEntity.badRequest().body("Sản phẩm ID " + itemReq.getFoodItemId() + " không tồn tại");
            }
            if (Boolean.FALSE.equals(foodItem.getIsAvailable())) {
                return ResponseEntity.badRequest().body("Sản phẩm \"" + foodItem.getName() + "\" hiện không có sẵn");
            }
            if (foodItem.getStock() < itemReq.getQuantity()) {
                return ResponseEntity.badRequest().body(
                        "Sản phẩm \"" + foodItem.getName() + "\" chỉ còn " + foodItem.getStock() + " sản phẩm"
                );
            }

            // Tính giá theo size (nếu có)
            long unitPrice = resolvePrice(foodItem, itemReq.getSizeLabel());

            // Trừ stock
            int newStock = foodItem.getStock() - itemReq.getQuantity();
            foodItem.setStock(newStock);
            foodItemRepository.save(foodItem);

            FoodOrderItem orderItem = FoodOrderItem.builder()
                    .foodItem(foodItem)
                    .sizeLabel(itemReq.getSizeLabel())
                    .quantity(itemReq.getQuantity())
                    .unitPrice(unitPrice)
                    .build();
            orderItems.add(orderItem);
            totalAmount += unitPrice * itemReq.getQuantity();
        }

        // Trừ điểm nếu có
        Long pointsUsed = dto.getPointsUsed() != null ? dto.getPointsUsed() : 0L;
        if (pointsUsed > 0) {
            Long currentPoints = user.getPoints() != null ? user.getPoints() : 0L;
            if (currentPoints < pointsUsed) {
                return ResponseEntity.badRequest().body("Số điểm không đủ");
            }
            if (pointsUsed > totalAmount) {
                return ResponseEntity.badRequest().body("Số điểm sử dụng không được lớn hơn tổng tiền");
            }
            user.setPoints(currentPoints - pointsUsed);
            userRepository.save(user);
        }

        // Tạo FoodOrder
        FoodOrder order = FoodOrder.builder()
                .user(user)
                .totalAmount(totalAmount)
                .status(FoodOrderStatus.PENDING)
                .pickupDate(dto.getPickupDate())
                .pickupTime(dto.getPickupTime())
                .paymentMethod(dto.getPaymentMethod())
                .pointsUsed(pointsUsed)
                .createdAt(LocalDateTime.now())
                .build();
        FoodOrder saved = foodOrderRepository.save(order);

        // Sinh orderCode: FO-YYYYMMDD-XXXXX
        String orderCode = "FO-" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE)
                + "-" + String.format("%05d", saved.getId());
        saved.setOrderCode(orderCode);

        // Gắn foodOrder vào items rồi lưu
        for (FoodOrderItem item : orderItems) {
            item.setFoodOrder(saved);
        }
        saved.getItems().addAll(orderItems);
        foodOrderRepository.save(saved);

        return ResponseEntity.ok(convertToResponse(saved));
    }

    // ─── UPDATE STATUS (Admin) ───────────────────────────────
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String statusStr = body.get("status");
        FoodOrderStatus newStatus;
        try {
            newStatus = FoodOrderStatus.valueOf(statusStr);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Trạng thái không hợp lệ: " + statusStr);
        }
        return foodOrderRepository.findById(id)
                .map(order -> {
                    order.setStatus(newStatus);
                    foodOrderRepository.save(order);
                    return ResponseEntity.ok(Map.of("id", order.getId(), "status", order.getStatus()));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── CANCEL (User) ───────────────────────────────────────
    @PatchMapping("/{id}/cancel")
    @Transactional
    public ResponseEntity<?> cancelOrder(@PathVariable Long id) {
        return foodOrderRepository.findById(id)
                .map(order -> {
                    if (order.getStatus() == FoodOrderStatus.CANCELLED) {
                        return ResponseEntity.badRequest().body("Đơn hàng đã hủy trước đó.");
                    }
                    if (order.getStatus() == FoodOrderStatus.COMPLETED || order.getStatus() == FoodOrderStatus.READY) {
                        return ResponseEntity.badRequest().body("Không thể hủy đơn hàng đã hoàn tất hoặc sẵn sàng lấy.");
                    }
                    
                    // Kiểm tra thời gian (không cho hủy trước 1 tiếng)
                    if (order.getPickupDate() != null && order.getPickupTime() != null) {
                        try {
                            java.time.LocalTime pt = java.time.LocalTime.parse(order.getPickupTime());
                            java.time.LocalDateTime pickupDateTime = java.time.LocalDateTime.of(order.getPickupDate(), pt);
                            if (LocalDateTime.now().plusHours(1).isAfter(pickupDateTime)) {
                                return ResponseEntity.badRequest().body("Không thể hủy đơn trước 1 tiếng so với giờ nhận đồ.");
                            }
                        } catch (Exception e) {
                            // Bỏ qua nếu lỗi parse time
                        }
                    }

                    // Hoàn lại stock
                    for (FoodOrderItem item : order.getItems()) {
                        FoodItem foodItem = item.getFoodItem();
                        foodItem.setStock(foodItem.getStock() + item.getQuantity());
                        // Removed auto-enable

                        foodItemRepository.save(foodItem);
                    }
                    order.setStatus(FoodOrderStatus.CANCELLED);
                    foodOrderRepository.save(order);

                    // Hoàn lại điểm
                    if (order.getPointsUsed() != null && order.getPointsUsed() > 0) {
                        User user = order.getUser();
                        Long currentPoints = user.getPoints() != null ? user.getPoints() : 0L;
                        user.setPoints(currentPoints + order.getPointsUsed());
                        userRepository.save(user);
                    }

                    return ResponseEntity.ok().body("Hủy đơn hàng thành công. Đã hoàn lại kho.");
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── HELPERS ─────────────────────────────────────────────
    private long resolvePrice(FoodItem item, String sizeLabel) {
        if (sizeLabel != null && item.getSizes() != null) {
            return item.getSizes().stream()
                    .filter(s -> sizeLabel.equalsIgnoreCase(s.getLabel()))
                    .findFirst()
                    .map(s -> s.getPrice())
                    .orElse(item.getBasePrice());
        }
        return item.getBasePrice();
    }

    private FoodOrderResponse convertToResponse(FoodOrder order) {
        List<FoodOrderResponse.FoodOrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> FoodOrderResponse.FoodOrderItemResponse.builder()
                        .foodItemId(item.getFoodItem().getId())
                        .foodItemName(item.getFoodItem().getName())
                        .foodItemImage(item.getFoodItem().getImageUrl())
                        .sizeLabel(item.getSizeLabel())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .subtotal(item.getUnitPrice() * item.getQuantity())
                        .build())
                .collect(Collectors.toList());

        return FoodOrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .userId(order.getUser().getId())
                .userName(order.getUser().getFullName())
                .items(itemResponses)
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .pickupDate(order.getPickupDate())
                .pickupTime(order.getPickupTime())
                .paymentMethod(order.getPaymentMethod())
                .pointsUsed(order.getPointsUsed())
                .createdAt(order.getCreatedAt())
                .build();
    }
}
