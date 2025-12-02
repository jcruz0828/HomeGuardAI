package com.homeguard.homeguard_api.model;

import com.homeguard.homeguard_api.enums.AccessResult;
import com.homeguard.homeguard_api.enums.AccessType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "access_logs")
@Getter
@Setter
public class AccessLog extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user; // null if unknown person

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person_id")
    private Person person; // null if unknown person

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id")
    private Device device; // Can be null for home CRUD operations

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "home_id")
    private Home home; // Direct home reference for CRUD operations

    @Enumerated(EnumType.STRING)
    @Column(name = "access_type", nullable = false)
    private AccessType accessType;

    @Enumerated(EnumType.STRING)
    @Column(name = "result", nullable = false)
    private AccessResult result;

    @Size(max = 500)
    @Column(name = "reason")
    private String reason; // "Unknown person", "Permission expired"

    @Size(max = 500)
    @Column(name = "image_path")
    private String imagePath; // Facial recognition photo

    @Size(max = 200)
    @Column(name = "location")
    private String location; // Where access was attempted

    @Column(name = "confidence")
    private Double confidence; // Recognition confidence score

    @Size(max = 100)
    @Column(name = "face_id")
    private String faceId; // Detected face ID

    @Size(max = 1000)
    @Column(name = "additional_data")
    private String additionalData; // JSON for extra info
}
