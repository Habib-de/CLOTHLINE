package com.kiinclothline.repository;

import com.kiinclothline.entity.SuitImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SuitImageRepository extends JpaRepository<SuitImage, Long> {
    List<SuitImage> findBySuitIdOrderByImageOrder(Long suitId);
    void deleteBySuitId(Long suitId);
}