package com.example.backend.service;

import com.example.backend.entity.Booking;
import com.example.backend.entity.FoodOrder;
import com.example.backend.enums.BookingStatus;
import com.example.backend.repository.BookingRepository;
import com.example.backend.repository.FoodOrderRepository;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReminderService {

    private final BookingRepository bookingRepository;
    private final FoodOrderRepository foodOrderRepository;
    private final EmailUtil emailUtil;

    @Transactional
    public void processReminders() {
        log.info("Bắt đầu tiến trình gửi email nhắc nhở suất chiếu...");

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime targetTime = now.plusHours(1);

        log.info("Tìm kiếm các Booking chưa gửi mail, có suất chiếu từ {} đến {}", now, targetTime);

        List<Booking> allBookings = bookingRepository.findBookingsForReminderByDate(BookingStatus.CONFIRMED, now.toLocalDate());
        if (!now.toLocalDate().equals(targetTime.toLocalDate())) {
            allBookings.addAll(bookingRepository.findBookingsForReminderByDate(BookingStatus.CONFIRMED, targetTime.toLocalDate()));
        }

        // Lọc những suất chiếu sẽ bắt đầu trong vòng 1 tiếng tới
        List<Booking> bookings = allBookings.stream().filter(b -> {
            LocalDateTime showtimeDateTime = LocalDateTime.of(b.getShowtime().getDate(), b.getShowtime().getTime());
            return !showtimeDateTime.isBefore(now) && !showtimeDateTime.isAfter(targetTime);
        }).toList();

        if (bookings.isEmpty()) {
            log.info("Không có suất chiếu nào cần gửi nhắc nhở trong khung giờ này.");
        } else {
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
            log.info("Tiến trình gửi email vé hoàn tất. Thành công: {}, Thất bại: {}", successCount, failCount);
        }

        // Xử lý nhắc nhở F&B
        processFoodReminders();
    }

    @Transactional
    public void processFoodReminders() {
        log.info("Bắt đầu tiến trình gửi email nhắc nhở lấy đồ F&B...");

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime targetTime = now.plusHours(1);

        log.info("Tìm kiếm đơn F&B chưa gửi mail, pickupTime từ {} đến {}", now, targetTime);

        List<FoodOrder> candidates = foodOrderRepository.findFoodOrdersForReminderByDate(now.toLocalDate());
        if (!now.toLocalDate().equals(targetTime.toLocalDate())) {
            candidates.addAll(foodOrderRepository.findFoodOrdersForReminderByDate(targetTime.toLocalDate()));
        }

        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        // Lọc những đơn có giờ lấy đồ trong vòng 1 tiếng tới
        List<FoodOrder> orders = candidates.stream().filter(fo -> {
            if (fo.getPickupTime() == null) return false;
            try {
                LocalTime pt = LocalTime.parse(fo.getPickupTime(), timeFormatter);
                LocalDateTime pickupDateTime = LocalDateTime.of(fo.getPickupDate(), pt);
                return !pickupDateTime.isBefore(now) && !pickupDateTime.isAfter(targetTime);
            } catch (Exception e) {
                return false;
            }
        }).collect(Collectors.toList());

        if (orders.isEmpty()) {
            log.info("Không có đơn F&B nào cần gửi nhắc nhở trong khung giờ này.");
            return;
        }

        int successCount = 0;
        int failCount = 0;

        for (FoodOrder order : orders) {
            try {
                String toEmail = order.getUser().getEmail();
                String userName = order.getUser().getFullName();
                String orderCode = order.getOrderCode();
                String pickupDate = order.getPickupDate().format(dateFormatter);
                String pickupTime = order.getPickupTime();

                // Tóm tắt danh sách món
                String itemsSummary = order.getItems().stream()
                        .map(item -> item.getFoodItem().getName()
                                + (item.getSizeLabel() != null ? " (" + item.getSizeLabel() + ")" : "")
                                + " x" + item.getQuantity())
                        .collect(Collectors.joining(", "));

                emailUtil.sendFoodReminderEmail(toEmail, userName, orderCode, pickupDate, pickupTime, itemsSummary);

                order.setReminderSent(true);
                foodOrderRepository.save(order);
                successCount++;
            } catch (Exception e) {
                log.error("Gửi email nhắc F&B thất bại cho order ID: {}", order.getId(), e);
                failCount++;
            }
        }

        log.info("Tiến trình gửi email F&B hoàn tất. Thành công: {}, Thất bại: {}", successCount, failCount);
    }
}
