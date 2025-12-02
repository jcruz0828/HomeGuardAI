package com.homeguard.homeguard_api.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.homeguard.homeguard_api.enums.ActivityPriority;
import com.homeguard.homeguard_api.enums.ActivityType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class HomeActivityRequestDto {
    
    @NotNull
    private String homeId;
    
    private String userId;
    
    private String personId;
    
    private String deviceId;
    
    @NotNull
    private ActivityType activityType;
    
    private ActivityPriority priority = ActivityPriority.MEDIUM;
    
    @NotNull
    @Size(max = 500)
    private String title;
    
    @Size(max = 1000)
    private String description;
    
    @Size(max = 500)
    private String location;
    
    @Size(max = 500)
    private String imagePath;
    
    private Double confidence;
    
    @Size(max = 1000)
    private String additionalData;
    
    @NotNull
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private LocalDateTime activityTimestamp;
}
