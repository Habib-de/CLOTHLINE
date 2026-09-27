package com.kiinclothline.repository;

import com.kiinclothline.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, String> {
    
    Optional<PasswordResetToken> findByTokenAndUsedFalse(String token);
    
    void deleteByEmail(String email);
}