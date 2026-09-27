package com.kiinclothline.dto.request;

import com.kiinclothline.enums.PaymentMethod;
import com.kiinclothline.enums.RentalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RentalRequest {

    @NotBlank(message = "Customer name is required")
    private String customerName;

    private String customerPhone;
    private String customerEmail;
    private String customerIdNumber;
    private String customerIdImage;

    @NotBlank(message = "Suit name is required")
    private String suitName;

    private String suitCategory;
    private String suitColor;

    @NotNull(message = "Price per day is required")
    private BigDecimal suitPricePerDay;

    @NotNull(message = "Rental start date is required")
    private LocalDate rentalStartDate;

    @NotNull(message = "Rental end date is required")
    private LocalDate rentalEndDate;

    private BigDecimal deposit;
    private PaymentMethod paymentMethod;
    private String mpesaCode;
    private String notes;
    private String signature;
    private Boolean termsAccepted;
    private RentalStatus status;
}