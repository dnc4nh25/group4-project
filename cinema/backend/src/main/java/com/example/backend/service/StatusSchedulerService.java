package com.example.backend.service;

import com.example.backend.entity.Booking;
import com.example.backend.entity.FoodOrder;
import com.example.backend.enums.BookingStatus;
import com.example.backend.enums.FoodOrderStatus;
import com.example.backend.repository.BookingRepository;
import com.example.backend.repository.FoodOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
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
public class StatusSchedulerService {

    private final FoodOrderRepository foodOrderRepository;
    private final BookingRepository bookingRepository;
    private final DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");

    @Scheduled(fixedRate = 60000) // Runs every minute
    @Transactional
    public void updateOrderStatuses() {
        LocalDateTime now = LocalDateTime.now();
        
        updateFoodOrders(now);
        updateBookings(now);
    }

    private void updateFoodOrders(LocalDateTime now) {
        List<FoodOrder> pendingOrders = foodOrderRepository.findByStatusOrderByCreatedAtDesc(FoodOrderStatus.PENDING);
        List<FoodOrder> preparingOrders = foodOrderRepository.findByStatusOrderByCreatedAtDesc(FoodOrderStatus.PREPARING);

        for (FoodOrder order : pendingOrders) {
            LocalDateTime pickupDateTime = getPickupDateTime(order);
            if (pickupDateTime != null) {
                if (now.isAfter(pickupDateTime.minusMinutes(15)) || now.isEqual(pickupDateTime.minusMinutes(15))) {
                    order.setStatus(FoodOrderStatus.PREPARING);
                    foodOrderRepository.save(order);
                    log.info("Updated FoodOrder {} to PREPARING", order.getOrderCode());
                }
            }
        }

        for (FoodOrder order : preparingOrders) {
            LocalDateTime pickupDateTime = getPickupDateTime(order);
            if (pickupDateTime != null) {
                if (now.isAfter(pickupDateTime.plusMinutes(15)) || now.isEqual(pickupDateTime.plusMinutes(15))) {
                    order.setStatus(FoodOrderStatus.COMPLETED);
                    foodOrderRepository.save(order);
                    log.info("Updated FoodOrder {} to COMPLETED", order.getOrderCode());
                }
            }
        }
    }

    private void updateBookings(LocalDateTime now) {
        List<Booking> confirmedBookings = bookingRepository.findByStatus(BookingStatus.CONFIRMED);
        
        for (Booking booking : confirmedBookings) {
            LocalDateTime showDateTime = getShowDateTime(booking);
            if (showDateTime != null) {
                if (now.isAfter(showDateTime) || now.isEqual(showDateTime)) {
                    booking.setStatus(BookingStatus.CHECKED_IN);
                    bookingRepository.save(booking);
                    log.info("Updated Booking {} to CHECKED_IN", booking.getBookingCode());
                }
            }
        }
    }

    private LocalDateTime getPickupDateTime(FoodOrder order) {
        try {
            if (order.getPickupDate() == null || order.getPickupTime() == null) return null;
            LocalTime time = LocalTime.parse(order.getPickupTime(), timeFormatter);
            return LocalDateTime.of(order.getPickupDate(), time);
        } catch (Exception e) {
            log.error("Failed to parse pickup time for order {}", order.getOrderCode(), e);
            return null;
        }
    }
    
    private LocalDateTime getShowDateTime(Booking booking) {
        try {
            if (booking.getShowtime() == null || booking.getShowtime().getDate() == null || booking.getShowtime().getTime() == null) return null;
            return LocalDateTime.of(booking.getShowtime().getDate(), booking.getShowtime().getTime());
        } catch (Exception e) {
            log.error("Failed to parse show time for booking {}", booking.getBookingCode(), e);
            return null;
        }
    }
}
