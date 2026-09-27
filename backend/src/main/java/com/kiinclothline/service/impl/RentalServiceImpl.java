package com.kiinclothline.service.impl;

import com.kiinclothline.dto.request.RentalRequest;
import com.kiinclothline.dto.response.RentalResponse;
import com.kiinclothline.entity.SuitRental;
import com.kiinclothline.entity.User;
import com.kiinclothline.enums.PaymentStatus;
import com.kiinclothline.enums.RentalStatus;
import com.kiinclothline.exception.BadRequestException;
import com.kiinclothline.exception.ResourceNotFoundException;
import com.kiinclothline.repository.SuitRentalRepository;
import com.kiinclothline.repository.UserRepository;
import com.kiinclothline.service.RentalService;
import com.kiinclothline.util.DateUtils;
import com.kiinclothline.util.StringUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RentalServiceImpl implements RentalService {

    private final SuitRentalRepository rentalRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public RentalResponse createRental(RentalRequest request, String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Validate dates
        if (request.getRentalStartDate().isAfter(request.getRentalEndDate())) {
            throw new BadRequestException("End date must be after start date");
        }

        // Calculate days
        long days = DateUtils.daysBetween(request.getRentalStartDate(), request.getRentalEndDate());
        if (days < 1) {
            throw new BadRequestException("Rental period must be at least 1 day");
        }

        // Calculate totals
        BigDecimal rentalFee = request.getSuitPricePerDay().multiply(BigDecimal.valueOf(days));
        BigDecimal deposit = request.getDeposit() != null ? request.getDeposit() : BigDecimal.ZERO;
        BigDecimal totalAmount = rentalFee;
        BigDecimal remainingBalance = totalAmount.subtract(deposit);

        if (deposit.compareTo(totalAmount) > 0) {
            throw new BadRequestException("Deposit cannot be greater than total amount");
        }

        // Generate reference
        String reference = StringUtils.generateReference("SR");

        // Create rental
        SuitRental rental = SuitRental.builder()
                .id(StringUtils.generateId())
                .reference(reference)
                .customerName(request.getCustomerName())
                .customerPhone(request.getCustomerPhone())
                .customerEmail(request.getCustomerEmail())
                .customerIdNumber(request.getCustomerIdNumber())
                .customerIdImage(request.getCustomerIdImage())
                .suitName(request.getSuitName())
                .suitCategory(request.getSuitCategory())
                .suitColor(request.getSuitColor())
                .suitPricePerDay(request.getSuitPricePerDay())
                .rentalStartDate(request.getRentalStartDate())
                .rentalEndDate(request.getRentalEndDate())
                .days((int) days)
                .rentalFee(rentalFee)
                .deposit(deposit)
                .totalAmount(totalAmount)
                .remainingBalance(remainingBalance)
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus(remainingBalance.compareTo(BigDecimal.ZERO) == 0 ? PaymentStatus.PAID : PaymentStatus.PENDING)
                .mpesaCode(request.getMpesaCode())
                .notes(request.getNotes())
                .signature(request.getSignature())
                .termsAccepted(request.getTermsAccepted() != null && request.getTermsAccepted())
                .termsAcceptedAt(request.getTermsAccepted() ? LocalDate.now().atStartOfDay() : null)
                .rentedBy(user.getName())
                .rentedByEmail(user.getEmail())
                .status(request.getStatus() != null ? request.getStatus() : RentalStatus.PENDING)
                .build();

        SuitRental savedRental = rentalRepository.save(rental);
        return convertToResponse(savedRental);
    }

    @Override
    @Transactional
    public RentalResponse updateRental(String rentalId, RentalRequest request) {
        SuitRental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new ResourceNotFoundException("Rental", "id", rentalId));

        // Update fields
        rental.setCustomerName(request.getCustomerName());
        rental.setCustomerPhone(request.getCustomerPhone());
        rental.setCustomerEmail(request.getCustomerEmail());
        rental.setCustomerIdNumber(request.getCustomerIdNumber());
        rental.setCustomerIdImage(request.getCustomerIdImage());
        rental.setSuitName(request.getSuitName());
        rental.setSuitCategory(request.getSuitCategory());
        rental.setSuitColor(request.getSuitColor());
        rental.setSuitPricePerDay(request.getSuitPricePerDay());

        if (request.getRentalStartDate() != null && request.getRentalEndDate() != null) {
            long days = DateUtils.daysBetween(request.getRentalStartDate(), request.getRentalEndDate());
            rental.setRentalStartDate(request.getRentalStartDate());
            rental.setRentalEndDate(request.getRentalEndDate());
            rental.setDays((int) days);
            
            BigDecimal rentalFee = request.getSuitPricePerDay().multiply(BigDecimal.valueOf(days));
            BigDecimal deposit = request.getDeposit() != null ? request.getDeposit() : rental.getDeposit();
            rental.setRentalFee(rentalFee);
            rental.setTotalAmount(rentalFee);
            rental.setRemainingBalance(rentalFee.subtract(deposit));
        }

        if (request.getDeposit() != null) {
            rental.setDeposit(request.getDeposit());
            rental.setRemainingBalance(rental.getTotalAmount().subtract(request.getDeposit()));
        }

        if (request.getPaymentMethod() != null) {
            rental.setPaymentMethod(request.getPaymentMethod());
        }
        
        if (request.getMpesaCode() != null) {
            rental.setMpesaCode(request.getMpesaCode());
        }
        
        if (request.getNotes() != null) {
            rental.setNotes(request.getNotes());
        }
        
        if (request.getStatus() != null) {
            rental.setStatus(request.getStatus());
        }

        // Update payment status
        if (rental.getRemainingBalance().compareTo(BigDecimal.ZERO) == 0) {
            rental.setPaymentStatus(PaymentStatus.PAID);
        } else if (rental.getDeposit().compareTo(BigDecimal.ZERO) > 0) {
            rental.setPaymentStatus(PaymentStatus.PARTIAL);
        }

        SuitRental updatedRental = rentalRepository.save(rental);
        return convertToResponse(updatedRental);
    }

    @Override
    public RentalResponse getRentalById(String rentalId) {
        SuitRental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new ResourceNotFoundException("Rental", "id", rentalId));
        return convertToResponse(rental);
    }

    @Override
    public RentalResponse getRentalByReference(String reference) {
        SuitRental rental = rentalRepository.findByReference(reference)
                .orElseThrow(() -> new ResourceNotFoundException("Rental", "reference", reference));
        return convertToResponse(rental);
    }

    // ✅ NEW: Paginated method with filters
    @Override
    public Page<RentalResponse> getAllRentals(Pageable pageable, String status, String search) {
        Specification<SuitRental> spec = buildSpecification(status, search);
        Page<SuitRental> rentals = rentalRepository.findAll(spec, pageable);
        return rentals.map(this::convertToResponse);
    }

    // ✅ Helper: Build specification for filtering
    private Specification<SuitRental> buildSpecification(String status, String search) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Status filter
            if (status != null && !status.isEmpty()) {
                try {
                    RentalStatus rentalStatus = RentalStatus.valueOf(status.toUpperCase());
                    predicates.add(cb.equal(root.get("status"), rentalStatus));
                } catch (IllegalArgumentException e) {
                    // Invalid status, ignore
                }
            }

            // Search filter
            if (search != null && !search.isEmpty()) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("customerName")), searchPattern),
                    cb.like(cb.lower(root.get("suitName")), searchPattern),
                    cb.like(cb.lower(root.get("reference")), searchPattern),
                    cb.like(cb.lower(root.get("customerPhone")), searchPattern),
                    cb.like(cb.lower(root.get("customerEmail")), searchPattern)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    // Keep existing methods
    @Override
    public List<RentalResponse> getAllRentals() {
        return rentalRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<RentalResponse> getRentalsByCustomer(String customerName) {
        return rentalRepository.findByCustomerNameContainingIgnoreCase(customerName).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<RentalResponse> getRentalsByStatus(RentalStatus status) {
        return rentalRepository.findByStatus(status).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<RentalResponse> getActiveRentals() {
        LocalDate today = LocalDate.now();
        return rentalRepository.findByRentalStartDateBeforeAndRentalEndDateAfter(today, today).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<RentalResponse> getOverdueRentals() {
        LocalDate today = LocalDate.now();
        return rentalRepository.findByStatusAndRentalEndDateBefore(RentalStatus.RENTED, today).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RentalResponse updateRentalStatus(String rentalId, RentalStatus status) {
        SuitRental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new ResourceNotFoundException("Rental", "id", rentalId));
        
        rental.setStatus(status);
        SuitRental updatedRental = rentalRepository.save(rental);
        return convertToResponse(updatedRental);
    }

    @Override
    @Transactional
    public void deleteRental(String rentalId) {
        SuitRental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new ResourceNotFoundException("Rental", "id", rentalId));
        rentalRepository.delete(rental);
    }

    @Override
    public long countRentals() {
        return rentalRepository.count();
    }

    private RentalResponse convertToResponse(SuitRental rental) {
        RentalResponse response = RentalResponse.builder()
                .id(rental.getId())
                .reference(rental.getReference())
                .customerName(rental.getCustomerName())
                .customerPhone(rental.getCustomerPhone())
                .customerEmail(rental.getCustomerEmail())
                .customerIdNumber(rental.getCustomerIdNumber())
                .customerIdImage(rental.getCustomerIdImage())
                .suitName(rental.getSuitName())
                .suitCategory(rental.getSuitCategory())
                .suitColor(rental.getSuitColor())
                .suitPricePerDay(rental.getSuitPricePerDay())
                .rentalStartDate(rental.getRentalStartDate())
                .rentalEndDate(rental.getRentalEndDate())
                .days(rental.getDays())
                .rentalFee(rental.getRentalFee())
                .deposit(rental.getDeposit())
                .totalAmount(rental.getTotalAmount())
                .remainingBalance(rental.getRemainingBalance())
                .paymentMethod(rental.getPaymentMethod())
                .paymentStatus(rental.getPaymentStatus())
                .mpesaCode(rental.getMpesaCode())
                .notes(rental.getNotes())
                .signature(rental.getSignature())
                .termsAccepted(rental.getTermsAccepted())
                .termsAcceptedAt(rental.getTermsAcceptedAt())
                .rentedBy(rental.getRentedBy())
                .rentedByEmail(rental.getRentedByEmail())
                .status(rental.getStatus())
                .createdAt(rental.getCreatedAt())
                .updatedAt(rental.getUpdatedAt())
                .build();

        // Convert payments if needed
        if (rental.getPayments() != null && !rental.getPayments().isEmpty()) {
            List<RentalResponse.PaymentResponse> payments = rental.getPayments().stream()
                    .map(payment -> RentalResponse.PaymentResponse.builder()
                            .id(payment.getId())
                            .amount(payment.getAmount())
                            .method(payment.getMethod().name())
                            .note(payment.getNote())
                            .paymentDate(payment.getPaymentDate())
                            .receivedBy(payment.getReceivedBy())
                            .build())
                    .collect(Collectors.toList());
            response.setPayments(payments);
        }

        return response;
    }
}