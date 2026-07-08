package com.example.backend.dto;

import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovieDto {
    private Long id;
    private String title;
    private String genres;
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
