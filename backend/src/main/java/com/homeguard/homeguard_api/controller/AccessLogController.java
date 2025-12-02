package com.homeguard.homeguard_api.controller;

import com.homeguard.homeguard_api.dto.AccessLogRequestDto;
import com.homeguard.homeguard_api.dto.AccessLogResponseDto;
import com.homeguard.homeguard_api.enums.AccessResult;
import com.homeguard.homeguard_api.enums.AccessType;
import com.homeguard.homeguard_api.model.AccessLog;
import com.homeguard.homeguard_api.service.AccessLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("${base.path}/access-logs")
@RequiredArgsConstructor
public class AccessLogController {
    
    private final AccessLogService accessLogService;
    
    @PostMapping
    public ResponseEntity<AccessLogResponseDto> createAccessLog(@RequestBody AccessLogRequestDto request) {
        AccessLog accessLog = mapToEntity(request);
        AccessLog savedAccessLog = accessLogService.createAccessLog(accessLog);
        AccessLogResponseDto response = mapToResponseDto(savedAccessLog);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    @GetMapping("/homes/{homeId}")
    public ResponseEntity<Page<AccessLogResponseDto>> getAccessLogsByHomeId(
            @PathVariable String homeId,
            Pageable pageable) {
        Page<AccessLog> accessLogs = accessLogService.getAccessLogsByHomeId(homeId, pageable);
        Page<AccessLogResponseDto> response = accessLogs.map(this::mapToResponseDto);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/devices/{deviceId}")
    public ResponseEntity<List<AccessLogResponseDto>> getAccessLogsByDeviceId(@PathVariable String deviceId) {
        List<AccessLog> accessLogs = accessLogService.getAccessLogsByDeviceId(deviceId);
        List<AccessLogResponseDto> response = accessLogs.stream()
            .map(this::mapToResponseDto)
            .toList();
        return ResponseEntity.ok(response);
    }
    
    /**
     * Endpoint for edge device to log face recognition event
     * POST /api/v1/access-logs/face-recognition
     * Body: { deviceId, personId (optional), recognized (boolean), confidence (optional), imagePath (optional), reason (optional) }
     */
    @PostMapping("/face-recognition")
    public ResponseEntity<AccessLogResponseDto> logFaceRecognition(@RequestBody FaceRecognitionLogRequest request) {
        accessLogService.logFaceRecognition(
            request.getDeviceId(), 
            request.getPersonId(), 
            request.isRecognized(), 
            request.getConfidence(), 
            request.getImagePath(), 
            request.getReason()
        );
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
    
    /**
     * Endpoint for logging lock/unlock events
     * POST /api/v1/access-logs/lock-unlock
     * Body: { deviceId, lockType (LOCK/UNLOCK), personId (optional), result, reason (optional) }
     */
    @PostMapping("/lock-unlock")
    public ResponseEntity<AccessLogResponseDto> logLockUnlock(@RequestBody LockUnlockLogRequest request) {
        accessLogService.logLockUnlock(
            request.getDeviceId(), 
            request.getLockType(), 
            request.getPersonId(), 
            request.getResult(), 
            request.getReason()
        );
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
    
    // Inner classes for request DTOs
    @lombok.Getter
    @lombok.Setter
    private static class FaceRecognitionLogRequest {
        private String deviceId;
        private String personId;
        private boolean recognized;
        private Double confidence;
        private String imagePath;
        private String reason;
    }
    
    @lombok.Getter
    @lombok.Setter
    private static class LockUnlockLogRequest {
        private String deviceId;
        private AccessType lockType;
        private String personId;
        private AccessResult result;
        private String reason;
    }
    
    @GetMapping("/persons/{personId}")
    public ResponseEntity<List<AccessLogResponseDto>> getAccessLogsByPersonId(@PathVariable String personId) {
        List<AccessLog> accessLogs = accessLogService.getAccessLogsByPersonId(personId);
        List<AccessLogResponseDto> response = accessLogs.stream()
            .map(this::mapToResponseDto)
            .toList();
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/homes/{homeId}/time-range")
    public ResponseEntity<List<AccessLogResponseDto>> getAccessLogsByHomeIdAndTimeRange(
            @PathVariable String homeId,
            @RequestParam LocalDateTime startTime,
            @RequestParam LocalDateTime endTime) {
        List<AccessLog> accessLogs = accessLogService.getAccessLogsByHomeIdAndTimeRange(homeId, startTime, endTime);
        List<AccessLogResponseDto> response = accessLogs.stream()
            .map(this::mapToResponseDto)
            .toList();
        return ResponseEntity.ok(response);
    }
    
    private AccessLog mapToEntity(AccessLogRequestDto dto) {
        AccessLog accessLog = new AccessLog();
        // Note: This is a simplified mapping - in a real implementation,
        // you'd need to fetch related entities by ID
        accessLog.setAccessType(dto.getAccessType());
        accessLog.setResult(dto.getResult());
        accessLog.setReason(dto.getReason());
        accessLog.setImagePath(dto.getImagePath());
        accessLog.setLocation(dto.getLocation());
        accessLog.setConfidence(dto.getConfidence());
        accessLog.setFaceId(dto.getFaceId());
        accessLog.setAdditionalData(dto.getAdditionalData());
        return accessLog;
    }
    
    private AccessLogResponseDto mapToResponseDto(AccessLog accessLog) {
        AccessLogResponseDto dto = new AccessLogResponseDto();
        dto.setId(accessLog.getId());
        
        if (accessLog.getUser() != null) {
            dto.setUserId(accessLog.getUser().getId());
            dto.setUserName(accessLog.getUser().getFirstName() + " " + accessLog.getUser().getLastName());
        }
        
        if (accessLog.getPerson() != null) {
            dto.setPersonId(accessLog.getPerson().getId());
            dto.setPersonName(accessLog.getPerson().getName());
        }
        
        if (accessLog.getDevice() != null) {
            dto.setDeviceId(accessLog.getDevice().getId());
            dto.setDeviceName(accessLog.getDevice().getName());
            if (accessLog.getDevice().getHome() != null) {
                dto.setHomeId(accessLog.getDevice().getHome().getId());
                dto.setHomeName(accessLog.getDevice().getHome().getName());
            }
        }
        
        // Also check direct home reference (for home CRUD operations)
        if (accessLog.getHome() != null && dto.getHomeId() == null) {
            dto.setHomeId(accessLog.getHome().getId());
            dto.setHomeName(accessLog.getHome().getName());
        }
        
        dto.setAccessType(accessLog.getAccessType());
        dto.setResult(accessLog.getResult());
        dto.setReason(accessLog.getReason());
        dto.setImagePath(accessLog.getImagePath());
        dto.setLocation(accessLog.getLocation());
        dto.setConfidence(accessLog.getConfidence());
        dto.setFaceId(accessLog.getFaceId());
        dto.setAdditionalData(accessLog.getAdditionalData());
        dto.setCreatedAt(accessLog.getCreatedAt());
        dto.setUpdatedAt(accessLog.getUpdatedAt());
        
        return dto;
    }
}
