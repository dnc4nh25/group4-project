package com.example.backend.controller;

import com.example.backend.dto.*;
import com.example.backend.entity.Booking;
import com.example.backend.entity.Showtime;
import com.example.backend.entity.User;
import com.example.backend.entity.Voucher;
import com.example.backend.enums.BookingStatus;
import com.example.backend.enums.VoucherType;
import com.example.backend.repository.BookingRepository;
import com.example.backend.repository.ShowtimeRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.VoucherRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping(value = "/api/payment", produces = MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8")
@CrossOrigin(origins = "*")
public class PaymentController {

    @Autowired
    private VoucherRepository voucherRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ShowtimeRepository showtimeRepository;

    @Autowired
    private UserRepository userRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Validate voucher code phía backend với đầy đủ business rules.
     * Trả về discount amount đã tính sẵn.
     */
    @PostMapping("/validate-voucher")
    public ResponseEntity<VoucherValidateResponse> validateVoucher(
            @RequestBody VoucherValidateRequest request) {

        if (request.getVoucherCode() == null || request.getVoucherCode().trim().isEmpty()) {
            return ResponseEntity.ok(VoucherValidateResponse.builder()
                    .valid(false).message("Vui lòng nhập mã voucher").build());
        }

        // 1. Tìm voucher
        Voucher voucher = voucherRepository.findByCode(request.getVoucherCode().trim().toUpperCase())
                .orElse(null);
        if (voucher == null) {
            voucher = voucherRepository.findByCode(request.getVoucherCode().trim())
                    .orElse(null);
        }
        if (voucher == null) {
            return ResponseEntity.ok(VoucherValidateResponse.builder()
                    .valid(false)
                    .message("Mã voucher \"" + request.getVoucherCode() + "\" không tồn tại")
                    .build());
        }

        // 2. Kiểm tra kích hoạt
        if (Boolean.FALSE.equals(voucher.getIsActive())) {
            return ResponseEntity.ok(VoucherValidateResponse.builder()
                    .valid(false).message("Voucher này đã bị vô hiệu hóa").build());
        }

        // 3. Kiểm tra ngày hiệu lực
        LocalDate today = LocalDate.now();
        if (voucher.getValidFrom() != null && today.isBefore(voucher.getValidFrom())) {
            return ResponseEntity.ok(VoucherValidateResponse.builder()
                    .valid(false)
                    .message("Voucher chưa đến ngày sử dụng (từ " + voucher.getValidFrom() + ")")
                    .build());
        }
        if (voucher.getValidTo() != null && today.isAfter(voucher.getValidTo())) {
            return ResponseEntity.ok(VoucherValidateResponse.builder()
                    .valid(false).message("Voucher đã hết hạn sử dụng").build());
        }

        // 4. Kiểm tra lượt dùng
        if (voucher.getUsedCount() >= voucher.getUsageLimit()) {
            return ResponseEntity.ok(VoucherValidateResponse.builder()
                    .valid(false).message("Voucher đã hết lượt sử dụng").build());
        }

        // 5. Kiểm tra điều kiện đơn hàng
        long subtotal = request.getSubtotal() != null ? request.getSubtotal() : 0L;
        int seatCount = request.getSeatCount() != null ? request.getSeatCount() : 0;

        if (voucher.getMinOrderValue() != null && voucher.getMinOrderValue() > 0
                && subtotal < voucher.getMinOrderValue()) {
            return ResponseEntity.ok(VoucherValidateResponse.builder()
                    .valid(false)
                    .message("Đơn hàng tối thiểu " + String.format("%,d", voucher.getMinOrderValue()) + "đ để dùng voucher này")
                    .build());
        }
        if (voucher.getMinSeats() != null && voucher.getMinSeats() > 0
                && seatCount < voucher.getMinSeats()) {
            return ResponseEntity.ok(VoucherValidateResponse.builder()
                    .valid(false)
                    .message("Cần mua tối thiểu " + voucher.getMinSeats() + " ghế để dùng voucher này")
                    .build());
        }

        // 6. Kiểm tra giới hạn user (nếu có userId)
        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId()).orElse(null);

            if (user != null) {
                // oneTimePerUser
                if (Boolean.TRUE.equals(voucher.getOneTimePerUser())) {
                    boolean alreadyUsed = bookingRepository.existsByUserIdAndVoucherCode(
                            request.getUserId(), voucher.getCode());
                    if (alreadyUsed) {
                        return ResponseEntity.ok(VoucherValidateResponse.builder()
                                .valid(false).message("Bạn đã sử dụng voucher này rồi").build());
                    }
                }

                // newUsersOnly
                if (Boolean.TRUE.equals(voucher.getNewUsersOnly())) {
                    long daysSinceReg = ChronoUnit.DAYS.between(
                            user.getCreatedAt().toLocalDate(), today);
                    int maxDays = voucher.getDaysAfterRegistration() != null
                            ? voucher.getDaysAfterRegistration() : 7;
                    if (daysSinceReg > maxDays) {
                        return ResponseEntity.ok(VoucherValidateResponse.builder()
                                .valid(false)
                                .message("Voucher chỉ dành cho thành viên mới (trong vòng " + maxDays + " ngày đăng ký)")
                                .build());
                    }
                }
            }
        }

        // 7. Kiểm tra cuối tuần
        if (Boolean.TRUE.equals(voucher.getWeekendOnly())) {
            DayOfWeek day = today.getDayOfWeek();
            if (day != DayOfWeek.SATURDAY && day != DayOfWeek.SUNDAY) {
                return ResponseEntity.ok(VoucherValidateResponse.builder()
                        .valid(false).message("Voucher chỉ áp dụng vào cuối tuần (Thứ 7 - Chủ nhật)")
                        .build());
            }
        }

        // 8. Tính discount
        long discount = calculateDiscount(voucher, subtotal);

        return ResponseEntity.ok(VoucherValidateResponse.builder()
                .valid(true)
                .message("Áp dụng voucher thành công!")
                .discountAmount(discount)
                .finalTotal(subtotal - discount)
                .voucherId(voucher.getId())
                .voucherCode(voucher.getCode())
                .voucherTitle(voucher.getTitle())
                .build());
    }

    /**
     * Checkout: Thực hiện thanh toán nguyên tử (atomic transaction).
     * - Tạo Booking
     * - Cập nhật bookedSeatNums trong Showtime
     * - Tăng usedCount của Voucher
     * Tất cả trong 1 transaction — rollback nếu bất kỳ bước nào thất bại.
     */
    @PostMapping("/checkout")
    @Transactional
    public ResponseEntity<?> checkout(@RequestBody CheckoutRequest request) {
        try {
            // Validate user
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

            // Validate showtime
            Showtime showtime = showtimeRepository.findById(request.getShowtimeId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy suất chiếu"));

            // Kiểm tra suất chiếu chưa qua
            LocalDateTime showtimeDt = LocalDateTime.of(showtime.getDate(), showtime.getTime());
            if (showtimeDt.isBefore(LocalDateTime.now())) {
                return ResponseEntity.badRequest().body("Suất chiếu này đã qua, không thể đặt vé");
            }

            // Parse selected seats
            List<String> selectedSeats = parseSeats(request.getSeatNums());
            if (selectedSeats.isEmpty()) {
                return ResponseEntity.badRequest().body("Không có ghế nào được chọn");
            }

            // Kiểm tra ghế chưa bị đặt
            List<String> currentBooked = parseSeats(showtime.getBookedSeatNums());
            for (String seat : selectedSeats) {
                if (currentBooked.contains(seat)) {
                    return ResponseEntity.badRequest()
                            .body("Ghế " + seat + " đã được người khác đặt. Vui lòng chọn ghế khác.");
                }
            }

            // Xử lý voucher (nếu có)
            Voucher voucher = null;
            long discount = 0L;
            long subtotal = request.getSubtotal() != null ? request.getSubtotal() : 0L;

            if (request.getVoucherCode() != null && !request.getVoucherCode().trim().isEmpty()) {
                voucher = voucherRepository.findByCode(request.getVoucherCode().trim())
                        .orElse(null);
                if (voucher == null) {
                    voucher = voucherRepository.findByCode(request.getVoucherCode().trim().toUpperCase())
                            .orElse(null);
                }
                if (voucher != null && Boolean.TRUE.equals(voucher.getIsActive())) {
                    discount = calculateDiscount(voucher, subtotal);
                }
            }

            long finalTotal = subtotal - discount;

            // 1. Tạo Booking
            Booking booking = Booking.builder()
                    .user(user)
                    .showtime(showtime)
                    .seatNums(request.getSeatNums())
                    .totalPrice(finalTotal)
                    .originalPrice(subtotal)
                    .discount(discount)
                    .voucherCode(voucher != null ? voucher.getCode() : null)
                    .status(BookingStatus.CONFIRMED)
                    .createdAt(LocalDateTime.now())
                    .build();
            Booking saved = bookingRepository.save(booking);

            // 2. Cập nhật bookedSeatNums trong Showtime
            List<String> newBookedSeats = new ArrayList<>(currentBooked);
            newBookedSeats.addAll(selectedSeats);
            showtime.setBookedSeatNums(objectMapper.writeValueAsString(newBookedSeats));
            showtimeRepository.save(showtime);

            // 3. Tăng usedCount của Voucher
            if (voucher != null) {
                voucher.setUsedCount(voucher.getUsedCount() + 1);
                voucherRepository.save(voucher);
            }

            // Trả về booking đã tạo
            BookingDto response = BookingDto.builder()
                    .id(saved.getId())
                    .userId(saved.getUser().getId())
                    .showtimeId(saved.getShowtime().getId())
                    .seatNums(saved.getSeatNums())
                    .totalPrice(saved.getTotalPrice())
                    .originalPrice(saved.getOriginalPrice())
                    .discount(saved.getDiscount())
                    .voucherCode(saved.getVoucherCode())
                    .status(saved.getStatus())
                    .createdAt(saved.getCreatedAt())
                    .build();

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Lỗi xử lý: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Lỗi hệ thống: " + e.getMessage());
        }
    }

    // ============= PRIVATE HELPERS =============

    private long calculateDiscount(Voucher voucher, long subtotal) {
        double discount = 0;
        if (voucher.getType() == VoucherType.PERCENTAGE) {
            discount = (subtotal * voucher.getValue()) / 100.0;
            if (voucher.getMaxDiscount() != null && discount > voucher.getMaxDiscount()) {
                discount = voucher.getMaxDiscount();
            }
        } else if (voucher.getType() == VoucherType.FIXED) {
            discount = voucher.getValue();
        }
        return Math.min((long) discount, subtotal);
    }

    private List<String> parseSeats(String seatsJson) {
        if (seatsJson == null || seatsJson.trim().isEmpty() || seatsJson.equals("[]")) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(seatsJson, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            return new ArrayList<>();
        }
    }
}
