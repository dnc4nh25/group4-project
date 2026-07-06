package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "movies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Movie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    // Thể loại lưu dạng JSON string, ví dụ: ["Hành động", "Viễn tưởng"]
    @Column(columnDefinition = "TEXT")
    private String genres;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Double rating;

    // Thời lượng phim (phút)
    private Integer duration;

    // Ảnh poster có thể là URL hoặc chuỗi Base64 cực kỳ dài
    @Column(columnDefinition = "VARCHAR(MAX)")
    private String poster;

    @Column(length = 200)
    private String director;

    @Column(columnDefinition = "TEXT")
    private String cast;

    @Column(length = 50)
    private String language;

    @Column(name = "release_date")
    private LocalDate releaseDate;

    // T13, T16, T18, P
    @Column(name = "age_rating", length = 10)
    private String ageRating;

    @Column(name = "trailer_url", length = 500)
    private String trailerUrl;
}
