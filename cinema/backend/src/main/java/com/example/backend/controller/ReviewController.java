package com.example.backend.controller;

import com.example.backend.dto.ReviewDto;
import com.example.backend.entity.Booking;
import com.example.backend.entity.Movie;
import com.example.backend.entity.Review;
import com.example.backend.entity.Showtime;
import com.example.backend.entity.User;
import com.example.backend.enums.UserRole;
import com.example.backend.repository.BookingRepository;
import com.example.backend.repository.MovieRepository;
import com.example.backend.repository.ReviewRepository;
import com.example.backend.repository.ShowtimeRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "/api/reviews", produces = MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8")
@CrossOrigin(origins = "*")
public class ReviewController {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ShowtimeRepository showtimeRepository;

    // Phương thức tính và cập nhật rating của phim dựa trên reviews
    private void updateMovieRating(Long movieId) {
        try {
            List<Review> movieReviews = reviewRepository.findByMovieId(movieId);
            if (movieReviews.isEmpty()) {
                return; // Không cập nhật nếu chưa có review
            }
            
            // Tính rating trung bình (thang 5) và chuyển sang thang 10
            double avgRating5 = movieReviews.stream()
                    .mapToInt(Review::getRating)
                    .average()
                    .orElse(0.0);
            
            // Chuyển từ thang 5 sang thang 10
            double avgRating10 = avgRating5 * 2.0;
            
            // Làm tròn 1 chữ số thập phân
            avgRating10 = Math.round(avgRating10 * 10.0) / 10.0;
            
            // Cập nhật rating cho movie
            Movie movie = movieRepository.findById(movieId).orElse(null);
            if (movie != null) {
                movie.setRating(avgRating10);
                movieRepository.save(movie);
                System.out.println("Updated movie " + movieId + " rating to: " + avgRating10);
            }
        } catch (Exception e) {
            System.err.println("Error updating movie rating: " + e.getMessage());
        }
    }

    // Get all reviews (for admin)
    @GetMapping
    public ResponseEntity<List<ReviewDto>> getAllReviews() {
        List<ReviewDto> reviews = reviewRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(reviews);
    }
    
