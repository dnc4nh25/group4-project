package com.example.backend.service;

import com.example.backend.dto.AuthResponse;
import com.example.backend.dto.LoginRequest;
import com.example.backend.dto.RegisterRequest;
import com.example.backend.dto.ForgotPasswordRequest;
import com.example.backend.dto.ResetPasswordRequest;
import com.example.backend.entity.User;
import com.example.backend.entity.PasswordResetOtp;
import com.example.backend.enums.UserRole;
import com.example.backend.enums.UserStatus;
import com.example.backend.exception.FieldValidationException;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.PasswordResetOtpRepository;
import com.example.backend.security.JwtUtils;
import com.example.backend.utils.EmailUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final PasswordResetOtpRepository passwordResetOtpRepository;
    private final EmailUtil emailUtil;

    public AuthResponse login(LoginRequest request) {
        // 1. Tìm user theo username
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Tên đăng nhập hoặc mật khẩu không đúng."));

        // 2. So sánh mật khẩu bằng BCrypt
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Tên đăng nhập hoặc mật khẩu không đúng.");
        }

        // 3. Kiểm tra trạng thái tài khoản
        if (user.getStatus() == UserStatus.BANNED) {
            throw new RuntimeException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin để được hỗ trợ.");
        }
        if (user.getStatus() == UserStatus.PENDING) {
            throw new RuntimeException("Tài khoản của bạn đang chờ duyệt. Vui lòng liên hệ admin để được kích hoạt.");
        }

        // 4. Tạo JWT Token (Role viết thường để khớp FE)
        String roleStr = user.getRole().name().toLowerCase();
        String token = jwtUtils.generateToken(user.getUsername(), roleStr);

        // 5. Trả về AuthResponse
        String statusStr = user.getStatus().name().toLowerCase();
        return new AuthResponse(token, user.getId(), user.getUsername(), roleStr, user.getFullName(),
                user.getEmail(), user.getPhone(), statusStr, user.getPoints());
    }

    public AuthResponse register(RegisterRequest request) {
        Map<String, String> errors = collectRegisterErrors(request);
        if (!errors.isEmpty()) {
            throw new FieldValidationException(errors);
        }

        // Tạo user mới
        User newUser = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .build();

        userRepository.save(newUser);

        // 5. Tự động đăng nhập sau khi đăng ký thành công
        String roleStr = UserRole.USER.name().toLowerCase();
        String token = jwtUtils.generateToken(newUser.getUsername(), roleStr);

        return new AuthResponse(token, newUser.getId(), newUser.getUsername(), roleStr, newUser.getFullName(),
                newUser.getEmail(), newUser.getPhone(), UserStatus.ACTIVE.name().toLowerCase(), newUser.getPoints());
    }

    private Map<String, String> collectRegisterErrors(RegisterRequest request) {
        Map<String, String> errors = new LinkedHashMap<>();

        if (request.getEmail() == null || request.getEmail().isBlank()) {
            errors.put("email", "Email không được để trống.");
        } else if (!isValidEmail(request.getEmail())) {
            errors.put("email", "Email không đúng định dạng.");
        } else if (userRepository.existsByEmail(request.getEmail())) {
            errors.put("email", "Email đã được sử dụng.");
        }

        if (request.getPhone() == null || request.getPhone().isBlank()) {
            errors.put("phone", "Số điện thoại không được để trống.");
        } else if (!isValidPhone(request.getPhone())) {
            errors.put("phone", "Số điện thoại phải có 10 chữ số và bắt đầu bằng số 0.");
        } else if (userRepository.findByPhone(request.getPhone()).isPresent()) {
            errors.put("phone", "Số điện thoại đã được sử dụng.");
        }

        if (request.getUsername() == null || request.getUsername().isBlank()) {
            errors.put("username", "Tên đăng nhập không được để trống.");
        } else if (userRepository.existsByUsername(request.getUsername())) {
            errors.put("username", "Tên đăng nhập đã tồn tại.");
        }

        return errors;
    }

    private boolean isValidEmail(String email) {
        String emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";
        return email.matches(emailRegex);
    }

    private boolean isValidPhone(String phone) {
        // Số điện thoại phải có đúng 10 chữ số và bắt đầu bằng số 0
        String phoneRegex = "^0[0-9]{9}$";
        return phone.matches(phoneRegex);
    }

    public void processForgotPassword(ForgotPasswordRequest request) {
        // 1. Kiểm tra xem email có tồn tại trong hệ thống hay không
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email không tồn tại trên hệ thống."));

        // 2. Tạo mã OTP ngẫu nhiên 6 chữ số
        String otp = String.format("%06d", new java.util.Random().nextInt(1000000));

        // 3. Lưu OTP vào DB với thời hạn 5 phút
        PasswordResetOtp resetOtp = PasswordResetOtp.builder()
                .email(request.getEmail())
                .otpCode(otp)
                .expiryTime(LocalDateTime.now().plusMinutes(5))
                .used(false)
                .build();
        passwordResetOtpRepository.save(resetOtp);

        // 4. Gửi email OTP
        emailUtil.sendOtpEmail(request.getEmail(), otp);
    }

    public void processResetPassword(ResetPasswordRequest request) {
        if (request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            throw new RuntimeException("Mật khẩu mới không được để trống.");
        }
        if (request.getNewPassword().length() < 6) {
            throw new RuntimeException("Mật khẩu mới phải có ít nhất 6 ký tự.");
        }

        // 1. Tìm OTP hợp lệ (đúng mã, chưa dùng, chưa hết hạn)
        PasswordResetOtp resetOtp = passwordResetOtpRepository.findByEmailAndOtpCodeAndUsedFalseAndExpiryTimeAfter(
                request.getEmail(), request.getOtp(), LocalDateTime.now())
                .orElseThrow(() -> new RuntimeException("Mã OTP không đúng hoặc đã hết hạn."));

        // 2. Tìm user theo email
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email không tồn tại trên hệ thống."));

        // 3. Cập nhật mật khẩu mới mã hóa
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // 4. Đánh dấu OTP đã sử dụng
        resetOtp.setUsed(true);
        passwordResetOtpRepository.save(resetOtp);
    }
}
