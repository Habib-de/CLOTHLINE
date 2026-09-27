package com.kiinclothline.repository;

import com.kiinclothline.entity.Tenant;
import com.kiinclothline.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, String> {
    Optional<Tenant> findByName(String name);
    Optional<Tenant> findByOwnerId(String ownerId);
    List<Tenant> findByStatus(UserStatus status);
    boolean existsByName(String name);
}