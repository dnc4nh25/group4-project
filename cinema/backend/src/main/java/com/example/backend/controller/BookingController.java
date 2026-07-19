package com.example.backend.controller;

import com.example.backend.dto.BookingDto;
import com.example.backend.entity.Booking;
import com.example.backend.entity.Showtime;
import com.example.backend.entity.User;
import com.example.backend.repository.BookingRepository;
import com.example.backend.repository.ShowtimeRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "/api/bookings", produces = MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8")
@CrossOrigin(origins = "*")
public class BookingController {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShowtimeRepository showtimeRepository;

    @GetMapping
    public ResponseEntity<List<BookingDto>> getAllBookings() {
        List<BookingDto> bookings = bookingRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingDto> getBookingById(@PathVariable Long id) {
        return bookingRepository.findById(id)
                .map(booking -> ResponseEntity.ok(convertToDto(booking)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<BookingDto>> getBookingsByUser(@PathVariable Long userId) {
        List<BookingDto> bookings = bookingRepository.findByUserId(userId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/history/{userId}")
    public ResponseEntity<List<com.example.backend.dto.MyBookingResponse>> getBookingHistory(@PathVariable Long userId) {
        List<com.example.backend.dto.MyBookingResponse> bookings = bookingRepository.findByUserId(userId).stream()
                .map(booking -> {
                    Showtime showtime = booking.getShowtime();
                    com.example.backend.entity.Movie movie = showtime.getMovie();
                    return com.example.backend.dto.MyBookingResponse.builder()
                            .id(booking.getId())
                            .movieName(movie.getTitle())
                            .moviePoster(movie.getPoster())
                            .theaterName("CinemaXP") // Theater không có trong DB, dùng mặc định
                            .roomName(showtime.getRoom())
                            .showDate(showtime.getDate())
                            .showTime(showtime.getTime())
                            .seatNums(booking.getSeatNums())
                            .totalPrice(booking.getTotalPrice())
                            .originalPrice(booking.getOriginalPrice())
                            .discount(booking.getDiscount())
                            .voucherCode(booking.getVoucherCode())
                            .status(booking.getStatus())
                            .createdAt(booking.getCreatedAt())
                            .build();
                })
                .sorted((com.example.backend.dto.MyBookingResponse b1, com.example.backend.dto.MyBookingResponse b2) -> b2.getCreatedAt().compareTo(b1.getCreatedAt())) // Mới nhất lên đầu
                .collect(Collectors.toList());
        return ResponseEntity.ok(bookings);
    }

    @PostMapping
    public ResponseEntity<BookingDto> createBooking(@RequestBody BookingDto bookingDto) {
        User user = userRepository.findById(bookingDto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Showtime showtime = showtimeRepository.findById(bookingDto.getShowtimeId())
                .orElseThrow(() -> new RuntimeException("Showtime not found"));

        Booking booking = convertToEntity(bookingDto, user, showtime);
        Booking saved = bookingRepository.save(booking);
        return ResponseEntity.ok(convertToDto(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BookingDto> updateBooking(@PathVariable Long id, @RequestBody BookingDto bookingDto) {
        return bookingRepository.findById(id)
                .map(existingBooking -> {
                    updateEntityFromDto(existingBooking, bookingDto);
                    Booking updated = bookingRepository.save(existingBooking);
                    return ResponseEntity.ok(convertToDto(updated));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}")
    public ResponseEntity<BookingDto> patchBooking(@PathVariable Long id, @RequestBody BookingDto bookingDto) {
        return updateBooking(id, bookingDto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBooking(@PathVariable Long id) {
        if (bookingRepository.existsById(id)) {
            bookingRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable Long id) {
        return bookingRepository.findById(id)
                .map(booking -> {
                    // Kiểm tra vé đã hủy chưa
                    if (booking.getStatus() == com.example.backend.enums.BookingStatus.CANCELLED) {
                        return ResponseEntity.badRequest().body("Vé đã được hủy trước đó.");
                    }

                    // Set trạng thái hủy
                    booking.setStatus(com.example.backend.enums.BookingStatus.CANCELLED);
                    booking.setCancelledAt(LocalDateTime.now());

                    // Trả ghế về Showtime (xóa khỏi bookedSeatNums)
                    try {
                        Showtime showtime = booking.getShowtime();
                        String bookedJson = showtime.getBookedSeatNums();
                        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                        java.util.List<String> bookedSeats = mapper.readValue(bookedJson,
                                mapper.getTypeFactory().constructCollectionType(java.util.List.class, String.class));
                        java.util.List<String> cancelledSeats = mapper.readValue(booking.getSeatNums(),
                                mapper.getTypeFactory().constructCollectionType(java.util.List.class, String.class));
                        bookedSeats.removeAll(cancelledSeats);
                        showtime.setBookedSeatNums(mapper.writeValueAsString(bookedSeats));
                        showtimeRepository.save(showtime);
                    } catch (Exception e) {
                        // Nếu parse JSON thất bại thì vẫn hủy vé, chỉ không trả ghế
                        System.err.println("Warning: Could not restore seats for booking " + id + ": " + e.getMessage());
                    }

                    bookingRepository.save(booking);
                    return ResponseEntity.ok().body("Hủy vé thành công.");
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private BookingDto convertToDto(Booking booking) {
        return BookingDto.builder()
                .id(booking.getId())
                .userId(booking.getUser().getId())
                .showtimeId(booking.getShowtime().getId())
                .seatNums(booking.getSeatNums())
                .totalPrice(booking.getTotalPrice())
                .originalPrice(booking.getOriginalPrice())
                .discount(booking.getDiscount())
                .voucherCode(booking.getVoucherCode())
                .status(booking.getStatus())
                .createdAt(booking.getCreatedAt())
                .cancelledAt(booking.getCancelledAt())
                .build();
    }

    private Booking convertToEntity(BookingDto dto, User user, Showtime showtime) {
        return Booking.builder()
                .user(user)
                .showtime(showtime)
                .seatNums(dto.getSeatNums())
                .totalPrice(dto.getTotalPrice())
                .originalPrice(dto.getOriginalPrice())
                .discount(dto.getDiscount() != null ? dto.getDiscount() : 0L)
                .voucherCode(dto.getVoucherCode())
                .status(dto.getStatus())
                .createdAt(dto.getCreatedAt() != null ? dto.getCreatedAt() : LocalDateTime.now())
                .build();
    }

    private void updateEntityFromDto(Booking booking, BookingDto dto) {
        if (dto.getSeatNums() != null) booking.setSeatNums(dto.getSeatNums());
        if (dto.getTotalPrice() != null) booking.setTotalPrice(dto.getTotalPrice());
        if (dto.getOriginalPrice() != null) booking.setOriginalPrice(dto.getOriginalPrice());
        if (dto.getDiscount() != null) booking.setDiscount(dto.getDiscount());
        if (dto.getVoucherCode() != null) booking.setVoucherCode(dto.getVoucherCode());
        if (dto.getStatus() != null) {
            booking.setStatus(dto.getStatus());
            if (dto.getStatus().name().equals("CANCELLED") && booking.getCancelledAt() == null) {
                booking.setCancelledAt(LocalDateTime.now());
            }
        }
    }
}
