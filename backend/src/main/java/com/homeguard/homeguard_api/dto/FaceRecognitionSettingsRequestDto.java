package com.homeguard.homeguard_api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FaceRecognitionSettingsRequestDto {
    
    private Boolean aiDetectionEnabled;
    
    @Min(0)
    @Max(100)
    private Integer confidenceThreshold;
    
    @Min(0)
    @Max(1)
    private Double faceTolerance;
    
    private Integer maxRecognitionAttempts;
    
    private Integer recognitionCooldownSeconds;
    
    private Boolean requireMultipleAngles;
}

