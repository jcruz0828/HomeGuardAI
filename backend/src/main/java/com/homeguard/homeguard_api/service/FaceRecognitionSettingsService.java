package com.homeguard.homeguard_api.service;

import com.homeguard.homeguard_api.dto.FaceRecognitionSettingsRequestDto;
import com.homeguard.homeguard_api.dto.FaceRecognitionSettingsResponseDto;
import com.homeguard.homeguard_api.model.FaceRecognitionSettings;
import com.homeguard.homeguard_api.model.Home;
import com.homeguard.homeguard_api.repository.FaceRecognitionSettingsRepository;
import com.homeguard.homeguard_api.repository.HomeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class FaceRecognitionSettingsService {
    
    private final FaceRecognitionSettingsRepository settingsRepository;
    private final HomeRepository homeRepository;
    
    @Transactional
    public FaceRecognitionSettingsResponseDto getOrCreateSettingsByHomeId(String homeId) {
        Home home = homeRepository.findById(homeId)
                .orElseThrow(() -> new RuntimeException("Home not found"));
        
        FaceRecognitionSettings settings = settingsRepository.findByHomeId(homeId)
                .orElseGet(() -> {
                    FaceRecognitionSettings newSettings = new FaceRecognitionSettings();
                    newSettings.setHome(home);
                    newSettings.setAiDetectionEnabled(true);
                    newSettings.setConfidenceThreshold(80);
                    newSettings.setFaceTolerance(0.6);
                    newSettings.setMaxRecognitionAttempts(3);
                    newSettings.setRecognitionCooldownSeconds(5);
                    newSettings.setRequireMultipleAngles(false);
                    return settingsRepository.save(newSettings);
                });
        
        return mapToResponseDto(settings);
    }
    
    @Transactional
    public FaceRecognitionSettingsResponseDto updateSettingsByHomeId(String homeId, FaceRecognitionSettingsRequestDto request) {
        Home home = homeRepository.findById(homeId)
                .orElseThrow(() -> new RuntimeException("Home not found"));
        
        FaceRecognitionSettings settings = settingsRepository.findByHomeId(homeId)
                .orElseGet(() -> {
                    FaceRecognitionSettings newSettings = new FaceRecognitionSettings();
                    newSettings.setHome(home);
                    return newSettings;
                });
        
        if (request.getAiDetectionEnabled() != null) {
            settings.setAiDetectionEnabled(request.getAiDetectionEnabled());
        }
        if (request.getConfidenceThreshold() != null) {
            settings.setConfidenceThreshold(request.getConfidenceThreshold());
        }
        if (request.getFaceTolerance() != null) {
            settings.setFaceTolerance(request.getFaceTolerance());
        }
        if (request.getMaxRecognitionAttempts() != null) {
            settings.setMaxRecognitionAttempts(request.getMaxRecognitionAttempts());
        }
        if (request.getRecognitionCooldownSeconds() != null) {
            settings.setRecognitionCooldownSeconds(request.getRecognitionCooldownSeconds());
        }
        if (request.getRequireMultipleAngles() != null) {
            settings.setRequireMultipleAngles(request.getRequireMultipleAngles());
        }
        
        settings.setUpdatedAt(LocalDateTime.now());
        FaceRecognitionSettings saved = settingsRepository.save(settings);
        
        return mapToResponseDto(saved);
    }
    
    @Transactional
    public void deleteSettingsByHomeId(String homeId) {
        settingsRepository.findByHomeId(homeId)
                .ifPresent(settingsRepository::delete);
    }
    
    private FaceRecognitionSettingsResponseDto mapToResponseDto(FaceRecognitionSettings settings) {
        FaceRecognitionSettingsResponseDto dto = new FaceRecognitionSettingsResponseDto();
        dto.setId(settings.getId());
        dto.setHomeId(settings.getHome().getId());
        dto.setAiDetectionEnabled(settings.getAiDetectionEnabled());
        dto.setConfidenceThreshold(settings.getConfidenceThreshold());
        dto.setFaceTolerance(settings.getFaceTolerance());
        dto.setMaxRecognitionAttempts(settings.getMaxRecognitionAttempts());
        dto.setRecognitionCooldownSeconds(settings.getRecognitionCooldownSeconds());
        dto.setRequireMultipleAngles(settings.getRequireMultipleAngles());
        dto.setCreatedAt(settings.getCreatedAt());
        dto.setUpdatedAt(settings.getUpdatedAt());
        return dto;
    }
}

