package com.example.backend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactMessageDto {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String subject;
    private String message;
    private Long userId;
    private String status;
    private String adminReply;
    private LocalDateTime createdAt;
    private LocalDateTime repliedAt;
}
