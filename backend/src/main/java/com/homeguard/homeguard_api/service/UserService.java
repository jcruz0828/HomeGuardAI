package com.homeguard.homeguard_api.service;

import com.homeguard.homeguard_api.dto.UserRequestDto;
import com.homeguard.homeguard_api.dto.UserResponseDto;
import com.homeguard.homeguard_api.dto.UserUpdateDto;
import com.homeguard.homeguard_api.enums.Role;
import com.homeguard.homeguard_api.enums.UserState;
import com.homeguard.homeguard_api.exception.InvalidUserStateException;
import com.homeguard.homeguard_api.exception.UserAlreadyExistsException;
import com.homeguard.homeguard_api.exception.UserNotFoundException;
import com.homeguard.homeguard_api.model.User;
import com.homeguard.homeguard_api.model.AppSettings;
import com.homeguard.homeguard_api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserService {
    
    private final UserRepository userRepository;
    
    public UserResponseDto createUser(UserRequestDto requestDto) {
        log.info("Creating user with email: {} and id: {}", requestDto.getEmail(), requestDto.getId());
        
        // Check if user already exists by email
        if (userRepository.existsByEmail(requestDto.getEmail())) {
            log.warn("User already exists with email: {}", requestDto.getEmail());
            throw UserAlreadyExistsException.withEmail(requestDto.getEmail());
        }
        
        // Check if user already exists by ID (if ID is provided)
        if (requestDto.getId() != null && !requestDto.getId().isEmpty()) {
            if (userRepository.existsById(requestDto.getId())) {
                log.warn("User already exists with id: {}", requestDto.getId());
                // Return existing user instead of throwing error
                User existingUser = userRepository.findById(requestDto.getId())
                    .orElseThrow(() -> new RuntimeException("User exists but could not be retrieved"));
                return convertToResponseDto(existingUser);
            }
        }
        
        // Create new user
        User user = new User();
        // Set ID if provided (from Supabase)
        if (requestDto.getId() != null && !requestDto.getId().isEmpty()) {
            user.setId(requestDto.getId());
        }
        user.setEmail(requestDto.getEmail());
        user.setFirstName(requestDto.getFirstName());
        user.setLastName(requestDto.getLastName());
        user.setPhoneNumber(requestDto.getPhoneNumber());
        user.setRole(requestDto.getRole());
        user.setAddress(requestDto.getAddress());
        user.setCity(requestDto.getCity());
        user.setState(requestDto.getState());
        user.setZipCode(requestDto.getZipCode());
        user.setUserState(requestDto.getUserState());
        user.setEmergencyContact(requestDto.getEmergencyContact());
        
        User savedUser = userRepository.save(user);
        log.info("User created successfully with id: {}", savedUser.getId());
        
        // Create default app settings for the new user
        AppSettings defaultSettings = new AppSettings();
        defaultSettings.setUser(savedUser);
        // All other fields will use the default values defined in the AppSettings model
        savedUser.setAppSettings(defaultSettings);
        userRepository.save(savedUser);
        log.info("Default app settings created for user id: {}", savedUser.getId());
        
        return convertToResponseDto(savedUser);
    }
    
    @Transactional(readOnly = true)
    public UserResponseDto getUserById(String id) {
        log.info("Fetching user with id: {}", id);
        
        User user = userRepository.findById(id)
            .orElseThrow(() -> UserNotFoundException.withId(id));
        
        return convertToResponseDto(user);
    }
    
    @Transactional(readOnly = true)
    public UserResponseDto getUserByEmail(String email) {
        log.info("Fetching user with email: {}", email);
        
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> UserNotFoundException.withEmail(email));
        
        return convertToResponseDto(user);
    }
    
    @Transactional(readOnly = true)
    public List<UserResponseDto> getAllUsers() {
        log.info("Fetching all users");
        
        return userRepository.findAll().stream()
            .map(this::convertToResponseDto)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public Page<UserResponseDto> getAllUsers(Pageable pageable) {
        log.info("Fetching users with pagination");
        
        return userRepository.findAll(pageable)
            .map(this::convertToResponseDto);
    }
    
    @Transactional(readOnly = true)
    public List<UserResponseDto> getUsersByRole(Role role) {
        log.info("Fetching users with role: {}", role);
        
        return userRepository.findByRole(role).stream()
            .map(this::convertToResponseDto)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<UserResponseDto> getUsersByState(UserState userState) {
        log.info("Fetching users with state: {}", userState);
        
        return userRepository.findByUserState(userState).stream()
            .map(this::convertToResponseDto)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<UserResponseDto> getUsersByHomeId(String homeId) {
        log.info("Fetching users for home id: {}", homeId);
        
        return userRepository.findByHomeId(homeId).stream()
            .map(this::convertToResponseDto)
            .collect(Collectors.toList());
    }
    
    public UserResponseDto updateUser(String id, UserUpdateDto updateDto) {
        log.info("Updating user with id: {}", id);
        
        User user = userRepository.findById(id)
            .orElseThrow(() -> UserNotFoundException.withId(id));
        
        // Update fields if provided
        if (updateDto.getFirstName() != null) {
            user.setFirstName(updateDto.getFirstName());
        }
        if (updateDto.getLastName() != null) {
            user.setLastName(updateDto.getLastName());
        }
        if (updateDto.getPhoneNumber() != null) {
            user.setPhoneNumber(updateDto.getPhoneNumber());
        }
        if (updateDto.getRole() != null) {
            user.setRole(updateDto.getRole());
        }
        if (updateDto.getAddress() != null) {
            user.setAddress(updateDto.getAddress());
        }
        if (updateDto.getCity() != null) {
            user.setCity(updateDto.getCity());
        }
        if (updateDto.getState() != null) {
            user.setState(updateDto.getState());
        }
        if (updateDto.getZipCode() != null) {
            user.setZipCode(updateDto.getZipCode());
        }
        if (updateDto.getUserState() != null) {
            user.setUserState(updateDto.getUserState());
        }
        if (updateDto.getEmergencyContact() != null) {
            user.setEmergencyContact(updateDto.getEmergencyContact());
        }
        
        User updatedUser = userRepository.save(user);
        log.info("User updated successfully with id: {}", updatedUser.getId());
        
        return convertToResponseDto(updatedUser);
    }
    
    public void deleteUser(String id) {
        log.info("Deleting user with id: {}", id);
        
        User user = userRepository.findById(id)
            .orElseThrow(() -> UserNotFoundException.withId(id));
        
        userRepository.delete(user);
        log.info("User deleted successfully with id: {}", id);
    }
    
    public UserResponseDto activateUser(String id) {
        log.info("Activating user with id: {}", id);
        
        User user = userRepository.findById(id)
            .orElseThrow(() -> UserNotFoundException.withId(id));
        
        if (user.getUserState() == UserState.ACTIVE) {
            throw InvalidUserStateException.forOperation("activate", user.getUserState());
        }
        
        user.setUserState(UserState.ACTIVE);
        User updatedUser = userRepository.save(user);
        
        return convertToResponseDto(updatedUser);
    }
    
    public UserResponseDto deactivateUser(String id) {
        log.info("Deactivating user with id: {}", id);
        
        User user = userRepository.findById(id)
            .orElseThrow(() -> UserNotFoundException.withId(id));
        
        if (user.getUserState() == UserState.INACTIVE) {
            throw InvalidUserStateException.forOperation("deactivate", user.getUserState());
        }
        
        user.setUserState(UserState.INACTIVE);
        User updatedUser = userRepository.save(user);
        
        return convertToResponseDto(updatedUser);
    }
    
    public UserResponseDto lockUser(String id) {
        log.info("Locking user with id: {}", id);
        
        User user = userRepository.findById(id)
            .orElseThrow(() -> UserNotFoundException.withId(id));
        
        if (user.getUserState() == UserState.LOCKED) {
            throw InvalidUserStateException.forOperation("lock", user.getUserState());
        }
        
        user.setUserState(UserState.LOCKED);
        User updatedUser = userRepository.save(user);
        
        return convertToResponseDto(updatedUser);
    }
    
    public UserResponseDto unlockUser(String id) {
        log.info("Unlocking user with id: {}", id);
        
        User user = userRepository.findById(id)
            .orElseThrow(() -> UserNotFoundException.withId(id));
        
        if (user.getUserState() != UserState.LOCKED) {
            throw InvalidUserStateException.forOperation("unlock", user.getUserState());
        }
        
        user.setUserState(UserState.ACTIVE);
        User updatedUser = userRepository.save(user);
        
        return convertToResponseDto(updatedUser);
    }
    
    private UserResponseDto convertToResponseDto(User user) {
        UserResponseDto responseDto = new UserResponseDto();
        responseDto.setId(user.getId());
        responseDto.setEmail(user.getEmail());
        responseDto.setFirstName(user.getFirstName());
        responseDto.setLastName(user.getLastName());
        responseDto.setPhoneNumber(user.getPhoneNumber());
        responseDto.setRole(user.getRole());
        responseDto.setAddress(user.getAddress());
        responseDto.setCity(user.getCity());
        responseDto.setState(user.getState());
        responseDto.setZipCode(user.getZipCode());
        responseDto.setUserState(user.getUserState());
        responseDto.setEmergencyContact(user.getEmergencyContact());
        responseDto.setCreatedAt(user.getCreatedAt());
        responseDto.setUpdatedAt(user.getUpdatedAt());
        
        // Set computed fields
        responseDto.setFullName(user.getFirstName() + " " + user.getLastName());
        responseDto.setHasFaceProfile(false); // Face profiles are now handled through Person entities
        responseDto.setDeviceCount(user.getDevices() != null ? user.getDevices().size() : 0);
        responseDto.setHomeCount(user.getHomes() != null ? user.getHomes().size() : 0);
        
        return responseDto;
    }
}
