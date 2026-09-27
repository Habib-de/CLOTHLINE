package com.kiinclothline.dto.request;

import com.kiinclothline.enums.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequest {

    @NotNull(message = "Amount is required")
    private BigDecimal amount;

    @NotNull(message = "Payment method is required")
    private PaymentMethod method;

    private String note;

    @NotNull(message = "Payment date is required")
    private LocalDate paymentDate;

    private String orderId;
    private String rentalId;
    private String receiptNo;
}