package com.example.backend.controller;

import com.example.backend.dto.FoodItemDto;
import com.example.backend.entity.FoodItem;
import com.example.backend.entity.FoodItemSize;
import com.example.backend.enums.FoodCategory;
import com.example.backend.repository.FoodItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "/api/food-items", produces = MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8")
@CrossOrigin(origins = "*")
public class FoodItemController {

    @Autowired
    private FoodItemRepository foodItemRepository;

    // ─── GET ALL ────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<FoodItemDto>> getAllItems() {
        List<FoodItemDto> items = foodItemRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(items);
    }

    // ─── GET AVAILABLE (cho user) ────────────────────────────
    @GetMapping("/available")
    public ResponseEntity<List<FoodItemDto>> getAvailableItems() {
        List<FoodItemDto> items = foodItemRepository.findByIsAvailableTrue().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(items);
    }

    // ─── GET BY ID ───────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<FoodItemDto> getItemById(@PathVariable Long id) {
        return foodItemRepository.findById(id)
                .map(item -> ResponseEntity.ok(convertToDto(item)))
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── CREATE (Admin) ──────────────────────────────────────
    @PostMapping
    public ResponseEntity<?> createItem(@RequestBody FoodItemDto dto) {
        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Tên sản phẩm không được để trống");
        }
        if (dto.getBasePrice() == null || dto.getBasePrice() < 0) {
            return ResponseEntity.badRequest().body("Giá không hợp lệ");
        }
        FoodItem item = convertToEntity(dto);
        item.setCreatedAt(LocalDateTime.now());
        FoodItem saved = foodItemRepository.save(item);
        return ResponseEntity.ok(convertToDto(saved));
    }

    // ─── UPDATE (Admin) ──────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<?> updateItem(@PathVariable Long id, @RequestBody FoodItemDto dto) {
        return foodItemRepository.findById(id)
                .map(existing -> {
                    if (dto.getName() != null) existing.setName(dto.getName().trim());
                    if (dto.getCategory() != null) existing.setCategory(dto.getCategory());
                    if (dto.getDescription() != null) existing.setDescription(dto.getDescription());
                    if (dto.getImageUrl() != null) existing.setImageUrl(dto.getImageUrl());
                    if (dto.getBasePrice() != null) existing.setBasePrice(dto.getBasePrice());
                    if (dto.getStock() != null) existing.setStock(dto.getStock());
                    if (dto.getIsAvailable() != null) existing.setIsAvailable(dto.getIsAvailable());
                    if (dto.getIsFeatured() != null) existing.setIsFeatured(dto.getIsFeatured());
                    if (dto.getTag() != null) existing.setTag(dto.getTag());
                    if (dto.getSizes() != null) {
                        existing.getSizes().clear();
                        existing.getSizes().addAll(sizeDtosToEntities(dto.getSizes()));
                    }
                    FoodItem updated = foodItemRepository.save(existing);
                    return ResponseEntity.ok(convertToDto(updated));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── TOGGLE isAvailable (Admin) ──────────────────────────
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<?> toggleAvailability(@PathVariable Long id) {
        return foodItemRepository.findById(id)
                .map(item -> {
                    item.setIsAvailable(!Boolean.TRUE.equals(item.getIsAvailable()));
                    foodItemRepository.save(item);
                    return ResponseEntity.ok(Map.of(
                            "id", item.getId(),
                            "isAvailable", item.getIsAvailable()
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── RESTOCK (Admin) ─────────────────────────────────────
    @PatchMapping("/{id}/restock")
    public ResponseEntity<?> restock(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        Integer qty = body.get("quantity");
        if (qty == null || qty <= 0) {
            return ResponseEntity.badRequest().body("Số lượng nhập kho phải > 0");
        }
        return foodItemRepository.findById(id)
                .map(item -> {
                    item.setStock(item.getStock() + qty);
                    // Nếu trước đó hết hàng → tự bật lại
                    if (Boolean.FALSE.equals(item.getIsAvailable()) && item.getStock() > 0) {
                        item.setIsAvailable(true);
                    }
                    foodItemRepository.save(item);
                    return ResponseEntity.ok(Map.of(
                            "id", item.getId(),
                            "stock", item.getStock(),
                            "isAvailable", item.getIsAvailable()
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── DELETE (Admin) ──────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        if (foodItemRepository.existsById(id)) {
            foodItemRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    // ─── HELPERS ─────────────────────────────────────────────
    private FoodItemDto convertToDto(FoodItem item) {
        List<FoodItemDto.FoodItemSizeDto> sizeDtos = item.getSizes() == null ? new ArrayList<>() :
                item.getSizes().stream()
                        .map(s -> new FoodItemDto.FoodItemSizeDto(s.getLabel(), s.getPrice()))
                        .collect(Collectors.toList());
        return FoodItemDto.builder()
                .id(item.getId())
                .name(item.getName())
                .category(item.getCategory())
                .description(item.getDescription())
                .imageUrl(item.getImageUrl())
                .basePrice(item.getBasePrice())
                .sizes(sizeDtos)
                .stock(item.getStock())
                .isAvailable(item.getIsAvailable())
                .isFeatured(item.getIsFeatured())
                .tag(item.getTag())
                .createdAt(item.getCreatedAt())
                .build();
    }

    private FoodItem convertToEntity(FoodItemDto dto) {
        FoodItem item = FoodItem.builder()
                .name(dto.getName().trim())
                .category(dto.getCategory())
                .description(dto.getDescription())
                .imageUrl(dto.getImageUrl())
                .basePrice(dto.getBasePrice())
                .stock(dto.getStock() != null ? dto.getStock() : 0)
                .isAvailable(dto.getIsAvailable() != null ? dto.getIsAvailable() : true)
                .isFeatured(dto.getIsFeatured() != null ? dto.getIsFeatured() : false)
                .tag(dto.getTag())
                .build();
        if (dto.getSizes() != null) {
            item.getSizes().addAll(sizeDtosToEntities(dto.getSizes()));
        }
        return item;
    }

    private List<FoodItemSize> sizeDtosToEntities(List<FoodItemDto.FoodItemSizeDto> dtos) {
        return dtos.stream().map(s -> {
            FoodItemSize size = new FoodItemSize();
            size.setLabel(s.getLabel());
            size.setPrice(s.getPrice());
            return size;
        }).collect(Collectors.toList());
    }
}
