package com.example.backend.controller;

import com.example.backend.service.ReminderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/reminders")
@RequiredArgsConstructor
public class ReminderController {

    private final ReminderService reminderService;

    // API phục vụ cho việc test gửi email (Admin / Developer có thể gọi trực tiếp)
    @PostMapping("/test")
    public ResponseEntity<?> testSendReminders() {
        try {
            reminderService.processReminders();
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Tiến trình kiểm tra và gửi email nhắc nhở đã được kích hoạt thành công."
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "error",
                    "message", "Đã xảy ra lỗi khi kích hoạt gửi email nhắc nhở: " + e.getMessage()
            ));
        }
    }
}
