package com.example.backend.utils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class EmailUtil {

    private final JavaMailSender mailSender;

    public void sendReminderEmail(String to, String userName, String movieName, String roomName, String showDate, String startTime, String seatNumber) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Nhắc lịch xem phim - Suất chiếu của bạn sắp bắt đầu");

            String text = String.format(
                    "Xin chào %s,\n\n" +
                    "Đây là thông báo nhắc lịch xem phim của bạn.\n\n" +
                    "Thông tin vé:\n" +
                    "- Phim: %s\n" +
                    "- Rạp/phòng: %s\n" +
                    "- Ngày chiếu: %s\n" +
                    "- Giờ chiếu: %s\n" +
                    "- Ghế: %s\n\n" +
                    "Suất chiếu sẽ bắt đầu sau 1 giờ.\n" +
                    "Vui lòng đến rạp sớm để có trải nghiệm tốt nhất.\n\n" +
                    "Cảm ơn bạn đã sử dụng dịch vụ.",
                    userName, movieName, roomName, showDate, startTime, seatNumber
            );

            message.setText(text);
            mailSender.send(message);
            log.info("Đã gửi email nhắc nhở thành công đến: {}", to);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email nhắc nhở đến: {}", to, e);
            throw e; // Ném ra lỗi để service có thể catch và không cập nhật trạng thái reminderSent
        }
    }

    public void sendOtpEmail(String to, String otpCode) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Mã OTP khôi phục mật khẩu - CinemaXP");

            String text = String.format(
                    "Xin chào,\n\n" +
                    "Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản tại CinemaXP.\n" +
                    "Mã OTP của bạn là: %s\n" +
                    "Mã xác thực này có hiệu lực trong vòng 5 phút.\n" +
                    "Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.\n\n" +
                    "Trân trọng,\n" +
                    "Ban quản trị CinemaXP",
                    otpCode
            );

            message.setText(text);
            mailSender.send(message);
            log.info("Đã gửi email OTP khôi phục mật khẩu thành công đến: {}", to);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email OTP đến: {}", to, e);
            throw e;
        }
    }
}
