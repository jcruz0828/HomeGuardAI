package com.homeguard.homeguard_api.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class FaceRecognitionSettingsResponseDto {
    
    private String id;
    private String homeId;
    private Boolean aiDetectionEnabled;
    private Integer confidenceThreshold;
    private Double faceTolerance;
    private Integer maxRecognitionAttempts;
    private Integer recognitionCooldownSeconds;
    private Boolean requireMultipleAngles;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

