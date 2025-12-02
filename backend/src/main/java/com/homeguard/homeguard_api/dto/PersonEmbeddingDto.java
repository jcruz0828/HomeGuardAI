package com.homeguard.homeguard_api.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PersonEmbeddingDto {
    private String personId;
    private String name;
    private String faceVector; // JSON array of embeddings
}

