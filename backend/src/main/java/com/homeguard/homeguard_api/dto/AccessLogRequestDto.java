package com.homeguard.homeguard_api.dto;

import com.homeguard.homeguard_api.enums.AccessResult;
import com.homeguard.homeguard_api.enums.AccessType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AccessLogRequestDto {
    
    private String deviceId; // Optional - not required for home CRUD operations
    
    private String homeId; // Optional - for home CRUD operations or when device is not available
    
    private String userId; // Optional - for user-initiated operations
    
    private String personId; // Optional - for person recognition events
    
    @NotNull
    private AccessType accessType;
    
    @NotNull
    private AccessResult result;
    
    @Size(max = 500)
    private String reason;
    
    @Size(max = 500)
    private String imagePath;
    
    @Size(max = 200)
    private String location;
    
    private Double confidence;
    
    @Size(max = 100)
    private String faceId;
    
    @Size(max = 1000)
    private String additionalData;
}
