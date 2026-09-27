package com.kiinclothline.service;

import com.kiinclothline.dto.request.RentalRequest;
import com.kiinclothline.dto.response.RentalResponse;
import com.kiinclothline.enums.RentalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface RentalService {
    RentalResponse createRental(RentalRequest request, String userId);
    RentalResponse updateRental(String rentalId, RentalRequest request);
    RentalResponse getRentalById(String rentalId);
    RentalResponse getRentalByReference(String reference);
    
    // ✅ NEW: Paginated method with filters
    Page<RentalResponse> getAllRentals(Pageable pageable, String status, String search);
    
    // Keep existing methods for backward compatibility
    List<RentalResponse> getAllRentals();
    List<RentalResponse> getRentalsByCustomer(String customerName);
    List<RentalResponse> getRentalsByStatus(RentalStatus status);
    List<RentalResponse> getActiveRentals();
    List<RentalResponse> getOverdueRentals();
    RentalResponse updateRentalStatus(String rentalId, RentalStatus status);
    void deleteRental(String rentalId);
    long countRentals();
}