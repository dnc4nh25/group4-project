package com.example.backend.repository;

import com.example.backend.entity.PasswordResetOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Long> {
    Optional<PasswordResetOtp> findByEmailAndOtpCodeAndUsedFalseAndExpiryTimeAfter(String email, String otpCode, LocalDateTime now);
}
