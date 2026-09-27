package com.kiinclothline.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "measurement_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class MeasurementItem {

    @Id
    @Column(length = 50)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "item_type", nullable = false, length = 20)
    private String itemType; // "coat" or "trouser"

    @Column(name = "item_name", nullable = false, length = 50)
    private String itemName;

    // Coat measurements
    @Column(name = "coat_fl", precision = 5, scale = 1)
    private BigDecimal coatFL;

    @Column(name = "coat_ch", precision = 5, scale = 1)
    private BigDecimal coatCh;

    @Column(name = "coat_wa", precision = 5, scale = 1)
    private BigDecimal coatWa;

    @Column(name = "coat_sh", precision = 5, scale = 1)
    private BigDecimal coatSh;

    @Column(name = "coat_sl", precision = 5, scale = 1)
    private BigDecimal coatSl;

    // Trouser measurements
    @Column(name = "t_fl", precision = 5, scale = 1)
    private BigDecimal tFL;

    @Column(name = "t_wa", precision = 5, scale = 1)
    private BigDecimal tWa;

    @Column(name = "t_th", precision = 5, scale = 1)
    private BigDecimal tTh;

    @Column(name = "t_kn", precision = 5, scale = 1)
    private BigDecimal tKn;

    @Column(name = "t_b1", precision = 5, scale = 1)
    private BigDecimal tB1;

    @Column(name = "t_b2", precision = 5, scale = 1)
    private BigDecimal tB2;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}