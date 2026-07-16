package com.example.backend.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO dùng cho tất cả CRUD user.
 * - role / status lưu dạng String (lowercase: "admin", "user", "active", "banned", "pending")
 *   để khớp trực tiếp với frontend React.
 * - Backend controller tự convert sang Enum khi lưu vào DB.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {
    private Long id;
    private String username;
    private String password;   // Nhận khi create/update; trả về bcrypt hash khi list
    private String fullName;
    private String email;
    private String phone;
    private String role;       // "admin" | "user"
    private String status;     // "active" | "banned" | "pending"
    private LocalDateTime createdAt;
}
