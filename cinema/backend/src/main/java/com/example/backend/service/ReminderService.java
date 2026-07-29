package com.example.backend.service;

import com.example.backend.entity.Booking;
import com.example.backend.enums.BookingStatus;
import com.example.backend.repository.BookingRepository;
import com.example.backend.utils.EmailUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReminderService {

    private final BookingRepository bookingRepository;
    private final EmailUtil emailUtil;

    @Transactional
    public void processReminders() {
        log.info("Bắt đầu tiến trình gửi email nhắc nhở suất chiếu...");

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime targetStart = now.plusHours(1).withSecond(0).withNano(0);
        LocalDateTime targetEnd = targetStart.plusMinutes(5).minusSeconds(1);

        log.info("Tìm kiếm các Booking chưa gửi mail, suất chiếu từ {} đến {}", targetStart, targetEnd);

        List<Booking> allBookings = bookingRepository.findBookingsForReminderByDate(BookingStatus.CONFIRMED, targetStart.toLocalDate());
        if (!targetStart.toLocalDate().equals(targetEnd.toLocalDate())) {
            allBookings.addAll(bookingRepository.findBookingsForReminderByDate(BookingStatus.CONFIRMED, targetEnd.toLocalDate()));
        }

        // Lọc giờ trong Java để tìm chính xác suất chiếu bắt đầu sau đúng 1 tiếng
        List<Booking> bookings = allBookings.stream().filter(b -> {
            LocalDateTime showtimeDateTime = LocalDateTime.of(b.getShowtime().getDate(), b.getShowtime().getTime());
            return !showtimeDateTime.isBefore(targetStart) && !showtimeDateTime.isAfter(targetEnd);
        }).toList();

        if (bookings.isEmpty()) {
            log.info("Không có suất chiếu nào cần gửi nhắc nhở trong khung giờ này.");
            return;
        }

        int successCount = 0;
        int failCount = 0;

        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        for (Booking booking : bookings) {
            try {
                String toEmail = booking.getUser().getEmail();
                String userName = booking.getUser().getFullName();
                String movieName = booking.getShowtime().getMovie().getTitle();
                String roomName = booking.getShowtime().getRoom();
                String showDate = booking.getShowtime().getDate().format(dateFormatter);
                String showTime = booking.getShowtime().getTime().format(timeFormatter);
                String seatNumber = booking.getSeatNums();

                emailUtil.sendReminderEmail(toEmail, userName, movieName, roomName, showDate, showTime, seatNumber);

                // Gửi thành công, cập nhật trạng thái
                booking.setReminderSent(true);
                bookingRepository.save(booking);
                successCount++;
            } catch (Exception e) {
                log.error("Gửi email nhắc nhở thất bại cho booking ID: {}", booking.getId(), e);
                failCount++;
            }
        }

        log.info("Tiến trình gửi email hoàn tất. Thành công: {}, Thất bại: {}", successCount, failCount);
    }
}
