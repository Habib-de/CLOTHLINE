package com.kiinclothline.service;

import com.kiinclothline.dto.request.SuitRequest;
import com.kiinclothline.dto.response.SuitResponse;
import com.kiinclothline.enums.SuitCategory;

import java.util.List;

public interface SuitService {
    SuitResponse createSuit(SuitRequest request, String userId);
    SuitResponse updateSuit(Long suitId, SuitRequest request);
    SuitResponse getSuitById(Long suitId);
    List<SuitResponse> getAllSuits();
    List<SuitResponse> getSuitsByCategory(SuitCategory category);
    List<SuitResponse> searchSuits(String keyword);
    void deleteSuit(Long suitId);
    long countSuits();
}