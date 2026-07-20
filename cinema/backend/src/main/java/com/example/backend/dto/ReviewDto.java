package com.example.backend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewDto {
    private Long id;
    private Long movieId;
    private Long userId;
    private String userName;
    private Integer rating;
    private String comment;
    private Boolean hidden;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean canEdit; // Frontend helper
}
