package com.kiinclothline.service.impl;

import com.kiinclothline.dto.request.SuitRequest;
import com.kiinclothline.dto.response.SuitResponse;
import com.kiinclothline.entity.Suit;
import com.kiinclothline.entity.SuitImage;
import com.kiinclothline.entity.User;
import com.kiinclothline.enums.SuitCategory;
import com.kiinclothline.exception.ResourceNotFoundException;
import com.kiinclothline.repository.SuitImageRepository;
import com.kiinclothline.repository.SuitRepository;
import com.kiinclothline.repository.UserRepository;
import com.kiinclothline.service.SuitService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SuitServiceImpl implements SuitService {

    private final SuitRepository suitRepository;
    private final SuitImageRepository suitImageRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public SuitResponse createSuit(SuitRequest request, String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Suit suit = Suit.builder()
                .name(request.getName())
                .detail(request.getDetail())
                .category(request.getCategory())
                .suitType(request.getSuitType())
                .color(request.getColor())
                .price(request.getPrice())
                .createdBy(user.getEmail())
                .build();

        Suit savedSuit = suitRepository.save(suit);

        // Save images
        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            for (int i = 0; i < request.getImageUrls().size(); i++) {
                SuitImage image = SuitImage.builder()
                        .suit(savedSuit)
                        .imageUrl(request.getImageUrls().get(i))
                        .imageOrder(i)
                        .build();
                suitImageRepository.save(image);
            }
        }

        return convertToResponse(savedSuit);
    }

    @Override
    @Transactional
    public SuitResponse updateSuit(Long suitId, SuitRequest request) {
        Suit suit = suitRepository.findById(suitId)
                .orElseThrow(() -> new ResourceNotFoundException("Suit", "id", suitId));

        suit.setName(request.getName());
        suit.setDetail(request.getDetail());
        suit.setCategory(request.getCategory());
        suit.setSuitType(request.getSuitType());
        suit.setColor(request.getColor());
        suit.setPrice(request.getPrice());

        Suit updatedSuit = suitRepository.save(suit);

        // Update images
        if (request.getImageUrls() != null) {
            // Delete existing images
            suitImageRepository.deleteBySuitId(suitId);
            
            // Save new images
            for (int i = 0; i < request.getImageUrls().size(); i++) {
                SuitImage image = SuitImage.builder()
                        .suit(updatedSuit)
                        .imageUrl(request.getImageUrls().get(i))
                        .imageOrder(i)
                        .build();
                suitImageRepository.save(image);
            }
        }

        return convertToResponse(updatedSuit);
    }

    @Override
    public SuitResponse getSuitById(Long suitId) {
        Suit suit = suitRepository.findById(suitId)
                .orElseThrow(() -> new ResourceNotFoundException("Suit", "id", suitId));
        return convertToResponse(suit);
    }

    @Override
    public List<SuitResponse> getAllSuits() {
        return suitRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<SuitResponse> getSuitsByCategory(SuitCategory category) {
        return suitRepository.findByCategory(category).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<SuitResponse> searchSuits(String keyword) {
        return suitRepository.findByNameContainingIgnoreCase(keyword).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteSuit(Long suitId) {
        Suit suit = suitRepository.findById(suitId)
                .orElseThrow(() -> new ResourceNotFoundException("Suit", "id", suitId));
        
        // Delete images first
        suitImageRepository.deleteBySuitId(suitId);
        
        // Delete suit
        suitRepository.delete(suit);
    }

    @Override
    public long countSuits() {
        return suitRepository.count();
    }

    private SuitResponse convertToResponse(Suit suit) {
        List<String> imageUrls = suitImageRepository.findBySuitIdOrderByImageOrder(suit.getId())
                .stream()
                .map(SuitImage::getImageUrl)
                .collect(Collectors.toList());

        return SuitResponse.builder()
                .id(suit.getId())
                .name(suit.getName())
                .detail(suit.getDetail())
                .category(suit.getCategory())
                .suitType(suit.getSuitType())
                .color(suit.getColor())
                .price(suit.getPrice())
                .createdBy(suit.getCreatedBy())
                .createdAt(suit.getCreatedAt())
                .updatedAt(suit.getUpdatedAt())
                .imageUrls(imageUrls)
                .build();
    }
}