    // Admin: Recalculate all movie ratings (migration endpoint)
    @PostMapping("/recalculate-all-ratings")
    public ResponseEntity<?> recalculateAllMovieRatings() {
        try {
            List<Movie> allMovies = movieRepository.findAll();
            int updated = 0;
            
            for (Movie movie : allMovies) {
                List<Review> movieReviews = reviewRepository.findByMovieId(movie.getId());
                if (!movieReviews.isEmpty()) {
                    double avgRating5 = movieReviews.stream()
                            .mapToInt(Review::getRating)
                            .average()
                            .orElse(0.0);
                    
                    double avgRating10 = Math.round(avgRating5 * 2.0 * 10.0) / 10.0;
                    movie.setRating(avgRating10);
                    movieRepository.save(movie);
                    updated++;
                }
            }
            
            return ResponseEntity.ok(Map.of(
                "message", "Đã cập nhật rating cho " + updated + " phim",
                "totalMovies", allMovies.size(),
                "updatedMovies", updated
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Lỗi khi cập nhật: " + e.getMessage()));
        }
    }

    // Get all reviews for a movie (public - hide hidden reviews)
    @GetMapping("/movie/{movieId}")
    public ResponseEntity<List<ReviewDto>> getMovieReviews(@PathVariable Long movieId) {
        List<ReviewDto> reviews = reviewRepository.findByMovieIdAndHiddenFalse(movieId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(reviews);
    }

    // Check if user can review a movie
    @GetMapping("/can-review/{movieId}/{userId}")
    public ResponseEntity<Map<String, Object>> canUserReview(
            @PathVariable Long movieId,
            @PathVariable Long userId) {
        
        Map<String, Object> response = new HashMap<>();
        
        // Check if user already has a review
        boolean hasReview = reviewRepository.existsByMovieIdAndUserId(movieId, userId);
        
        // Check if user has booking for this movie
        List<Booking> userBookings = bookingRepository.findByUserId(userId);
        boolean hasBooking = userBookings.stream()
                .anyMatch(booking -> {
                    Showtime showtime = booking.getShowtime();
                    return showtime.getMovie().getId().equals(movieId);
                });
        
        if (!hasBooking) {
            response.put("canReview", false);
            response.put("reason", "Bạn chưa đặt vé cho phim này");
            response.put("hasReview", false);
            return ResponseEntity.ok(response);
        }
        
        // Check if any showtime has ended
        boolean hasEndedShowtime = userBookings.stream()
                .filter(booking -> booking.getShowtime().getMovie().getId().equals(movieId))
                .anyMatch(booking -> {
                    Showtime showtime = booking.getShowtime();
                    Movie movie = showtime.getMovie();
                    
                    // Use actual movie duration, default to 120 minutes if not set
                    int movieDurationMinutes = movie.getDuration() != null ? movie.getDuration() : 120;
                    
                    LocalDateTime showtimeEnd = LocalDateTime.of(
                        showtime.getDate(),
                        showtime.getTime()
                    ).plusMinutes(movieDurationMinutes);
                    
                    return LocalDateTime.now().isAfter(showtimeEnd);
                });
        
        if (!hasEndedShowtime) {
            response.put("canReview", false);
            response.put("reason", "Suất chiếu chưa kết thúc");
            response.put("hasReview", hasReview);
            return ResponseEntity.ok(response);
        }
        
        response.put("canReview", true);
        response.put("hasReview", hasReview);
        
        if (hasReview) {
            Review existingReview = reviewRepository.findByMovieIdAndUserId(movieId, userId).orElse(null);
            if (existingReview != null) {
                response.put("existingReview", convertToDto(existingReview));
            }
        }
        
        return ResponseEntity.ok(response);
    }

    // Create or update review
    @PostMapping
    public ResponseEntity<?> createReview(@RequestBody ReviewDto reviewDto) {
        try {
            User user = userRepository.findById(reviewDto.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            Movie movie = movieRepository.findById(reviewDto.getMovieId())
                    .orElseThrow(() -> new RuntimeException("Movie not found"));
            
            // Check if user can review
            Map<String, Object> canReviewResponse = canUserReview(
                reviewDto.getMovieId(), 
                reviewDto.getUserId()
            ).getBody();
            
            if (canReviewResponse == null || !(Boolean) canReviewResponse.get("canReview")) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", canReviewResponse != null 
                        ? canReviewResponse.get("reason").toString() 
                        : "Không thể đánh giá phim này"));
            }
            
            // Check if review already exists
            Review review = reviewRepository.findByMovieIdAndUserId(
                reviewDto.getMovieId(), 
                reviewDto.getUserId()
            ).orElse(null);
            
            if (review != null) {
                // Update existing review
                review.setRating(reviewDto.getRating());
                review.setComment(reviewDto.getComment());
                review.setUpdatedAt(LocalDateTime.now());
            } else {
                // Create new review
                review = Review.builder()
                        .movie(movie)
                        .user(user)
                        .rating(reviewDto.getRating())
                        .comment(reviewDto.getComment())
                        .hidden(false)
                        .createdAt(LocalDateTime.now())
                        .build();
            }
            
            Review saved = reviewRepository.save(review);
            
            // Cập nhật rating của phim
            updateMovieRating(reviewDto.getMovieId());
            
            return ResponseEntity.ok(convertToDto(saved));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Lỗi khi lưu đánh giá: " + e.getMessage()));
        }
    }

    // Update review (for user to edit their own review)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateReview(
            @PathVariable Long id,
            @RequestBody ReviewDto reviewDto) {
        
        try {
            Review review = reviewRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Review not found"));
            
            // Check if user owns this review
            if (!review.getUser().getId().equals(reviewDto.getUserId())) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Bạn chỉ có thể sửa đánh giá của chính mình"));
            }
            
            review.setRating(reviewDto.getRating());
            review.setComment(reviewDto.getComment());
            review.setUpdatedAt(LocalDateTime.now());
            
            Review updated = reviewRepository.save(review);
            
            // Cập nhật rating của phim
            updateMovieRating(review.getMovie().getId());
            
            return ResponseEntity.ok(convertToDto(updated));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Lỗi khi cập nhật đánh giá: " + e.getMessage()));
        }
    }

    // Delete review (user can delete their own)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReview(
            @PathVariable Long id,
            @RequestParam Long userId) {
        
        try {
            Review review = reviewRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Review not found"));
            
            // Check if user owns this review or is admin
            User user = userRepository.findById(userId).orElseThrow();
            if (!review.getUser().getId().equals(userId) && user.getRole() != UserRole.ADMIN) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Bạn không có quyền xóa đánh giá này"));
            }
            
            Long movieId = review.getMovie().getId();
            reviewRepository.deleteById(id);
            
            // Cập nhật rating của phim sau khi xóa
            updateMovieRating(movieId);
            
            return ResponseEntity.ok(Map.of("message", "Xóa đánh giá thành công"));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Lỗi khi xóa đánh giá: " + e.getMessage()));
        }
    }

    // Admin: Toggle hidden status
    @PatchMapping("/{id}/toggle-hidden")
    public ResponseEntity<?> toggleHidden(@PathVariable Long id) {
        try {
            Review review = reviewRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Review not found"));
            
            review.setHidden(!review.getHidden());
            Review updated = reviewRepository.save(review);
            
            return ResponseEntity.ok(convertToDto(updated));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Lỗi khi cập nhật: " + e.getMessage()));
        }
    }

    // Get user's review for a specific movie
    @GetMapping("/user/{userId}/movie/{movieId}")
    public ResponseEntity<?> getUserReviewForMovie(
            @PathVariable Long userId,
            @PathVariable Long movieId) {
        
        Review review = reviewRepository.findByMovieIdAndUserId(movieId, userId)
                .orElse(null);
        
        if (review == null) {
            return ResponseEntity.ok(Map.of("hasReview", false));
        }
        
        return ResponseEntity.ok(Map.of(
            "hasReview", true,
            "review", convertToDto(review)
        ));
    }

    private ReviewDto convertToDto(Review review) {
        User user = review.getUser();
        String displayName = user.getFullName();
        if (displayName == null || displayName.trim().isEmpty()) {
            displayName = user.getUsername();
        }
        if (displayName == null || displayName.trim().isEmpty()) {
            displayName = "User #" + user.getId();
        }
        
        return ReviewDto.builder()
                .id(review.getId())
                .movieId(review.getMovie().getId())
                .userId(review.getUser().getId())
                .userName(displayName)
                .rating(review.getRating())
                .comment(review.getComment())
                .hidden(review.getHidden())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}
