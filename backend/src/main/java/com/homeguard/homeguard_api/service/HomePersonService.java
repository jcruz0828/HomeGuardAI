package com.homeguard.homeguard_api.service;

import com.homeguard.homeguard_api.dto.HomePersonRequestDto;
import com.homeguard.homeguard_api.dto.HomePersonResponseDto;
import com.homeguard.homeguard_api.dto.HomeActivityRequestDto;
import com.homeguard.homeguard_api.enums.ActivityType;
import com.homeguard.homeguard_api.enums.ActivityPriority;
import com.homeguard.homeguard_api.model.Home;
import com.homeguard.homeguard_api.model.HomePerson;
import com.homeguard.homeguard_api.model.Person;
import com.homeguard.homeguard_api.repository.HomePersonRepository;
import com.homeguard.homeguard_api.repository.HomeRepository;
import com.homeguard.homeguard_api.repository.PersonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HomePersonService {
    
    private final HomePersonRepository homePersonRepository;
    private final HomeRepository homeRepository;
    private final PersonRepository personRepository;
    private final HomeActivityService homeActivityService;
    
    public HomePersonResponseDto linkPersonToHome(HomePersonRequestDto request) {
        // Get home and person entities
        Home home = homeRepository.findById(request.getHomeId())
                .orElseThrow(() -> new RuntimeException("Home not found"));
        Person person = personRepository.findById(request.getPersonId())
                .orElseThrow(() -> new RuntimeException("Person not found"));
        
        // Check if relationship already exists
        if (homePersonRepository.findByHomeIdAndPersonId(request.getHomeId(), request.getPersonId()).isPresent()) {
            throw new RuntimeException("Person is already linked to this home");
        }
        
        HomePerson homePerson = new HomePerson();
        homePerson.setHome(home);
        homePerson.setPerson(person);
        homePerson.setAccessLevel(request.getAccessLevel());
        homePerson.setAccessExpiresAt(request.getAccessExpiresAt() != null ? 
                LocalDateTime.parse(request.getAccessExpiresAt()) : null);
        homePerson.setNotes(request.getNotes());
        homePerson.setIsActive(true);
        homePerson.setAutomaticAccessEnabled(request.getAutomaticAccessEnabled() != null ? 
                request.getAutomaticAccessEnabled() : false);
        homePerson.setAutomaticAccessLimit(request.getAutomaticAccessLimit());
        homePerson.setAutomaticAccessResetPeriod(request.getAutomaticAccessResetPeriod() != null ? 
                request.getAutomaticAccessResetPeriod() : "MONTHLY");
        homePerson.setAutomaticAccessCount(0);
        homePerson.setAutomaticAccessLastReset(LocalDateTime.now());
        homePerson.setCreatedAt(LocalDateTime.now());
        homePerson.setUpdatedAt(LocalDateTime.now());
        
        HomePerson saved = homePersonRepository.save(homePerson);
        
        // Create home activity for person added
        try {
            HomeActivityRequestDto activityRequest = new HomeActivityRequestDto();
            activityRequest.setHomeId(request.getHomeId());
            activityRequest.setPersonId(request.getPersonId());
            activityRequest.setActivityType(ActivityType.PERSON_ADDED);
            activityRequest.setPriority(ActivityPriority.MEDIUM);
            activityRequest.setTitle(person.getName() + " was added to the home");
            activityRequest.setDescription("Person " + person.getName() + " has been granted access to " + home.getName());
            activityRequest.setActivityTimestamp(LocalDateTime.now());
            
            homeActivityService.createActivity(activityRequest);
        } catch (Exception e) {
            // Log error but don't fail the person linking
            // Activity creation is not critical for the main operation
        }
        
        return mapToResponseDto(saved);
    }
    
    public List<HomePersonResponseDto> getPersonsByHomeId(String homeId) {
        List<HomePerson> homePersons = homePersonRepository.findByHomeIdAndIsActiveTrue(homeId);
        return homePersons.stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }
    
    public HomePersonResponseDto updatePersonAccess(String id, HomePersonRequestDto request) {
        HomePerson homePerson = homePersonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("HomePerson relationship not found"));
        
        if (request.getAccessLevel() != null) {
            homePerson.setAccessLevel(request.getAccessLevel());
        }
        if (request.getAccessExpiresAt() != null) {
            homePerson.setAccessExpiresAt(LocalDateTime.parse(request.getAccessExpiresAt()));
        }
        if (request.getIsActive() != null) {
            homePerson.setIsActive(request.getIsActive());
        }
        if (request.getNotes() != null) {
            homePerson.setNotes(request.getNotes());
        }
        if (request.getAutomaticAccessEnabled() != null) {
            homePerson.setAutomaticAccessEnabled(request.getAutomaticAccessEnabled());
        }
        if (request.getAutomaticAccessLimit() != null) {
            homePerson.setAutomaticAccessLimit(request.getAutomaticAccessLimit());
        }
        if (request.getAutomaticAccessResetPeriod() != null) {
            homePerson.setAutomaticAccessResetPeriod(request.getAutomaticAccessResetPeriod());
        }
        homePerson.setUpdatedAt(LocalDateTime.now());
        
        HomePerson saved = homePersonRepository.save(homePerson);
        return mapToResponseDto(saved);
    }
    
    public void removePersonFromHome(String id) {
        HomePerson homePerson = homePersonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("HomePerson relationship not found"));
        
        homePerson.setIsActive(false);
        homePerson.setUpdatedAt(LocalDateTime.now());
        homePersonRepository.save(homePerson);
        
        // Create home activity for person removed
        try {
            HomeActivityRequestDto activityRequest = new HomeActivityRequestDto();
            activityRequest.setHomeId(homePerson.getHome().getId());
            activityRequest.setPersonId(homePerson.getPerson().getId());
            activityRequest.setActivityType(ActivityType.PERSON_REMOVED);
            activityRequest.setPriority(ActivityPriority.MEDIUM);
            activityRequest.setTitle(homePerson.getPerson().getName() + " was removed from the home");
            activityRequest.setDescription("Person " + homePerson.getPerson().getName() + " has been removed from " + homePerson.getHome().getName());
            activityRequest.setActivityTimestamp(LocalDateTime.now());
            
            homeActivityService.createActivity(activityRequest);
        } catch (Exception e) {
            // Log error but don't fail the person removal
            // Activity creation is not critical for the main operation
        }
    }
    
    private HomePersonResponseDto mapToResponseDto(HomePerson homePerson) {
        HomePersonResponseDto dto = new HomePersonResponseDto();
        dto.setId(homePerson.getId());
        dto.setHomeId(homePerson.getHome().getId());
        dto.setPersonId(homePerson.getPerson().getId());
        dto.setAccessLevel(homePerson.getAccessLevel());
        dto.setAccessExpiresAt(homePerson.getAccessExpiresAt() != null ? 
                homePerson.getAccessExpiresAt().toString() : null);
        dto.setActive(homePerson.getIsActive());
        dto.setNotes(homePerson.getNotes());
        dto.setLastAccessed(homePerson.getLastAccessed() != null ? 
                homePerson.getLastAccessed().toString() : null);
        dto.setCreatedAt(homePerson.getCreatedAt());
        dto.setUpdatedAt(homePerson.getUpdatedAt());
        
        // Automatic access fields
        dto.setAutomaticAccessEnabled(homePerson.getAutomaticAccessEnabled());
        dto.setAutomaticAccessCount(homePerson.getAutomaticAccessCount());
        dto.setAutomaticAccessLimit(homePerson.getAutomaticAccessLimit());
        dto.setAutomaticAccessResetPeriod(homePerson.getAutomaticAccessResetPeriod());
        dto.setAutomaticAccessLastReset(homePerson.getAutomaticAccessLastReset() != null ? 
                homePerson.getAutomaticAccessLastReset().toString() : null);
        
        // Add person info
        HomePersonResponseDto.PersonInfo personInfo = new HomePersonResponseDto.PersonInfo();
        personInfo.setId(homePerson.getPerson().getId());
        personInfo.setName(homePerson.getPerson().getName());
        personInfo.setPersonType(homePerson.getPerson().getPersonType().toString());
        personInfo.setProfileImagePath(homePerson.getPerson().getProfileImagePath());
        dto.setPerson(personInfo);
        
        return dto;
    }
}
