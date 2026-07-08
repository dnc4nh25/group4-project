package com.example.backend.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

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
    private String bookedSeatNums;
    private Integer bookedSeats; // Calculated field
}
