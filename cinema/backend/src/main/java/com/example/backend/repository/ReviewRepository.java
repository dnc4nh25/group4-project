package com.example.backend.repository;

import com.example.backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByMovieIdAndHiddenFalse(Long movieId);
    List<Review> findByMovieId(Long movieId);
    List<Review> findByUserId(Long userId);
    Optional<Review> findByMovieIdAndUserId(Long movieId, Long userId);
    boolean existsByMovieIdAndUserId(Long movieId, Long userId);
}
