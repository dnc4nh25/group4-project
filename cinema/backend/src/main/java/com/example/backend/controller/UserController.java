package com.example.backend.controller;

import com.example.backend.dto.UserDto;
import com.example.backend.entity.User;
import com.example.backend.enums.UserRole;
import com.example.backend.enums.UserStatus;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "/api/users", produces = MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ─── GET ALL (có filter + pagination) ────────────────────────────────────
    /**
     * GET /api/users?search=...&role=admin&status=active&page=0&size=10
     * Trả về Page<UserDto> để frontend có thể dùng .content, .totalPages, .totalElements
     */
    @GetMapping
    public ResponseEntity<Page<UserDto>> getAllUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        // Lấy tất cả user rồi filter in-memory (đơn giản, không cần JpaSpecificationExecutor)
        List<User> all = userRepository.findAll();

        List<UserDto> filtered = all.stream()
                .filter(u -> {
                    // Filter theo search (username hoặc fullName)
                    if (search != null && !search.isBlank()) {
                        String q = search.trim().toLowerCase();
                        boolean matchUsername = u.getUsername() != null && u.getUsername().toLowerCase().contains(q);
                        boolean matchFullName = u.getFullName() != null && u.getFullName().toLowerCase().contains(q);
                        if (!matchUsername && !matchFullName) return false;
                    }
                    // Filter theo role
                    if (role != null && !role.isBlank()) {
                        UserRole roleEnum = parseRole(role);
                        if (u.getRole() != roleEnum) return false;
                    }
                    // Filter theo status
                    if (status != null && !status.isBlank()) {
                        UserStatus statusEnum = parseStatus(status);
                        if (u.getStatus() != statusEnum) return false;
                    }
                    return true;
                })
                .map(this::convertToDto)
                .collect(Collectors.toList());

        // Phân trang thủ công
        int total = filtered.size();
        int fromIndex = Math.min(page * size, total);
        int toIndex   = Math.min(fromIndex + size, total);
        List<UserDto> pageContent = filtered.subList(fromIndex, toIndex);

        Pageable pageable = PageRequest.of(page, size);
        Page<UserDto> result = new PageImpl<>(pageContent, pageable, total);

        return ResponseEntity.ok(result);
    }

    // ─── GET BY ID ───────────────────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> ResponseEntity.ok(convertToDto(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── GET BY USERNAME ─────────────────────────────────────────────────────
    @GetMapping("/username/{username}")
    public ResponseEntity<UserDto> getUserByUsername(@PathVariable String username) {
        return userRepository.findByUsername(username)
                .map(user -> ResponseEntity.ok(convertToDto(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── GET BY EMAIL ────────────────────────────────────────────────────────
    @GetMapping("/email/{email}")
    public ResponseEntity<UserDto> getUserByEmail(@PathVariable String email) {
        return userRepository.findByEmail(email)
                .map(user -> ResponseEntity.ok(convertToDto(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── GET BY PHONE ────────────────────────────────────────────────────────
    @GetMapping("/phone/{phone}")
    public ResponseEntity<UserDto> getUserByPhone(@PathVariable String phone) {
        return userRepository.findByPhone(phone)
                .map(user -> ResponseEntity.ok(convertToDto(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── CREATE ──────────────────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<UserDto> createUser(@RequestBody UserDto userDto) {
        // Kiểm tra username đã tồn tại chưa
        if (userRepository.findByUsername(userDto.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().build();
        }

        User user = User.builder()
                .username(userDto.getUsername())
                .fullName(userDto.getFullName())
                .email(userDto.getEmail())
                .phone(userDto.getPhone())
                // Force ADMIN khi tạo qua trang quản lý admin
                .role(UserRole.ADMIN)
                .status(parseStatus(userDto.getStatus()))
                .build();

        // Mã hóa mật khẩu
        if (userDto.getPassword() != null && !userDto.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(userDto.getPassword()));
        }

        User saved = userRepository.save(user);
        return ResponseEntity.ok(convertToDto(saved));
    }

    // ─── UPDATE ──────────────────────────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<UserDto> updateUser(@PathVariable Long id, @RequestBody UserDto userDto) {
        return userRepository.findById(id)
                .map(existing -> {
                    if (userDto.getFullName() != null)  existing.setFullName(userDto.getFullName());
                    if (userDto.getEmail()    != null)  existing.setEmail(userDto.getEmail());
                    if (userDto.getPhone()    != null)  existing.setPhone(userDto.getPhone());
                    if (userDto.getRole()     != null)  existing.setRole(parseRole(userDto.getRole()));
                    if (userDto.getStatus()   != null)  existing.setStatus(parseStatus(userDto.getStatus()));

                    // Cập nhật mật khẩu nếu client gửi lên password mới (plain text)
                    // Nếu gửi lên bcrypt hash cũ (bắt đầu $2a$ hoặc $2b$) thì giữ nguyên
                    if (userDto.getPassword() != null && !userDto.getPassword().isBlank()) {
                        String pwd = userDto.getPassword();
                        if (pwd.startsWith("$2a$") || pwd.startsWith("$2b$")) {
                            existing.setPassword(pwd); // Giữ nguyên hash cũ
                        } else {
                            existing.setPassword(passwordEncoder.encode(pwd)); // Encode password mới
                        }
                    }

                    User updated = userRepository.save(existing);
                    return ResponseEntity.ok(convertToDto(updated));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── DELETE ──────────────────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    // ─── HELPERS ─────────────────────────────────────────────────────────────

    /**
     * Chuyển User entity → UserDto (trả về frontend).
     * role/status trả về lowercase để khớp với React ("admin", "active", ...).
     * password trả về bcrypt hash để admin có thể xem.
     */
    private UserDto convertToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .password(user.getPassword())              // bcrypt hash
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole() != null
                        ? user.getRole().name().toLowerCase()   // "ADMIN" → "admin"
                        : "user")
                .status(user.getStatus() != null
                        ? user.getStatus().name().toLowerCase() // "ACTIVE" → "active"
                        : "active")
                .createdAt(user.getCreatedAt())
                .build();
    }

    /** Parse role string → UserRole enum (case-insensitive) */
    private UserRole parseRole(String roleStr) {
        if (roleStr == null) return UserRole.USER;
        try {
            return UserRole.valueOf(roleStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return UserRole.USER;
        }
    }

    /** Parse status string → UserStatus enum (case-insensitive) */
    private UserStatus parseStatus(String statusStr) {
        if (statusStr == null) return UserStatus.ACTIVE;
        try {
            return UserStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return UserStatus.ACTIVE;
        }
    }
}
