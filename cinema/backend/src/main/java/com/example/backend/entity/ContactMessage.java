package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "contact_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100, columnDefinition = "NVARCHAR(100)")
    private String name;

    @Column(nullable = false, length = 100, columnDefinition = "NVARCHAR(100)")
    private String email;

    @Column(length = 20, columnDefinition = "NVARCHAR(20)")
    private String phone;

    // feedback, booking, payment, partnership, other
    @Column(nullable = false, length = 50, columnDefinition = "NVARCHAR(50)")
    private String subject;

    @Column(nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String message;

    // User đã đăng nhập gửi (nullable - khách vãng lai cũng gửi được)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // pending, replied
    @Column(nullable = false, length = 20, columnDefinition = "NVARCHAR(20)")
    @Builder.Default
    private String status = "pending";

    // Admin reply
    @Column(name = "admin_reply", columnDefinition = "NVARCHAR(MAX)")
    private String adminReply;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "replied_at")
    private LocalDateTime repliedAt;
}
