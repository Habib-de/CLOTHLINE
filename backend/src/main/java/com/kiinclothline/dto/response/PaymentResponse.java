package com.kiinclothline.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    private String id;
    private BigDecimal amount;
    private String method;
    private String note;
    private LocalDate paymentDate;
    private String receiptNo;
    private String receivedBy;
    private String orderId;
    private String rentalId;
}