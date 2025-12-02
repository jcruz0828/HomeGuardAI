package com.homeguard.homeguard_api.service;

import com.homeguard.homeguard_api.enums.AccessResult;
import com.homeguard.homeguard_api.enums.AccessType;
import com.homeguard.homeguard_api.model.AccessLog;
import com.homeguard.homeguard_api.model.Device;
import com.homeguard.homeguard_api.model.Home;
import com.homeguard.homeguard_api.model.Person;
import com.homeguard.homeguard_api.repository.AccessLogRepository;
import com.homeguard.homeguard_api.repository.DeviceRepository;
import com.homeguard.homeguard_api.repository.HomeRepository;
import com.homeguard.homeguard_api.repository.PersonRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AccessLogService {
    
    private final AccessLogRepository accessLogRepository;
    private final DeviceRepository deviceRepository;
    private final PersonRepository personRepository;
    
    public AccessLog createAccessLog(AccessLog accessLog) {
        if (accessLog.getId() == null || accessLog.getId().isEmpty()) {
            accessLog.setId(UUID.randomUUID().toString());
        }
        if (accessLog.getCreatedAt() == null) {
            accessLog.setCreatedAt(LocalDateTime.now());
        }
        accessLog.setUpdatedAt(LocalDateTime.now());
        return accessLogRepository.save(accessLog);
    }
    
    /**
     * Log face recognition event (recognized or not recognized)
     * Called by edge device when face recognition occurs
     */
    public void logFaceRecognition(String deviceId, String personId, boolean recognized, 
                                   Double confidence, String imagePath, String reason) {
        try {
            Device device = deviceRepository.findById(deviceId).orElse(null);
            if (device == null) {
                log.warn("Device not found for face recognition log: {}", deviceId);
                return;
            }
            
            Person person = personId != null ? personRepository.findById(personId).orElse(null) : null;
            Home home = device.getHome();
            
            AccessLog accessLog = new AccessLog();
            accessLog.setDevice(device);
            accessLog.setPerson(person);
            accessLog.setHome(home);
            accessLog.setAccessType(AccessType.FACIAL_RECOGNITION);
            accessLog.setResult(recognized ? AccessResult.GRANTED : AccessResult.DENIED);
            accessLog.setConfidence(confidence);
            accessLog.setImagePath(imagePath);
            accessLog.setReason(reason != null ? reason : (recognized ? "Person recognized" : "Person not recognized"));
            accessLog.setLocation(home != null ? home.getAddress() : null);
            
            createAccessLog(accessLog);
            log.info("Logged face recognition: recognized={}, personId={}, deviceId={}", 
                    recognized, personId, deviceId);
        } catch (Exception e) {
            log.error("Failed to log face recognition: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Log lock/unlock event
     * Called when a user locks or unlocks a device
     */
    public void logLockUnlock(String deviceId, AccessType lockType, String personId, 
                             AccessResult result, String reason) {
        try {
            Device device = deviceRepository.findById(deviceId).orElse(null);
            if (device == null) {
                log.warn("Device not found for lock/unlock log: {}", deviceId);
                return;
            }
            
            Person person = personId != null ? personRepository.findById(personId).orElse(null) : null;
            Home home = device.getHome();
            
            AccessLog accessLog = new AccessLog();
            accessLog.setDevice(device);
            accessLog.setPerson(person);
            accessLog.setHome(home);
            accessLog.setAccessType(lockType); // LOCK or UNLOCK
            accessLog.setResult(result);
            accessLog.setReason(reason);
            accessLog.setLocation(home != null ? home.getAddress() : null);
            
            createAccessLog(accessLog);
            log.info("Logged {} operation: deviceId={}, result={}", lockType, deviceId, result);
        } catch (Exception e) {
            log.error("Failed to log lock/unlock: {}", e.getMessage(), e);
        }
    }
    
    public Page<AccessLog> getAccessLogsByHomeId(String homeId, Pageable pageable) {
        return accessLogRepository.findAccessLogsByHomeId(homeId, pageable);
    }
    
    public List<AccessLog> getAccessLogsByDeviceId(String deviceId) {
        return accessLogRepository.findByDeviceIdOrderByCreatedAtDesc(deviceId, Pageable.unpaged()).getContent();
    }
    
    public List<AccessLog> getAccessLogsByPersonId(String personId) {
        return accessLogRepository.findByPersonIdOrderByCreatedAtDesc(personId);
    }
    
    public List<AccessLog> getAccessLogsByHomeIdAndTimeRange(String homeId, LocalDateTime startTime, LocalDateTime endTime) {
        return accessLogRepository.findAccessLogsByHomeIdAndTimeRange(homeId, startTime, endTime);
    }
}
