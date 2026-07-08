package com.example.backend.controller;

import com.example.backend.dto.ShowtimeDto;
import com.example.backend.entity.Movie;
import com.example.backend.entity.Showtime;
import com.example.backend.repository.MovieRepository;
import com.example.backend.repository.ShowtimeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/showtimes")
@CrossOrigin(origins = "*")
public class ShowtimeController {

    @Autowired
    private ShowtimeRepository showtimeRepository;

    @Autowired
    private MovieRepository movieRepository;

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
    public ResponseEntity<Void> deleteShowtime(@PathVariable Long id) {
        if (showtimeRepository.existsById(id)) {
            showtimeRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    private ShowtimeDto convertToDto(Showtime showtime) {
        String bookedSeatNums = showtime.getBookedSeatNums() != null ? showtime.getBookedSeatNums() : "[]";
        int bookedCount = countSeatsFromJson(bookedSeatNums);

        return ShowtimeDto.builder()
                .id(showtime.getId())
                .movieId(showtime.getMovie().getId())
                .date(showtime.getDate())
                .time(showtime.getTime())
                .room(showtime.getRoom())
                .totalSeats(showtime.getTotalSeats())
                .price(showtime.getPrice())
                .bookedSeatNums(bookedSeatNums)
                .bookedSeats(bookedCount)
                .build();
    }

    private Showtime convertToEntity(ShowtimeDto dto, Movie movie) {
        return Showtime.builder()
                .movie(movie)
                .date(dto.getDate())
                .time(dto.getTime())
                .room(dto.getRoom())
                .totalSeats(dto.getTotalSeats())
                .price(dto.getPrice())
                .bookedSeatNums(dto.getBookedSeatNums() != null ? dto.getBookedSeatNums() : "[]")
                .build();
    }

    private void updateEntityFromDto(Showtime showtime, ShowtimeDto dto) {
        if (dto.getDate() != null) showtime.setDate(dto.getDate());
        if (dto.getTime() != null) showtime.setTime(dto.getTime());
        if (dto.getRoom() != null) showtime.setRoom(dto.getRoom());
        if (dto.getTotalSeats() != null) showtime.setTotalSeats(dto.getTotalSeats());
        if (dto.getPrice() != null) showtime.setPrice(dto.getPrice());
        if (dto.getBookedSeatNums() != null) showtime.setBookedSeatNums(dto.getBookedSeatNums());
    }

    private int countSeatsFromJson(String bookedSeatNums) {
        // Simple count by counting commas + 1, or check for empty array
        if (bookedSeatNums == null || bookedSeatNums.equals("[]")) {
            return 0;
        }
        // Count number of quotes to get approximate seat count
        // Format: ["A1","A2","B3"] -> count opening quotes
        int count = 0;
        for (int i = 0; i < bookedSeatNums.length(); i++) {
            if (bookedSeatNums.charAt(i) == '"' && (i == 0 || bookedSeatNums.charAt(i-1) != '\\')) {
                count++;
            }
        }
        return count / 2; // Each seat has opening and closing quote
    }
}
