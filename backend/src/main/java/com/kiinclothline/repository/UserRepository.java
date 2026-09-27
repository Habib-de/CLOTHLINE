package com.kiinclothline.repository;

import com.kiinclothline.entity.User;
import com.kiinclothline.enums.Role;
import com.kiinclothline.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRole(Role role);
    List<User> findByStatus(UserStatus status);
    List<User> findByRoleAndStatus(Role role, UserStatus status);
    List<User> findByTenantId(String tenantId);
    long countByStatus(UserStatus status);
}