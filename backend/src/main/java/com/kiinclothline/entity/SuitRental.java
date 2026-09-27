package com.kiinclothline.entity;

import com.kiinclothline.enums.PaymentMethod;
import com.kiinclothline.enums.PaymentStatus;
import com.kiinclothline.enums.RentalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "suit_rentals")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class SuitRental {

    @Id
    @Column(length = 50)
    private String id;

    @Column(length = 30, nullable = false, unique = true)
    private String reference;

    @Column(name = "customer_name", nullable = false, length = 100)
    private String customerName;

    @Column(name = "customer_phone", length = 20)
    private String customerPhone;

    @Column(name = "customer_email", length = 100)
    private String customerEmail;

    @Column(name = "customer_id_number", length = 50)
    private String customerIdNumber;

    @Column(name = "customer_id_image", columnDefinition = "TEXT")
    private String customerIdImage;

    @Column(name = "suit_name", length = 100)
    private String suitName;

    @Column(name = "suit_category", length = 50)
    private String suitCategory;

    @Column(name = "suit_color", length = 50)
    private String suitColor;

    @Column(name = "suit_price_per_day", precision = 12, scale = 2)
    private BigDecimal suitPricePerDay;

    @Column(name = "rental_start_date", nullable = false)
    private LocalDate rentalStartDate;

    @Column(name = "rental_end_date", nullable = false)
    private LocalDate rentalEndDate;

    @Column(nullable = false)
    private Integer days;

    @Column(name = "rental_fee", precision = 12, scale = 2)
    private BigDecimal rentalFee;

    @Column(precision = 12, scale = 2)
    private BigDecimal deposit;

    @Column(name = "total_amount", precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "remaining_balance", precision = 12, scale = 2)
    private BigDecimal remainingBalance;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method")
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status")
    private PaymentStatus paymentStatus;

    @Column(name = "mpesa_code", length = 50)
    private String mpesaCode;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(columnDefinition = "TEXT")
    private String signature;

    @Column(name = "terms_accepted")
    private Boolean termsAccepted;

    @Column(name = "terms_accepted_at")
    private LocalDateTime termsAcceptedAt;

    @Column(name = "rented_by", length = 100)
    private String rentedBy;

    @Column(name = "rented_by_email", length = 100)
    private String rentedByEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RentalStatus status;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "rental", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Payment> payments = new ArrayList<>();
}