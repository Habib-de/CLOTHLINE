package com.kiinclothline.dto.request;

import com.kiinclothline.enums.SuitCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuitRequest {

    @NotBlank(message = "Suit name is required")
    private String name;

    private String detail;

    @NotNull(message = "Category is required")
    private SuitCategory category;

    private String suitType;
    private String color;

    @NotNull(message = "Price is required")
    private BigDecimal price;

    private List<String> imageUrls;
}