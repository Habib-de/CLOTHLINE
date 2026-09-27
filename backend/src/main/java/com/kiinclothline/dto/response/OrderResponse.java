package com.kiinclothline.dto.response;

import com.kiinclothline.enums.OrderStatus;
import com.kiinclothline.enums.PaymentStatus;
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
public class OrderResponse {
    private String id;
    private String recNo;
    private LocalDate orderDate;
    private String customerName;
    private String customerPhone;
    private String customerAddress;
    private String suitType;
    private String style;
    private BigDecimal deposit;
    private BigDecimal total;
    private BigDecimal balance;
    private PaymentStatus paymentStatus;
    private OrderStatus status;
    private String tailorEmail;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<MeasurementItemResponse> measurementItems;
    private List<PaymentResponse> payments;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MeasurementItemResponse {
        private String id;
        private String itemType;
        private String itemName;
        private BigDecimal coatFL;
        private BigDecimal coatCh;
        private BigDecimal coatWa;
        private BigDecimal coatSh;
        private BigDecimal coatSl;
        private BigDecimal tFL;
        private BigDecimal tWa;
        private BigDecimal tTh;
        private BigDecimal tKn;
        private BigDecimal tB1;
        private BigDecimal tB2;
    }

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