package com.homeguard.homeguard_api.repository;

import com.homeguard.homeguard_api.model.FaceRecognitionSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FaceRecognitionSettingsRepository extends JpaRepository<FaceRecognitionSettings, String> {
    
    Optional<FaceRecognitionSettings> findByHomeId(String homeId);
    
    boolean existsByHomeId(String homeId);
}

