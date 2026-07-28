package com.example.backend.controller;

import com.example.backend.dto.VoucherDto;
import com.example.backend.entity.Voucher;
import com.example.backend.enums.VoucherType;
import com.example.backend.repository.VoucherRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "/api/vouchers", produces = MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8")
@CrossOrigin(origins = "*")
public class VoucherController {

    // Số ghế tối đa trong hệ thống (phòng lớn nhất)
    private static final int MAX_SEATS_IN_SYSTEM = 100;

    @Autowired
    private VoucherRepository voucherRepository;

    @GetMapping
    public ResponseEntity<List<VoucherDto>> getAllVouchers() {
        List<VoucherDto> vouchers = voucherRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(vouchers);
    }

    @GetMapping("/active")
    public ResponseEntity<List<VoucherDto>> getActiveVouchers() {
        LocalDate today = LocalDate.now();
        List<VoucherDto> activeVouchers = voucherRepository.findByIsActiveTrue().stream()
                .filter(v -> v.getValidTo() == null || !v.getValidTo().isBefore(today))
                .filter(v -> v.getValidFrom() == null || !v.getValidFrom().isAfter(today))
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(activeVouchers);
    }

    @GetMapping("/{id}")
    public ResponseEntity<VoucherDto> getVoucherById(@PathVariable Long id) {
        return voucherRepository.findById(id)
                .map(voucher -> ResponseEntity.ok(convertToDto(voucher)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<VoucherDto> getVoucherByCode(@PathVariable String code) {
        return voucherRepository.findByCode(code)
                .map(voucher -> ResponseEntity.ok(convertToDto(voucher)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createVoucher(@RequestBody VoucherDto voucherDto) {
        // Validate toàn bộ fields
        Map<String, String> errors = validateVoucher(voucherDto, null);
        if (!errors.isEmpty()) {
            return ResponseEntity.status(422).body(Map.of("errors", errors));
        }

        // Chuẩn hóa code (uppercase, trim)
        voucherDto.setCode(voucherDto.getCode().trim().toUpperCase());

        Voucher voucher = convertToEntity(voucherDto);
        Voucher saved = voucherRepository.save(voucher);
        return ResponseEntity.ok(convertToDto(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateVoucher(@PathVariable Long id, @RequestBody VoucherDto voucherDto) {
        return voucherRepository.findById(id)
                .map(existingVoucher -> {
                    // Validate toàn bộ fields, bỏ qua chính bản ghi đang cập nhật
                    Map<String, String> errors = validateVoucher(voucherDto, id);
                    if (!errors.isEmpty()) {
                        return ResponseEntity.status(422).body(Map.of("errors", errors));
                    }

                    // Chuẩn hóa code
                    if (voucherDto.getCode() != null) {
                        voucherDto.setCode(voucherDto.getCode().trim().toUpperCase());
                    }

                    updateEntityFromDto(existingVoucher, voucherDto);
                    Voucher updated = voucherRepository.save(existingVoucher);
                    return ResponseEntity.ok(convertToDto(updated));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> patchVoucher(@PathVariable Long id, @RequestBody VoucherDto voucherDto) {
        return updateVoucher(id, voucherDto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVoucher(@PathVariable Long id) {
        if (voucherRepository.existsById(id)) {
            voucherRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Validate toàn bộ các trường của VoucherDto.
     *
     * @param dto       Dữ liệu cần validate
     * @param excludeId ID của voucher đang được cập nhật (null khi tạo mới)
     * @return Map field -> thông báo lỗi; rỗng nếu hợp lệ
     */
    private Map<String, String> validateVoucher(VoucherDto dto, Long excludeId) {
        // LinkedHashMap để giữ thứ tự lỗi
        Map<String, String> errors = new LinkedHashMap<>();

        // ── 1. Mã voucher ──
        String code = dto.getCode();
        if (code == null || code.trim().isEmpty()) {
            errors.put("code", "Mã voucher không được để trống.");
        } else {
            code = code.trim();
            if (code.contains(" ")) {
                errors.put("code", "Mã voucher không được chứa khoảng trắng.");
            } else if (!code.matches("^[A-Z0-9]+$")) {
                errors.put("code", "Mã voucher chỉ được chứa chữ cái in hoa (A-Z) và chữ số (0-9).");
            } else if (code.length() < 4) {
                errors.put("code", "Mã voucher phải có ít nhất 4 ký tự.");
            } else if (code.length() > 20) {
                errors.put("code", "Mã voucher không được vượt quá 20 ký tự.");
            } else {
                // Kiểm tra trùng code (không tính chính bản ghi đang cập nhật)
                Optional<Voucher> existing = voucherRepository.findByCode(code.toUpperCase());
                if (existing.isPresent() && (excludeId == null || !existing.get().getId().equals(excludeId))) {
                    errors.put("code", "Mã voucher này đã tồn tại trong hệ thống.");
                }
            }
        }

        // ── 2. Loại giảm giá ──
        if (dto.getType() == null) {
            errors.put("type", "Vui lòng chọn loại giảm giá.");
        }

        // ── 3. Tiêu đề ──
        String title = dto.getTitle();
        if (title == null || title.trim().isEmpty()) {
            errors.put("title", "Tiêu đề voucher không được để trống.");
        } else if (title.trim().length() < 4) {
            errors.put("title", "Tiêu đề voucher phải có ít nhất 4 ký tự.");
        } else if (title.trim().length() > 200) {
            errors.put("title", "Tiêu đề voucher không được vượt quá 200 ký tự.");
        }

        // ── 4. Mô tả ──
        String description = dto.getDescription();
        if (description != null && description.length() > 500) {
            errors.put("description", "Mô tả không được vượt quá 500 ký tự.");
        }

        // ── 5. Giá trị giảm ──
        Double value = dto.getValue();
        if (value == null) {
            errors.put("value", "Giá trị giảm không được để trống.");
        } else if (value <= 0) {
            errors.put("value", "Giá trị giảm phải là số dương lớn hơn 0.");
        } else if (dto.getType() == VoucherType.PERCENTAGE && value > 100) {
            errors.put("value", "Giá trị phần trăm giảm không được vượt quá 100%.");
        }

        // ── 6. Đơn hàng tối thiểu ──
        Long minOrderValue = dto.getMinOrderValue();
        if (minOrderValue != null && minOrderValue < 0) {
            errors.put("minOrderValue", "Đơn hàng tối thiểu không được âm.");
        }

        // ── 7. Số ghế tối thiểu ──
        Integer minSeats = dto.getMinSeats();
        if (minSeats != null) {
            if (minSeats < 0) {
                errors.put("minSeats", "Số ghế tối thiểu không được âm.");
            } else if (minSeats > MAX_SEATS_IN_SYSTEM) {
                errors.put("minSeats", "Số ghế tối thiểu không được lớn hơn " + MAX_SEATS_IN_SYSTEM + " (tổng ghế tối đa hệ thống).");
            }
        }

        // ── 8. Giảm tối đa ──
        Long maxDiscount = dto.getMaxDiscount();
        if (maxDiscount != null) {
            if (maxDiscount < 0) {
                errors.put("maxDiscount", "Giảm tối đa không được âm.");
            } else if (maxDiscount == 0) {
                errors.put("maxDiscount", "Giảm tối đa phải lớn hơn 0 nếu có nhập.");
            } else if (dto.getType() == VoucherType.FIXED && value != null && value > 0 && maxDiscount < value.longValue()) {
                errors.put("maxDiscount", "Giảm tối đa không được nhỏ hơn giá trị giảm cố định.");
            }
        }

        // ── 9. Giới hạn sử dụng ──
        Integer usageLimit = dto.getUsageLimit();
        if (usageLimit == null) {
            errors.put("usageLimit", "Giới hạn sử dụng không được để trống.");
        } else if (usageLimit <= 0) {
            errors.put("usageLimit", "Giới hạn sử dụng phải là số nguyên dương lớn hơn 0.");
        }

        // ── 10 & 11. Ngày bắt đầu và kết thúc ──
        LocalDate today     = LocalDate.now();
        LocalDate validFrom = dto.getValidFrom();
        LocalDate validTo   = dto.getValidTo();

        if (validFrom == null) {
            errors.put("validFrom", "Ngày bắt đầu không được để trống.");
        } else if (validFrom.isBefore(today)) {
            errors.put("validFrom", "Ngày bắt đầu không được là ngày trong quá khứ.");
        }

        if (validTo == null) {
            errors.put("validTo", "Ngày kết thúc không được để trống.");
        }

        if (validFrom != null && validTo != null && !errors.containsKey("validFrom")) {
            if (!validTo.isAfter(validFrom)) {
                errors.put("validTo", "Ngày kết thúc phải sau ngày bắt đầu.");
            }
        }

        // ── 16. Số ngày sau khi đăng ký ──
        Integer daysAfterReg = dto.getDaysAfterRegistration();
        Boolean newUsersOnly = dto.getNewUsersOnly();
        if (Boolean.TRUE.equals(newUsersOnly)) {
            if (daysAfterReg != null && daysAfterReg <= 0) {
                errors.put("daysAfterRegistration", "Số ngày sau khi đăng ký phải là số nguyên dương lớn hơn 0.");
            }
        } else {
            // Nếu không bật newUsersOnly, daysAfterRegistration không có ý nghĩa
            // (không cần validate vì frontend đã disable field này)
        }

        return errors;
    }

    private VoucherDto convertToDto(Voucher voucher) {
        return VoucherDto.builder()
                .id(voucher.getId())
                .code(voucher.getCode())
                .title(voucher.getTitle())
                .description(voucher.getDescription())
                .type(voucher.getType())
                .value(voucher.getValue())
                .minOrderValue(voucher.getMinOrderValue())
                .minSeats(voucher.getMinSeats())
                .maxDiscount(voucher.getMaxDiscount())
                .usageLimit(voucher.getUsageLimit())
                .usedCount(voucher.getUsedCount())
                .newUsersOnly(voucher.getNewUsersOnly())
                .oneTimePerUser(voucher.getOneTimePerUser())
                .daysAfterRegistration(voucher.getDaysAfterRegistration())
                .weekendOnly(voucher.getWeekendOnly())
                .validFrom(voucher.getValidFrom())
                .validTo(voucher.getValidTo())
                .isActive(voucher.getIsActive())
                .build();
    }

    private Voucher convertToEntity(VoucherDto dto) {
        return Voucher.builder()
                .code(dto.getCode())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .type(dto.getType())
                .value(dto.getValue())
                .minOrderValue(dto.getMinOrderValue() != null ? dto.getMinOrderValue() : 0L)
                .minSeats(dto.getMinSeats() != null ? dto.getMinSeats() : 0)
                .maxDiscount(dto.getMaxDiscount())
                .usageLimit(dto.getUsageLimit())
                .usedCount(dto.getUsedCount() != null ? dto.getUsedCount() : 0)
                .newUsersOnly(dto.getNewUsersOnly() != null ? dto.getNewUsersOnly() : false)
                .oneTimePerUser(dto.getOneTimePerUser() != null ? dto.getOneTimePerUser() : false)
                .daysAfterRegistration(dto.getDaysAfterRegistration())
                .weekendOnly(dto.getWeekendOnly() != null ? dto.getWeekendOnly() : false)
                .validFrom(dto.getValidFrom())
                .validTo(dto.getValidTo())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .build();
    }

    private void updateEntityFromDto(Voucher voucher, VoucherDto dto) {
        if (dto.getCode() != null) voucher.setCode(dto.getCode());
        if (dto.getTitle() != null) voucher.setTitle(dto.getTitle());
        if (dto.getDescription() != null) voucher.setDescription(dto.getDescription());
        if (dto.getType() != null) voucher.setType(dto.getType());
        if (dto.getValue() != null) voucher.setValue(dto.getValue());
        if (dto.getMinOrderValue() != null) voucher.setMinOrderValue(dto.getMinOrderValue());
        if (dto.getMinSeats() != null) voucher.setMinSeats(dto.getMinSeats());
        if (dto.getMaxDiscount() != null) voucher.setMaxDiscount(dto.getMaxDiscount());
        if (dto.getUsageLimit() != null) voucher.setUsageLimit(dto.getUsageLimit());
        if (dto.getUsedCount() != null) voucher.setUsedCount(dto.getUsedCount());
        if (dto.getNewUsersOnly() != null) voucher.setNewUsersOnly(dto.getNewUsersOnly());
        if (dto.getOneTimePerUser() != null) voucher.setOneTimePerUser(dto.getOneTimePerUser());
        if (dto.getDaysAfterRegistration() != null) voucher.setDaysAfterRegistration(dto.getDaysAfterRegistration());
        if (dto.getWeekendOnly() != null) voucher.setWeekendOnly(dto.getWeekendOnly());
        if (dto.getValidFrom() != null) voucher.setValidFrom(dto.getValidFrom());
        if (dto.getValidTo() != null) voucher.setValidTo(dto.getValidTo());
        if (dto.getIsActive() != null) voucher.setIsActive(dto.getIsActive());
    }
}
