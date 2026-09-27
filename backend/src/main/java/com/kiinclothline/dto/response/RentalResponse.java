package com.kiinclothline.dto.response;

import com.kiinclothline.enums.PaymentMethod;
import com.kiinclothline.enums.PaymentStatus;
import com.kiinclothline.enums.RentalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RentalResponse {
    private String id;
    private String reference;
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private String customerIdNumber;
    private String customerIdImage;
    private String suitName;
    private String suitCategory;
    private String suitColor;
    private BigDecimal suitPricePerDay;
    private LocalDate rentalStartDate;
    private LocalDate rentalEndDate;
    private Integer days;
    private BigDecimal rentalFee;
    private BigDecimal deposit;
    private BigDecimal totalAmount;
    private BigDecimal remainingBalance;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private String mpesaCode;
    private String notes;
    private String signature;
    private Boolean termsAccepted;
    private LocalDateTime termsAcceptedAt;
    private String rentedBy;
    private String rentedByEmail;
    private RentalStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<PaymentResponse> payments;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentResponse {
        private String id;
        private BigDecimal amount;
        private String method;
        private String note;
        private LocalDate paymentDate;
        private String receivedBy;
    }
}