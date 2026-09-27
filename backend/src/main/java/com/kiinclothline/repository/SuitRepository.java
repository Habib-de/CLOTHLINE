package com.kiinclothline.repository;

import com.kiinclothline.entity.Suit;
import com.kiinclothline.enums.SuitCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SuitRepository extends JpaRepository<Suit, Long> {
    List<Suit> findByCategory(SuitCategory category);
    List<Suit> findByNameContainingIgnoreCase(String name);
    List<Suit> findByCategoryAndNameContainingIgnoreCase(SuitCategory category, String name);
}