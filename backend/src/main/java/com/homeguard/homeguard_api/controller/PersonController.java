package com.homeguard.homeguard_api.controller;

import com.homeguard.homeguard_api.dto.PersonEmbeddingDto;
import com.homeguard.homeguard_api.dto.PersonRequestDto;
import com.homeguard.homeguard_api.dto.PersonResponseDto;
import com.homeguard.homeguard_api.service.PersonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("${base.path}/persons")
@RequiredArgsConstructor
public class PersonController {
    
    private final PersonService personService;
    
    @PostMapping
    public ResponseEntity<PersonResponseDto> createPerson(@RequestBody PersonRequestDto request) {
        PersonResponseDto response = personService.createPerson(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<PersonResponseDto> getPersonById(@PathVariable String id) {
        PersonResponseDto response = personService.getPersonById(id);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping
    public ResponseEntity<List<PersonResponseDto>> getAllActivePersons() {
        List<PersonResponseDto> response = personService.getAllActivePersons();
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<PersonResponseDto> updatePerson(@PathVariable String id, @RequestBody PersonRequestDto request) {
        PersonResponseDto response = personService.updatePerson(id, request);
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePerson(@PathVariable String id) {
        personService.deletePerson(id);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/{id}/upload-image")
    public ResponseEntity<PersonResponseDto> uploadPersonImage(
            @PathVariable String id,
            @RequestParam("image") MultipartFile image) {
        PersonResponseDto response = personService.uploadPersonImage(id, image);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/home/{homeId}")
    public ResponseEntity<List<PersonResponseDto>> getPersonsByHomeId(@PathVariable String homeId) {
        List<PersonResponseDto> response = personService.getPersonsByHomeId(homeId);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/home/{homeId}/embeddings")
    public ResponseEntity<List<PersonEmbeddingDto>> getPersonEmbeddingsByHomeId(@PathVariable String homeId) {
        List<PersonEmbeddingDto> response = personService.getPersonEmbeddingsByHomeId(homeId);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/{id}/generate-embeddings")
    public ResponseEntity<PersonResponseDto> generateFaceEmbeddings(
            @PathVariable String id,
            @RequestBody List<String> imageUrls) {
        PersonResponseDto response = personService.generateFaceEmbeddings(id, imageUrls);
        return ResponseEntity.ok(response);
    }
}
