package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "showtimes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Showtime {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Liên kết với Movie
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movie_id", nullable = false)
    private Movie movie;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private LocalTime time;

    // Tên phòng chiếu: "Phòng 1", "Phòng 2"...
    @Column(nullable = false, length = 50, columnDefinition = "NVARCHAR(50)")
    private String room;

    @Column(name = "total_seats", nullable = false)
    private Integer totalSeats;



    // Giá vé (VNĐ)
    @Column(nullable = false)
    private Long price;

    // Danh sách mã ghế đã đặt: ["A1","A2","B3"...]
    // Lưu dưới dạng JSON string trong DB
    @Column(name = "booked_seat_nums", columnDefinition = "NVARCHAR(MAX)")
    @Builder.Default
    private String bookedSeatNums = "[]";
}
