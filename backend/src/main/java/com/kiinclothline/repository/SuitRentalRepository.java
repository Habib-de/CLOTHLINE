package com.kiinclothline.repository;

import com.kiinclothline.entity.SuitRental;
import com.kiinclothline.enums.RentalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SuitRentalRepository extends JpaRepository<SuitRental, String>, JpaSpecificationExecutor<SuitRental> {
    
    Optional<SuitRental> findByReference(String reference);
    
    List<SuitRental> findByCustomerNameContainingIgnoreCase(String customerName);
    
    List<SuitRental> findByStatus(RentalStatus status);
    
    List<SuitRental> findByRentalStartDateBeforeAndRentalEndDateAfter(LocalDate startDate, LocalDate endDate);
    
    List<SuitRental> findByStatusAndRentalEndDateBefore(RentalStatus status, LocalDate date);
}