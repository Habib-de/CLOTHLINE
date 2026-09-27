package com.kiinclothline.controller;

import com.kiinclothline.dto.request.RentalRequest;
import com.kiinclothline.dto.response.ApiResponse;
import com.kiinclothline.dto.response.RentalResponse;
import com.kiinclothline.enums.RentalStatus;
import com.kiinclothline.security.UserPrincipal;
import com.kiinclothline.service.RentalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/rentals")
@RequiredArgsConstructor
@Tag(name = "Rentals", description = "Suit Rental Management APIs")
@SecurityRequirement(name = "bearerAuth")
public class RentalController {

    private final RentalService rentalService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES')")
    @Operation(summary = "Create rental", description = "Create a new suit rental")
    public ResponseEntity<ApiResponse<RentalResponse>> createRental(
            @Valid @RequestBody RentalRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        log.info("Creating rental by user: {}", user.getEmail());
        RentalResponse response = rentalService.createRental(request, user.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Rental created successfully"));
    }

    @PutMapping("/{rentalId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES')")
    @Operation(summary = "Update rental", description = "Update an existing rental")
    public ResponseEntity<ApiResponse<RentalResponse>> updateRental(
            @PathVariable String rentalId,
            @Valid @RequestBody RentalRequest request) {
        log.info("Updating rental: {}", rentalId);
        RentalResponse response = rentalService.updateRental(rentalId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Rental updated successfully"));
    }

    @GetMapping("/{rentalId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES')")
    @Operation(summary = "Get rental by ID", description = "Get rental details by ID")
    public ResponseEntity<ApiResponse<RentalResponse>> getRentalById(@PathVariable String rentalId) {
        log.info("Fetching rental: {}", rentalId);
        RentalResponse response = rentalService.getRentalById(rentalId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/reference/{reference}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES')")
    @Operation(summary = "Get rental by reference", description = "Get rental details by reference")
    public ResponseEntity<ApiResponse<RentalResponse>> getRentalByReference(@PathVariable String reference) {
        log.info("Fetching rental by reference: {}", reference);
        RentalResponse response = rentalService.getRentalByReference(reference);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ✅ UPDATED: Support pagination, filtering, and search
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES')")
    @Operation(summary = "Get all rentals", description = "Get list of all rentals with pagination")
    public ResponseEntity<ApiResponse<Page<RentalResponse>>> getAllRentals(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        log.info("Fetching rentals - page: {}, size: {}, status: {}, search: {}", page, size, status, search);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<RentalResponse> responses = rentalService.getAllRentals(pageable, status, search);
        
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/customer")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES')")
    @Operation(summary = "Get rentals by customer", description = "Get rentals by customer name")
    public ResponseEntity<ApiResponse<List<RentalResponse>>> getRentalsByCustomer(
            @RequestParam String customerName) {
        log.info("Fetching rentals by customer: {}", customerName);
        List<RentalResponse> responses = rentalService.getRentalsByCustomer(customerName);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES')")
    @Operation(summary = "Get rentals by status", description = "Get rentals by status")
    public ResponseEntity<ApiResponse<List<RentalResponse>>> getRentalsByStatus(
            @PathVariable RentalStatus status) {
        log.info("Fetching rentals by status: {}", status);
        List<RentalResponse> responses = rentalService.getRentalsByStatus(status);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES')")
    @Operation(summary = "Get active rentals", description = "Get currently active rentals")
    public ResponseEntity<ApiResponse<List<RentalResponse>>> getActiveRentals() {
        log.info("Fetching active rentals");
        List<RentalResponse> responses = rentalService.getActiveRentals();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/overdue")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES')")
    @Operation(summary = "Get overdue rentals", description = "Get overdue rentals")
    public ResponseEntity<ApiResponse<List<RentalResponse>>> getOverdueRentals() {
        log.info("Fetching overdue rentals");
        List<RentalResponse> responses = rentalService.getOverdueRentals();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PatchMapping("/{rentalId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES')")
    @Operation(summary = "Update rental status", description = "Update rental status")
    public ResponseEntity<ApiResponse<RentalResponse>> updateRentalStatus(
            @PathVariable String rentalId,
            @RequestParam RentalStatus status) {
        log.info("Updating status for rental: {} to {}", rentalId, status);
        RentalResponse response = rentalService.updateRentalStatus(rentalId, status);
        return ResponseEntity.ok(ApiResponse.success(response, "Rental status updated successfully"));
    }

    @DeleteMapping("/{rentalId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    @Operation(summary = "Delete rental", description = "Delete a rental")
    public ResponseEntity<ApiResponse<Void>> deleteRental(@PathVariable String rentalId) {
        log.info("Deleting rental: {}", rentalId);
        rentalService.deleteRental(rentalId);
        return ResponseEntity.ok(ApiResponse.success(null, "Rental deleted successfully"));
    }

    @GetMapping("/stats/count")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    @Operation(summary = "Get rental count", description = "Get total number of rentals")
    public ResponseEntity<ApiResponse<Long>> getRentalCount() {
        long count = rentalService.countRentals();
        return ResponseEntity.ok(ApiResponse.success(count));
    }
}