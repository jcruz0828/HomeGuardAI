package com.homeguard.homeguard_api.controller;

import com.homeguard.homeguard_api.dto.UserRequestDto;
import com.homeguard.homeguard_api.dto.UserResponseDto;
import com.homeguard.homeguard_api.dto.UserUpdateDto;
import com.homeguard.homeguard_api.enums.Role;
import com.homeguard.homeguard_api.enums.UserState;
import com.homeguard.homeguard_api.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${base.path}/users")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class UserController {
    
    private final UserService userService;
    
    @PostMapping
    public ResponseEntity<UserResponseDto> createUser(@Valid @RequestBody UserRequestDto requestDto) {
        log.info("Creating new user with email: {}", requestDto.getEmail());
        UserResponseDto responseDto = userService.createUser(requestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDto> getUserById(@PathVariable String id) {
        log.info("=== GET USER BY ID REQUEST ===");
        log.info("Fetching user with id: {}", id);
        log.info("ID length: {}", id != null ? id.length() : 0);
        
        try {
        UserResponseDto responseDto = userService.getUserById(id);
            log.info("✅ User found successfully: id={}, email={}", id, responseDto.getEmail());
            log.info("=== GET USER BY ID SUCCESS ===");
        return ResponseEntity.ok(responseDto);
        } catch (Exception e) {
            log.error("❌ Error fetching user with id: {}", id, e);
            log.error("Exception type: {}", e.getClass().getName());
            log.error("Exception message: {}", e.getMessage());
            log.error("Stack trace:", e);
            log.error("=== GET USER BY ID FAILED ===");
            throw e;
        }
    }
    
    @GetMapping("/email/{email}")
    public ResponseEntity<UserResponseDto> getUserByEmail(@PathVariable String email) {
        log.info("Fetching user with email: {}", email);
        UserResponseDto responseDto = userService.getUserByEmail(email);
        return ResponseEntity.ok(responseDto);
    }
    
    @GetMapping
    public ResponseEntity<List<UserResponseDto>> getAllUsers() {
        log.info("Fetching all users");
        List<UserResponseDto> responseDtos = userService.getAllUsers();
        return ResponseEntity.ok(responseDtos);
    }
    
    @GetMapping("/page")
    public ResponseEntity<Page<UserResponseDto>> getAllUsers(Pageable pageable) {
        log.info("Fetching users with pagination");
        Page<UserResponseDto> responseDtos = userService.getAllUsers(pageable);
        return ResponseEntity.ok(responseDtos);
    }
    
    @GetMapping("/role/{role}")
    public ResponseEntity<List<UserResponseDto>> getUsersByRole(@PathVariable Role role) {
        log.info("Fetching users with role: {}", role);
        List<UserResponseDto> responseDtos = userService.getUsersByRole(role);
        return ResponseEntity.ok(responseDtos);
    }
    
    @GetMapping("/state/{userState}")
    public ResponseEntity<List<UserResponseDto>> getUsersByState(@PathVariable UserState userState) {
        log.info("Fetching users with state: {}", userState);
        List<UserResponseDto> responseDtos = userService.getUsersByState(userState);
        return ResponseEntity.ok(responseDtos);
    }
    
    @GetMapping("/home/{homeId}")
    public ResponseEntity<List<UserResponseDto>> getUsersByHomeId(@PathVariable String homeId) {
        log.info("Fetching users for home id: {}", homeId);
        List<UserResponseDto> responseDtos = userService.getUsersByHomeId(homeId);
        return ResponseEntity.ok(responseDtos);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<UserResponseDto> updateUser(@PathVariable String id, 
                                                     @Valid @RequestBody UserUpdateDto updateDto) {
        log.info("Updating user with id: {}", id);
        UserResponseDto responseDto = userService.updateUser(id, updateDto);
        return ResponseEntity.ok(responseDto);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        log.info("Deleting user with id: {}", id);
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
    
    @PatchMapping("/{id}/activate")
    public ResponseEntity<UserResponseDto> activateUser(@PathVariable String id) {
        log.info("Activating user with id: {}", id);
        UserResponseDto responseDto = userService.activateUser(id);
        return ResponseEntity.ok(responseDto);
    }
    
    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<UserResponseDto> deactivateUser(@PathVariable String id) {
        log.info("Deactivating user with id: {}", id);
        UserResponseDto responseDto = userService.deactivateUser(id);
        return ResponseEntity.ok(responseDto);
    }
    
    @PatchMapping("/{id}/lock")
    public ResponseEntity<UserResponseDto> lockUser(@PathVariable String id) {
        log.info("Locking user with id: {}", id);
        UserResponseDto responseDto = userService.lockUser(id);
        return ResponseEntity.ok(responseDto);
    }
    
    @PatchMapping("/{id}/unlock")
    public ResponseEntity<UserResponseDto> unlockUser(@PathVariable String id) {
        log.info("Unlocking user with id: {}", id);
        UserResponseDto responseDto = userService.unlockUser(id);
        return ResponseEntity.ok(responseDto);
    }
}
