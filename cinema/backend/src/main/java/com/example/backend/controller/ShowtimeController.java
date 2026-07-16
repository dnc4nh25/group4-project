package com.example.backend.controller;

import com.example.backend.dto.ShowtimeDto;
import com.example.backend.entity.Movie;
import com.example.backend.entity.Showtime;
import com.example.backend.repository.MovieRepository;
import com.example.backend.repository.ShowtimeRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
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
    public ResponseEntity<ShowtimeDto> createShowtime(@RequestBody ShowtimeDto showtimeDto) {
        Movie movie = movieRepository.findById(showtimeDto.getMovieId())
                .orElseThrow(() -> new RuntimeException("Movie not found"));

        Showtime showtime = convertToEntity(showtimeDto, movie);
        Showtime saved = showtimeRepository.save(showtime);
        return ResponseEntity.ok(convertToDto(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ShowtimeDto> updateShowtime(@PathVariable Long id, @RequestBody ShowtimeDto showtimeDto) {
        return showtimeRepository.findById(id)
                .map(existingShowtime -> {
                    updateEntityFromDto(existingShowtime, showtimeDto);
                    Showtime updated = showtimeRepository.save(existingShowtime);
                    return ResponseEntity.ok(convertToDto(updated));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ShowtimeDto> patchShowtime(@PathVariable Long id, @RequestBody ShowtimeDto showtimeDto) {
        return updateShowtime(id, showtimeDto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteShowtime(@PathVariable Long id) {
        if (!showtimeRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        
        // Check if there are any bookings for this showtime
        boolean hasBookings = bookingRepository.existsByShowtimeId(id);
        if (hasBookings) {
            return ResponseEntity.badRequest()
                .body(java.util.Map.of(
                    "error", "Không thể xóa suất chiếu này vì đã có người đặt vé",
                    "message", "Suất chiếu đã có booking không thể xóa"
                ));
        }
        
        showtimeRepository.deleteById(id);
        return ResponseEntity.ok().build();
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
