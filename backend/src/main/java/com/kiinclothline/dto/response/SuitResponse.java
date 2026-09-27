package com.kiinclothline.dto.response;

import com.kiinclothline.enums.SuitCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuitResponse {
    private Long id;
    private String name;
    private String detail;
    private SuitCategory category;
    private String suitType;
    private String color;
    private BigDecimal price;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<String> imageUrls;
}