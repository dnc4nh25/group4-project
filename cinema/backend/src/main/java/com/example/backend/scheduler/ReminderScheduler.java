package com.example.backend.scheduler;

import com.example.backend.service.ReminderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReminderScheduler {

    private final ReminderService reminderService;

    // Chạy mỗi 5 phút một lần
    @Scheduled(cron = "0 */5 * * * *")
    public void scheduleReminderEmails() {
        log.info("ReminderScheduler triggered: Bắt đầu kiểm tra suất chiếu để gửi email...");
        reminderService.processReminders();
    }
}
