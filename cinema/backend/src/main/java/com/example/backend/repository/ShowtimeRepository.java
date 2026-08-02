package com.example.backend.repository;

import com.example.backend.entity.Showtime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ShowtimeRepository extends JpaRepository<Showtime, Long> {
    List<Showtime> findByMovieId(Long movieId);

    // Tìm tất cả xuất chiếu trong cùng phòng và cùng ngày (dùng cho validate trùng lịch)
    List<Showtime> findByRoomAndDate(String room, LocalDate date);

    boolean existsByMovieId(Long movieId);
    boolean existsByMovieIdAndDateGreaterThanEqual(Long movieId, LocalDate date);
}
