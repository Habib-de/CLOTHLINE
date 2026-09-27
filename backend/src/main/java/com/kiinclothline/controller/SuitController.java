package com.kiinclothline.controller;

import com.kiinclothline.dto.request.SuitRequest;
import com.kiinclothline.dto.response.ApiResponse;
import com.kiinclothline.dto.response.SuitResponse;
import com.kiinclothline.enums.SuitCategory;
import com.kiinclothline.security.UserPrincipal;
import com.kiinclothline.service.SuitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/suits")
@RequiredArgsConstructor
@Tag(name = "Suits", description = "Suit Management APIs")
@SecurityRequirement(name = "bearerAuth")
public class SuitController {

    private final SuitService suitService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    @Operation(summary = "Create suit", description = "Add a new suit to the catalog")
    public ResponseEntity<ApiResponse<SuitResponse>> createSuit(
            @Valid @RequestBody SuitRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        log.info("Creating suit by user: {}", user.getEmail());
        SuitResponse response = suitService.createSuit(request, user.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Suit created successfully"));
    }

    @PutMapping("/{suitId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    @Operation(summary = "Update suit", description = "Update an existing suit")
    public ResponseEntity<ApiResponse<SuitResponse>> updateSuit(
            @PathVariable Long suitId,
            @Valid @RequestBody SuitRequest request) {
        log.info("Updating suit: {}", suitId);
        SuitResponse response = suitService.updateSuit(suitId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Suit updated successfully"));
    }

    @GetMapping("/{suitId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES', 'TAILOR', 'CLIENT')")
    @Operation(summary = "Get suit by ID", description = "Get suit details by ID")
    public ResponseEntity<ApiResponse<SuitResponse>> getSuitById(@PathVariable Long suitId) {
        log.info("Fetching suit: {}", suitId);
        SuitResponse response = suitService.getSuitById(suitId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "Get all suits", description = "Get list of all suits")
    public ResponseEntity<ApiResponse<List<SuitResponse>>> getAllSuits() {
        log.info("Fetching all suits");
        List<SuitResponse> responses = suitService.getAllSuits();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/category/{category}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES', 'TAILOR', 'CLIENT')")
    @Operation(summary = "Get suits by category", description = "Get suits by category")
    public ResponseEntity<ApiResponse<List<SuitResponse>>> getSuitsByCategory(
            @PathVariable SuitCategory category) {
        log.info("Fetching suits by category: {}", category);
        List<SuitResponse> responses = suitService.getSuitsByCategory(category);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES', 'TAILOR', 'CLIENT')")
    @Operation(summary = "Search suits", description = "Search suits by keyword")
    public ResponseEntity<ApiResponse<List<SuitResponse>>> searchSuits(
            @RequestParam String keyword) {
        log.info("Searching suits with keyword: {}", keyword);
        List<SuitResponse> responses = suitService.searchSuits(keyword);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @DeleteMapping("/{suitId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    @Operation(summary = "Delete suit", description = "Delete a suit from the catalog")
    public ResponseEntity<ApiResponse<Void>> deleteSuit(@PathVariable Long suitId) {
        log.info("Deleting suit: {}", suitId);
        suitService.deleteSuit(suitId);
        return ResponseEntity.ok(ApiResponse.success(null, "Suit deleted successfully"));
    }

    @GetMapping("/stats/count")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    @Operation(summary = "Get suit count", description = "Get total number of suits")
    public ResponseEntity<ApiResponse<Long>> getSuitCount() {
        long count = suitService.countSuits();
        return ResponseEntity.ok(ApiResponse.success(count));
    }
}