package com.example.backend.dto;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovieDto {
    private Long id;
    private String title;
    private List<String> genres;  // Changed from String to List<String>
    private String description;
    private Double rating;
    private Integer duration;
    private String poster;
    private String director;
    private String cast;
    private String language;
    private LocalDate releaseDate;
    private String ageRating;
    private String trailerUrl;
}
