package com.example.backend.controller;

import com.example.backend.dto.ContactMessageDto;
import com.example.backend.entity.ContactMessage;
import com.example.backend.entity.User;
import com.example.backend.repository.ContactMessageRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "/api/contact-messages", produces = MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8")
@CrossOrigin(origins = "*")
public class ContactMessageController {

    @Autowired
    private ContactMessageRepository contactMessageRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<ContactMessageDto>> getAllContactMessages() {
        List<ContactMessageDto> messages = contactMessageRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContactMessageDto> getContactMessageById(@PathVariable Long id) {
        return contactMessageRepository.findById(id)
                .map(message -> ResponseEntity.ok(convertToDto(message)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ContactMessageDto>> getContactMessagesByUser(@PathVariable Long userId) {
        List<ContactMessageDto> messages = contactMessageRepository.findByUserId(userId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(messages);
    }

    @PostMapping
    public ResponseEntity<ContactMessageDto> createContactMessage(@RequestBody ContactMessageDto messageDto) {
        User user = null;
        if (messageDto.getUserId() != null) {
            user = userRepository.findById(messageDto.getUserId()).orElse(null);
        }

        ContactMessage message = convertToEntity(messageDto, user);
        ContactMessage saved = contactMessageRepository.save(message);
        return ResponseEntity.ok(convertToDto(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ContactMessageDto> updateContactMessage(@PathVariable Long id, @RequestBody ContactMessageDto messageDto) {
        return contactMessageRepository.findById(id)
                .map(existingMessage -> {
                    updateEntityFromDto(existingMessage, messageDto);
                    ContactMessage updated = contactMessageRepository.save(existingMessage);
                    return ResponseEntity.ok(convertToDto(updated));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ContactMessageDto> patchContactMessage(@PathVariable Long id, @RequestBody ContactMessageDto messageDto) {
        return updateContactMessage(id, messageDto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteContactMessage(@PathVariable Long id) {
        if (contactMessageRepository.existsById(id)) {
            contactMessageRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    private ContactMessageDto convertToDto(ContactMessage message) {
        return ContactMessageDto.builder()
                .id(message.getId())
                .name(message.getName())
                .email(message.getEmail())
                .phone(message.getPhone())
                .subject(message.getSubject())
                .message(message.getMessage())
                .userId(message.getUser() != null ? message.getUser().getId() : null)
                .status(message.getStatus())
                .adminReply(message.getAdminReply())
                .createdAt(message.getCreatedAt())
                .repliedAt(message.getRepliedAt())
                .build();
    }

    private ContactMessage convertToEntity(ContactMessageDto dto, User user) {
        return ContactMessage.builder()
                .name(dto.getName())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .subject(dto.getSubject())
                .message(dto.getMessage())
                .user(user)
                .status(dto.getStatus() != null ? dto.getStatus() : "pending")
                .adminReply(dto.getAdminReply())
                .createdAt(dto.getCreatedAt() != null ? dto.getCreatedAt() : LocalDateTime.now())
                .repliedAt(dto.getRepliedAt())
                .build();
    }

    private void updateEntityFromDto(ContactMessage message, ContactMessageDto dto) {
        if (dto.getName() != null) message.setName(dto.getName());
        if (dto.getEmail() != null) message.setEmail(dto.getEmail());
        if (dto.getPhone() != null) message.setPhone(dto.getPhone());
        if (dto.getSubject() != null) message.setSubject(dto.getSubject());
        if (dto.getMessage() != null) message.setMessage(dto.getMessage());
        if (dto.getStatus() != null) message.setStatus(dto.getStatus());
        if (dto.getAdminReply() != null) {
            message.setAdminReply(dto.getAdminReply());
            if (message.getRepliedAt() == null) {
                message.setRepliedAt(LocalDateTime.now());
            }
        }
        if (dto.getRepliedAt() != null) message.setRepliedAt(dto.getRepliedAt());
    }
}
