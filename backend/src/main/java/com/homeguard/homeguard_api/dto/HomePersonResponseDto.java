package com.homeguard.homeguard_api.dto;

import com.homeguard.homeguard_api.enums.AccessLevel;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class HomePersonResponseDto {
    
    private String id;
    private String homeId;
    private String personId;
    private AccessLevel accessLevel;
    private String accessExpiresAt;
    private boolean isActive;
    private String notes;
    private String lastAccessed;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Automatic access fields
    private Boolean automaticAccessEnabled;
    private Integer automaticAccessCount;
    private Integer automaticAccessLimit;
    private String automaticAccessResetPeriod;
    private String automaticAccessLastReset;
    
    // Nested person info
    private PersonInfo person;
    
    @Getter
    @Setter
    public static class PersonInfo {
        private String id;
        private String name;
        private String personType;
        private String profileImagePath;
    }
}
