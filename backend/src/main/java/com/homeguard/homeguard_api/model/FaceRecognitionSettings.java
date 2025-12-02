package com.homeguard.homeguard_api.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "face_recognition_settings")
@Getter
@Setter
public class FaceRecognitionSettings extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "home_id", nullable = false, unique = true)
    @NotNull
    private Home home;

    @Column(name = "ai_detection_enabled", nullable = false)
    private Boolean aiDetectionEnabled = true;

    @Column(name = "confidence_threshold", nullable = false)
    @Min(0)
    @Max(100)
    private Integer confidenceThreshold = 80;

    @Column(name = "face_tolerance")
    @Min(0)
    @Max(1)
    private Double faceTolerance = 0.6;

    @Column(name = "max_recognition_attempts")
    private Integer maxRecognitionAttempts = 3;

    @Column(name = "recognition_cooldown_seconds")
    private Integer recognitionCooldownSeconds = 5;

    @Column(name = "require_multiple_angles")
    private Boolean requireMultipleAngles = false;
}

