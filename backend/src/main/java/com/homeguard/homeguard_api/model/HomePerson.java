package com.homeguard.homeguard_api.model;

import com.homeguard.homeguard_api.enums.AccessLevel;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "home_persons")
@Getter
@Setter
public class HomePerson extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "home_id", nullable = false)
    private Home home;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person_id", nullable = false)
    private Person person;

    @Enumerated(EnumType.STRING)
    @Column(name = "access_level", nullable = false)
    private AccessLevel accessLevel;

    @Column(name = "access_expires_at")
    private LocalDateTime accessExpiresAt;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "notes")
    private String notes;

    @Column(name = "last_accessed")
    private LocalDateTime lastAccessed;

    @Column(name = "automatic_access_enabled")
    private Boolean automaticAccessEnabled = false;

    @Column(name = "automatic_access_count")
    private Integer automaticAccessCount = 0;

    @Column(name = "automatic_access_limit")
    private Integer automaticAccessLimit; // NULL = unlimited

    @Column(name = "automatic_access_reset_period")
    private String automaticAccessResetPeriod = "MONTHLY"; // DAILY, WEEKLY, MONTHLY, YEARLY, NEVER

    @Column(name = "automatic_access_last_reset")
    private LocalDateTime automaticAccessLastReset;
}
