package com.kiinclothline.dto.request;

import com.kiinclothline.enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderRequest {

    @NotBlank(message = "Receipt number is required")
    private String recNo;

    @NotNull(message = "Order date is required")
    private LocalDate orderDate;

    @NotBlank(message = "Customer name is required")
    private String customerName;

    private String customerPhone;
    private String customerAddress;
    private String suitType;
    private String style;
    private BigDecimal deposit;
    private BigDecimal total;

    private String tailorEmail;
    private OrderStatus status;

    private List<MeasurementItemRequest> measurementItems;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MeasurementItemRequest {
        private String id;
        private String itemType; // "coat" or "trouser"
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
}