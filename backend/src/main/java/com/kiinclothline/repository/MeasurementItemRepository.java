package com.kiinclothline.repository;

import com.kiinclothline.entity.MeasurementItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MeasurementItemRepository extends JpaRepository<MeasurementItem, String> {
    List<MeasurementItem> findByOrderId(String orderId);
    void deleteByOrderId(String orderId);
}