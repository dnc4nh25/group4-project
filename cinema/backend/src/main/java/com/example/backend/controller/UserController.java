package com.example.backend.controller;

import com.example.backend.dto.UserDto;
import com.example.backend.entity.User;
import com.example.backend.enums.UserRole;
import com.example.backend.enums.UserStatus;
import com.example.backend.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "/api/users", produces = MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ─── GET ALL (có filter + phân trang) ────────────────────────────────────
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllUsers(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "") String role,
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Specification<User> spec = buildSpec(search, role, status);
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<User> userPage = userRepository.findAll(spec, pageable);

        List<UserDto> dtos = userPage.getContent().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", dtos);
        response.put("totalElements", userPage.getTotalElements());
        response.put("totalPages", userPage.getTotalPages());
        response.put("currentPage", userPage.getNumber());
        response.put("size", userPage.getSize());

        return ResponseEntity.ok(response);
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
        if (userRepository.findByUsername(userDto.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().build();
        }

        User user = User.builder()
                .username(userDto.getUsername())
                .fullName(userDto.getFullName())
                .email(userDto.getEmail())
                .phone(userDto.getPhone())
                .role(UserRole.ADMIN) // Force ADMIN khi tạo qua trang quản lý
                .status(parseStatus(userDto.getStatus()))
                .build();

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
                    if (userDto.getFullName() != null) existing.setFullName(userDto.getFullName());
                    if (userDto.getEmail()    != null) existing.setEmail(userDto.getEmail());
                    if (userDto.getPhone()    != null) existing.setPhone(userDto.getPhone());
                    if (userDto.getRole()     != null) existing.setRole(parseRole(userDto.getRole()));
                    if (userDto.getStatus()   != null) existing.setStatus(parseStatus(userDto.getStatus()));

                    // Chỉ encode nếu là plain text mới; giữ nguyên nếu là bcrypt hash cũ
                    if (userDto.getPassword() != null && !userDto.getPassword().isBlank()) {
                        String pwd = userDto.getPassword();
                        if (pwd.startsWith("$2a$") || pwd.startsWith("$2b$")) {
                            existing.setPassword(pwd);
                        } else {
                            existing.setPassword(passwordEncoder.encode(pwd));
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

    /** Xây dựng Specification động theo search / role / status */
    private Specification<User> buildSpec(String search, String role, String status) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isBlank()) {
                String like = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("username")), like),
                        cb.like(cb.lower(root.get("fullName")), like)
                ));
            }

            if (role != null && !role.isBlank()) {
                try {
                    predicates.add(cb.equal(root.get("role"), UserRole.valueOf(role.toUpperCase())));
                } catch (IllegalArgumentException ignored) {}
            }

            if (status != null && !status.isBlank()) {
                try {
                    predicates.add(cb.equal(root.get("status"), UserStatus.valueOf(status.toUpperCase())));
                } catch (IllegalArgumentException ignored) {}
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /** Chuyển User entity → UserDto (role/status trả về lowercase để khớp React) */
    private UserDto convertToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .password(user.getPassword())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole() != null ? user.getRole().name().toLowerCase() : "user")
                .status(user.getStatus() != null ? user.getStatus().name().toLowerCase() : "active")
                .createdAt(user.getCreatedAt())
                .build();
    }

    private UserRole parseRole(String roleStr) {
        if (roleStr == null) return UserRole.USER;
        try { return UserRole.valueOf(roleStr.toUpperCase()); }
        catch (IllegalArgumentException e) { return UserRole.USER; }
    }

    private UserStatus parseStatus(String statusStr) {
        if (statusStr == null) return UserStatus.ACTIVE;
        try { return UserStatus.valueOf(statusStr.toUpperCase()); }
        catch (IllegalArgumentException e) { return UserStatus.ACTIVE; }
    }
}
