package com.example.backend.controller;

import com.example.backend.dto.ShowtimeDto;
import com.example.backend.entity.Movie;
import com.example.backend.entity.Showtime;
import com.example.backend.enums.BookingStatus;
import com.example.backend.repository.MovieRepository;
import com.example.backend.repository.ShowtimeRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "/api/showtimes", produces = MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8")
@CrossOrigin(origins = "*")
public class ShowtimeController {

    @Autowired
    private ShowtimeRepository showtimeRepository;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private com.example.backend.repository.BookingRepository bookingRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping
    public ResponseEntity<List<ShowtimeDto>> getAllShowtimes() {
        List<ShowtimeDto> showtimes = showtimeRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(showtimes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShowtimeDto> getShowtimeById(@PathVariable Long id) {
        return showtimeRepository.findById(id)
                .map(showtime -> ResponseEntity.ok(convertToDto(showtime)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/movie/{movieId}")
    public ResponseEntity<List<ShowtimeDto>> getShowtimesByMovie(@PathVariable Long movieId) {
        List<ShowtimeDto> showtimes = showtimeRepository.findByMovieId(movieId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(showtimes);
    }

    @PostMapping
    public ResponseEntity<?> createShowtime(@RequestBody ShowtimeDto showtimeDto) {
        Movie movie = movieRepository.findById(showtimeDto.getMovieId())
                .orElseThrow(() -> new RuntimeException("Movie not found"));

        // Validate trùng lịch và khoảng cách tối thiểu (bỏ qua chính mình: null vì là tạo mới)
        ResponseEntity<?> conflict = validateScheduleConflict(showtimeDto, movie, null);
        if (conflict != null) return conflict;

        Showtime showtime = convertToEntity(showtimeDto, movie);
        Showtime saved = showtimeRepository.save(showtime);
        return ResponseEntity.ok(convertToDto(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateShowtime(@PathVariable Long id, @RequestBody ShowtimeDto showtimeDto) {
        return showtimeRepository.findById(id)
                .map(existingShowtime -> {
                    // Xác định movie (giữ nguyên nếu dto không đổi movieId)
                    Long movieId = showtimeDto.getMovieId() != null
                            ? showtimeDto.getMovieId()
                            : existingShowtime.getMovie().getId();
                    Movie movie = movieRepository.findById(movieId)
                            .orElse(existingShowtime.getMovie());

                    // Tạo dto đã merge đầy đủ để validate
                    ShowtimeDto mergedDto = ShowtimeDto.builder()
                            .movieId(movieId)
                            .date(showtimeDto.getDate() != null ? showtimeDto.getDate() : existingShowtime.getDate())
                            .time(showtimeDto.getTime() != null ? showtimeDto.getTime() : existingShowtime.getTime())
                            .room(showtimeDto.getRoom() != null ? showtimeDto.getRoom() : existingShowtime.getRoom())
                            .totalSeats(showtimeDto.getTotalSeats() != null ? showtimeDto.getTotalSeats() : existingShowtime.getTotalSeats())
                            .price(showtimeDto.getPrice() != null ? showtimeDto.getPrice() : existingShowtime.getPrice())
                            .build();

                    // Validate, bỏ qua chính bản ghi đang cập nhật
                    ResponseEntity<?> conflict = validateScheduleConflict(mergedDto, movie, id);
                    if (conflict != null) return conflict;

                    updateEntityFromDto(existingShowtime, showtimeDto);
                    Showtime updated = showtimeRepository.save(existingShowtime);
                    return ResponseEntity.ok(convertToDto(updated));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> patchShowtime(@PathVariable Long id, @RequestBody ShowtimeDto showtimeDto) {
        return updateShowtime(id, showtimeDto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteShowtime(@PathVariable Long id) {
        if (!showtimeRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        // Chỉ kiểm tra bookings có status CONFIRMED (bỏ qua các booking đã CANCELLED)
        boolean hasConfirmedBookings = bookingRepository.existsByShowtimeIdAndStatus(
                id,
                BookingStatus.CONFIRMED
        );

        // Debug logging
        System.out.println("🔍 DELETE Showtime ID: " + id);
        System.out.println("🔍 Has CONFIRMED bookings: " + hasConfirmedBookings);

        // Thêm debug chi tiết
        java.util.List<com.example.backend.entity.Booking> allBookings = bookingRepository.findByShowtimeId(id);
        System.out.println("🔍 Total bookings: " + allBookings.size());
        allBookings.forEach(b -> {
            System.out.println("  - Booking ID: " + b.getId() + ", Status: " + b.getStatus());
        });

        if (hasConfirmedBookings) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error", "Không thể xóa suất chiếu này vì vẫn còn vé đang được giữ (chưa hủy)",
                            "message", "Suất chiếu đã có booking đang CONFIRMED không thể xóa"
                    ));
        }

        System.out.println("✅ Deleting showtime " + id + " - All bookings are cancelled or no bookings exist");
        showtimeRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    /**
     * Kiểm tra trùng lịch phòng chiếu và khoảng cách tối thiểu 30 phút.
     *
     * @param dto       Dữ liệu xuất chiếu cần validate (đã được merge đầy đủ)
     * @param movie     Phim tương ứng (để lấy duration)
     * @param excludeId ID của xuất chiếu đang được cập nhật (null khi tạo mới)
     * @return ResponseEntity lỗi nếu vi phạm, null nếu hợp lệ
     */
    private ResponseEntity<?> validateScheduleConflict(ShowtimeDto dto, Movie movie, Long excludeId) {
        if (dto.getRoom() == null || dto.getDate() == null || dto.getTime() == null) {
            return null; // Thiếu field cơ bản – để validator khác xử lý
        }

        // Thời lượng phim (phút), mặc định 120 phút nếu chưa có
        int duration = (movie.getDuration() != null && movie.getDuration() > 0) ? movie.getDuration() : 120;

        // Thời gian bắt đầu và kết thúc của xuất chiếu mới (tính bằng phút từ 00:00)
        LocalDate date = dto.getDate();
        LocalTime newStartTime = dto.getTime();
        int newStart = newStartTime.getHour() * 60 + newStartTime.getMinute();
        int newEnd   = newStart + duration;

        // Lấy tất cả xuất chiếu trong cùng phòng và cùng ngày
        List<Showtime> sameRoomSameDay = showtimeRepository.findByRoomAndDate(dto.getRoom(), date);

        for (Showtime existing : sameRoomSameDay) {
            // Bỏ qua chính bản ghi đang được cập nhật
            if (excludeId != null && existing.getId().equals(excludeId)) continue;

            // Lấy thời lượng phim của xuất chiếu đang xét
            int existingDuration = 120;
            if (existing.getMovie() != null && existing.getMovie().getDuration() != null
                    && existing.getMovie().getDuration() > 0) {
                existingDuration = existing.getMovie().getDuration();
            }

            LocalTime existingTime = existing.getTime();
            int existStart = existingTime.getHour() * 60 + existingTime.getMinute();
            int existEnd   = existStart + existingDuration;

            // ── Kiểm tra giao nhau thời gian ──
            // Hai khoảng [newStart, newEnd) và [existStart, existEnd) giao nhau khi:
            //   newStart < existEnd && newEnd > existStart
            boolean overlaps = newStart < existEnd && newEnd > existStart;
            if (overlaps) {
                return ResponseEntity.status(409).body(Map.of(
                        "error", "SCHEDULE_CONFLICT",
                        "message", "Phòng chiếu đã có lịch chiếu trong khoảng thời gian này, vui lòng chọn thời gian khác."
                ));
            }

            // ── Kiểm tra khoảng cách tối thiểu 30 phút ──
            // gapAfterExisting:  xuất mới bắt đầu sau khi xuất cũ kết thúc
            // gapBeforeExisting: xuất mới kết thúc trước khi xuất cũ bắt đầu
            int gapAfterExisting  = newStart - existEnd;
            int gapBeforeExisting = existStart - newEnd;

            if (gapAfterExisting >= 0 && gapAfterExisting < 30) {
                return ResponseEntity.status(409).body(Map.of(
                        "error", "INSUFFICIENT_GAP",
                        "message", "Giữa các suất chiếu trong cùng phòng phải có khoảng cách tối thiểu 30 phút."
                ));
            }
            if (gapBeforeExisting >= 0 && gapBeforeExisting < 30) {
                return ResponseEntity.status(409).body(Map.of(
                        "error", "INSUFFICIENT_GAP",
                        "message", "Giữa các suất chiếu trong cùng phòng phải có khoảng cách tối thiểu 30 phút."
                ));
            }
        }

        return null; // Không có xung đột
    }

    private ShowtimeDto convertToDto(Showtime showtime) {
        List<String> bookedSeatsList = parseSeatNumsFromJson(showtime.getBookedSeatNums());

        return ShowtimeDto.builder()
                .id(showtime.getId())
                .movieId(showtime.getMovie().getId())
                .date(showtime.getDate())
                .time(showtime.getTime())
                .room(showtime.getRoom())
                .totalSeats(showtime.getTotalSeats())
                .price(showtime.getPrice())
                .bookedSeatNums(bookedSeatsList)
                .bookedSeats(bookedSeatsList.size())
                .build();
    }

    private Showtime convertToEntity(ShowtimeDto dto, Movie movie) {
        String bookedSeatsJson = convertSeatNumsToJson(dto.getBookedSeatNums());

        return Showtime.builder()
                .movie(movie)
                .date(dto.getDate())
                .time(dto.getTime())
                .room(dto.getRoom())
                .totalSeats(dto.getTotalSeats())
                .price(dto.getPrice())
                .bookedSeatNums(bookedSeatsJson)
                .build();
    }

    private void updateEntityFromDto(Showtime showtime, ShowtimeDto dto) {
        if (dto.getDate() != null) showtime.setDate(dto.getDate());
        if (dto.getTime() != null) showtime.setTime(dto.getTime());
        if (dto.getRoom() != null) showtime.setRoom(dto.getRoom());
        if (dto.getTotalSeats() != null) showtime.setTotalSeats(dto.getTotalSeats());
        if (dto.getPrice() != null) showtime.setPrice(dto.getPrice());
        if (dto.getBookedSeatNums() != null) {
            showtime.setBookedSeatNums(convertSeatNumsToJson(dto.getBookedSeatNums()));
        }
    }

    private List<String> parseSeatNumsFromJson(String seatNumsJson) {
        if (seatNumsJson == null || seatNumsJson.trim().isEmpty() || seatNumsJson.equals("[]")) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(seatNumsJson, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            return new ArrayList<>();
        }
    }

    private String convertSeatNumsToJson(List<String> seatNums) {
        if (seatNums == null || seatNums.isEmpty()) {
            return "[]";
        }
        try {
            return objectMapper.writeValueAsString(seatNums);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }
}
