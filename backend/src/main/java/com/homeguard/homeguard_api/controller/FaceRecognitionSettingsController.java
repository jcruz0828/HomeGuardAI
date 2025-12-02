package com.homeguard.homeguard_api.controller;

import com.homeguard.homeguard_api.dto.FaceRecognitionSettingsRequestDto;
import com.homeguard.homeguard_api.dto.FaceRecognitionSettingsResponseDto;
import com.homeguard.homeguard_api.service.FaceRecognitionSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("${base.path}/face-recognition-settings")
@RequiredArgsConstructor
public class FaceRecognitionSettingsController {
    
    private final FaceRecognitionSettingsService settingsService;
    
    @GetMapping("/home/{homeId}")
    public ResponseEntity<FaceRecognitionSettingsResponseDto> getSettingsByHomeId(@PathVariable String homeId) {
        FaceRecognitionSettingsResponseDto response = settingsService.getOrCreateSettingsByHomeId(homeId);
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/home/{homeId}")
    public ResponseEntity<FaceRecognitionSettingsResponseDto> updateSettingsByHomeId(
            @PathVariable String homeId,
            @RequestBody FaceRecognitionSettingsRequestDto request) {
        FaceRecognitionSettingsResponseDto response = settingsService.updateSettingsByHomeId(homeId, request);
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/home/{homeId}")
    public ResponseEntity<Void> deleteSettingsByHomeId(@PathVariable String homeId) {
        settingsService.deleteSettingsByHomeId(homeId);
        return ResponseEntity.noContent().build();
    }
}

