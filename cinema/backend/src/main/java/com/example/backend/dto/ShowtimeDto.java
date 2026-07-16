package com.example.backend.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShowtimeDto {
    private Long id;
    private Long movieId;
    private LocalDate date;
    private LocalTime time;
    private String room;
    private Integer totalSeats;
    private Long price;
    private List<String> bookedSeatNums;  // Changed from String to List<String>
    private Integer bookedSeats; // Calculated field
}
