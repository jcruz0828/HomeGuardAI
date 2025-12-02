package com.homeguard.homeguard_api.service;

import com.homeguard.homeguard_api.dto.HomeActivityRequestDto;
import com.homeguard.homeguard_api.dto.HomeActivityResponseDto;
import com.homeguard.homeguard_api.model.HomeActivity;
import com.homeguard.homeguard_api.repository.HomeActivityRepository;
import com.homeguard.homeguard_api.repository.HomeRepository;
import com.homeguard.homeguard_api.repository.UserRepository;
import com.homeguard.homeguard_api.repository.PersonRepository;
import com.homeguard.homeguard_api.repository.DeviceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class HomeActivityService {
    
    private final HomeActivityRepository homeActivityRepository;
    private final HomeRepository homeRepository;
    private final UserRepository userRepository;
    private final PersonRepository personRepository;
    private final DeviceRepository deviceRepository;
    
    public HomeActivityResponseDto createActivity(HomeActivityRequestDto request) {
        HomeActivity activity = new HomeActivity();
        activity.setId(UUID.randomUUID().toString());
        activity.setHome(homeRepository.findById(request.getHomeId())
            .orElseThrow(() -> new RuntimeException("Home not found")));
        
        if (request.getUserId() != null) {
            // Gracefully handle missing users - set to null if not found
            // This allows activities to be created even if the user doesn't exist in the database
            activity.setUser(userRepository.findById(request.getUserId()).orElse(null));
        }
        
        if (request.getPersonId() != null) {
            // Gracefully handle missing persons - set to null if not found
            // This allows activities to be created even if the person doesn't exist in the database
            activity.setPerson(personRepository.findById(request.getPersonId()).orElse(null));
        }
        
        if (request.getDeviceId() != null) {
            // Gracefully handle missing devices - set to null if not found
            // This allows activities to be created even if the device doesn't exist in the database yet
            activity.setDevice(deviceRepository.findById(request.getDeviceId()).orElse(null));
        }
        
        activity.setActivityType(request.getActivityType());
        activity.setPriority(request.getPriority());
        activity.setTitle(request.getTitle());
        activity.setDescription(request.getDescription());
        activity.setLocation(request.getLocation());
        activity.setImagePath(request.getImagePath());
        activity.setConfidence(request.getConfidence());
        activity.setAdditionalData(request.getAdditionalData());
        activity.setActivityTimestamp(request.getActivityTimestamp());
        activity.setIsAcknowledged(false);
        activity.setIsResolved(false);
        activity.setCreatedAt(LocalDateTime.now());
        activity.setUpdatedAt(LocalDateTime.now());
        
        HomeActivity savedActivity = homeActivityRepository.save(activity);
        return mapToResponseDto(savedActivity);
    }
    
    public Page<HomeActivityResponseDto> getActivitiesByHomeId(String homeId, Pageable pageable) {
        Page<HomeActivity> activities = homeActivityRepository.findByHomeIdOrderByActivityTimestampDesc(homeId, pageable);
        return activities.map(this::mapToResponseDto);
    }
    
    public List<HomeActivityResponseDto> getRecentActivitiesByHomeId(String homeId, int hours) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        return homeActivityRepository.findRecentActivitiesByHomeId(homeId, since)
            .stream()
            .map(this::mapToResponseDto)
            .collect(Collectors.toList());
    }
    
    public List<HomeActivityResponseDto> getUnacknowledgedActivitiesByHomeId(String homeId) {
        return homeActivityRepository.findByHomeIdAndIsAcknowledgedFalseOrderByActivityTimestampDesc(homeId)
            .stream()
            .map(this::mapToResponseDto)
            .collect(Collectors.toList());
    }
    
    public List<HomeActivityResponseDto> getCriticalActivitiesByHomeId(String homeId) {
        return homeActivityRepository.findCriticalActivitiesByHomeId(homeId)
            .stream()
            .map(this::mapToResponseDto)
            .collect(Collectors.toList());
    }
    
    public HomeActivityResponseDto acknowledgeActivity(String activityId, String userId) {
        HomeActivity activity = homeActivityRepository.findById(activityId)
            .orElseThrow(() -> new RuntimeException("Activity not found"));
        
        activity.setIsAcknowledged(true);
        activity.setAcknowledgedAt(LocalDateTime.now());
        activity.setAcknowledgedByUserId(userId);
        activity.setUpdatedAt(LocalDateTime.now());
        
        HomeActivity savedActivity = homeActivityRepository.save(activity);
        return mapToResponseDto(savedActivity);
    }
    
    public HomeActivityResponseDto resolveActivity(String activityId, String userId) {
        HomeActivity activity = homeActivityRepository.findById(activityId)
            .orElseThrow(() -> new RuntimeException("Activity not found"));
        
        activity.setIsResolved(true);
        activity.setResolvedAt(LocalDateTime.now());
        activity.setResolvedByUserId(userId);
        activity.setUpdatedAt(LocalDateTime.now());
        
        HomeActivity savedActivity = homeActivityRepository.save(activity);
        return mapToResponseDto(savedActivity);
    }
    
    public Long getUnacknowledgedCountByHomeId(String homeId) {
        return homeActivityRepository.countUnacknowledgedActivitiesByHomeId(homeId);
    }
    
    public Long getUnresolvedCountByHomeId(String homeId) {
        return homeActivityRepository.countUnresolvedActivitiesByHomeId(homeId);
    }
    
    private HomeActivityResponseDto mapToResponseDto(HomeActivity activity) {
        HomeActivityResponseDto dto = new HomeActivityResponseDto();
        dto.setId(activity.getId());
        dto.setHomeId(activity.getHome().getId());
        dto.setHomeName(activity.getHome().getName());
        
        if (activity.getUser() != null) {
            dto.setUserId(activity.getUser().getId());
            dto.setUserName(activity.getUser().getFirstName() + " " + activity.getUser().getLastName());
        }
        
        if (activity.getPerson() != null) {
            dto.setPersonId(activity.getPerson().getId());
            dto.setPersonName(activity.getPerson().getName());
        }
        
        if (activity.getDevice() != null) {
            dto.setDeviceId(activity.getDevice().getId());
            dto.setDeviceName(activity.getDevice().getName());
        }
        
        dto.setActivityType(activity.getActivityType());
        dto.setPriority(activity.getPriority());
        dto.setTitle(activity.getTitle());
        dto.setDescription(activity.getDescription());
        dto.setLocation(activity.getLocation());
        dto.setImagePath(activity.getImagePath());
        dto.setConfidence(activity.getConfidence());
        dto.setIsAcknowledged(activity.getIsAcknowledged());
        dto.setAcknowledgedAt(activity.getAcknowledgedAt());
        dto.setAcknowledgedByUserId(activity.getAcknowledgedByUserId());
        dto.setAdditionalData(activity.getAdditionalData());
        dto.setActivityTimestamp(activity.getActivityTimestamp());
        dto.setIsResolved(activity.getIsResolved());
        dto.setResolvedAt(activity.getResolvedAt());
        dto.setResolvedByUserId(activity.getResolvedByUserId());
        dto.setCreatedAt(activity.getCreatedAt());
        dto.setUpdatedAt(activity.getUpdatedAt());
        
        return dto;
    }
}
