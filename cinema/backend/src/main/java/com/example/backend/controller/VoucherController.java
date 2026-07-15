package com.example.backend.controller;

import com.example.backend.dto.VoucherDto;
import com.example.backend.entity.Voucher;
import com.example.backend.repository.VoucherRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "/api/vouchers", produces = MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8")
@CrossOrigin(origins = "*")
public class VoucherController {

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
    public ResponseEntity<VoucherDto> createVoucher(@RequestBody VoucherDto voucherDto) {
        Voucher voucher = convertToEntity(voucherDto);
        Voucher saved = voucherRepository.save(voucher);
        return ResponseEntity.ok(convertToDto(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VoucherDto> updateVoucher(@PathVariable Long id, @RequestBody VoucherDto voucherDto) {
        return voucherRepository.findById(id)
                .map(existingVoucher -> {
                    updateEntityFromDto(existingVoucher, voucherDto);
                    Voucher updated = voucherRepository.save(existingVoucher);
                    return ResponseEntity.ok(convertToDto(updated));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}")
    public ResponseEntity<VoucherDto> patchVoucher(@PathVariable Long id, @RequestBody VoucherDto voucherDto) {
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
