package com.example.backend.service;

import com.example.backend.dto.AuthResponse;
import com.example.backend.dto.LoginRequest;
import com.example.backend.dto.RegisterRequest;
import com.example.backend.entity.User;
import com.example.backend.enums.UserRole;
import com.example.backend.enums.UserStatus;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

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
        return new AuthResponse(token, user.getUsername(), roleStr, user.getFullName());
    }

    public AuthResponse register(RegisterRequest request) {
        // 1. Kiểm tra username đã tồn tại chưa
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Tên đăng nhập đã tồn tại.");
        }

        // 2. Kiểm tra email đã tồn tại chưa
        if (request.getEmail() != null && !request.getEmail().isBlank()
                && userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng.");
        }

        // 3. Kiểm tra phone đã tồn tại chưa
        if (request.getPhone() != null && !request.getPhone().isBlank()
                && userRepository.findByPhone(request.getPhone()).isPresent()) {
            throw new RuntimeException("Số điện thoại đã được sử dụng.");
        }

        // 4. Tạo user mới
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

        return new AuthResponse(token, newUser.getUsername(), roleStr, newUser.getFullName());
    }
}
