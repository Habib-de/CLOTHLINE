package com.kiinclothline.service.impl;

import com.kiinclothline.dto.request.LoginRequest;
import com.kiinclothline.dto.request.RegisterRequest;
import com.kiinclothline.dto.response.AuthResponse;
import com.kiinclothline.entity.Tenant;
import com.kiinclothline.entity.User;
import com.kiinclothline.enums.Role;
import com.kiinclothline.enums.UserStatus;
import com.kiinclothline.exception.BadRequestException;
import com.kiinclothline.exception.DuplicateResourceException;
import com.kiinclothline.exception.ResourceNotFoundException;
import com.kiinclothline.exception.UnauthorizedException;
import com.kiinclothline.repository.TenantRepository;
import com.kiinclothline.repository.UserRepository;
import com.kiinclothline.security.JwtTokenProvider;
import com.kiinclothline.service.AuthService;
import com.kiinclothline.service.EmailService;
import com.kiinclothline.util.Constants;
import com.kiinclothline.util.StringUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kiinclothline.entity.PasswordResetToken;
import com.kiinclothline.repository.PasswordResetTokenRepository;
import java.util.UUID;

import java.time.LocalDateTime;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;  

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    private final PasswordResetTokenRepository resetTokenRepository;
    private final EmailService emailService;


    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));

            // Update last login
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            String token = tokenProvider.generateToken(authentication);

            return AuthResponse.builder()
                    .id(user.getId())
                    .name(user.getName())
                    .email(user.getEmail())
                    .phone(user.getPhone())
                    .address(user.getAddress())
                    .role(user.getRole())
                    .status(user.getStatus())
                    .tenantId(user.getTenantId())
                    .tenantName(user.getTenantName())
                    .token(token)
                    .tokenType("Bearer")
                    .build();

                                } catch (InternalAuthenticationServiceException e) {
            throw new UnauthorizedException(e.getMessage());
        } catch (DisabledException | LockedException e) {
            throw new UnauthorizedException(e.getMessage());
        } catch (BadCredentialsException e) {
            throw new UnauthorizedException("Invalid email or password");
        }
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Validate email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("User", "email", request.getEmail());
        }

        // Validate role
        Role role = request.getRole() != null ? request.getRole() : Role.CLIENT;

        // ✅ ADD THIS - Normalize role to uppercase (prevents 'owner' vs 'OWNER' issue)
try {
    role = Role.valueOf(role.name().toUpperCase());
} catch (IllegalArgumentException e) {
    role = Role.CLIENT;
}

        
        // Validate admin key for admin registration
        if (role == Role.ADMIN) {
            if (request.getAdminKey() == null || !request.getAdminKey().equals(Constants.ADMIN_SECRET_KEY)) {
                throw new BadRequestException("Invalid admin registration key");
            }
        }

        // 1. Create user
        User user = User.builder()
                .id(StringUtils.generateId())
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .address(request.getAddress())
                .bio(request.getBio())
                .role(role)
                .status(role == Role.ADMIN ? UserStatus.ACTIVE : UserStatus.PENDING)
                .build();

        // ✅ CRITICAL FIX: Save user FIRST to get the ID
        User savedUser = userRepository.save(user);

        // 2. Handle owner registration - AFTER user is saved
        if (role == Role.OWNER) {
            if (request.getTenantName() == null || request.getTenantName().trim().isEmpty()) {
                throw new BadRequestException("Tenant name is required for owner registration");
            }

            // Check if tenant already exists
            if (tenantRepository.existsByName(request.getTenantName())) {
                throw new DuplicateResourceException("Tenant", "name", request.getTenantName());
            }

            // Generate tenant ID
            String tenantId = StringUtils.generateReference("TEN");
            
            // ✅ Create tenant with the SAVED user's ID
            Tenant tenant = Tenant.builder()
                    .id(tenantId)
                    .name(request.getTenantName())
                    .ownerId(savedUser.getId())  // ✅ Use savedUser.getId()
                    .status(UserStatus.ACTIVE)
                    .build();
            
            tenantRepository.save(tenant);
            
            // Update user with tenant info
            savedUser.setTenantId(tenantId);
            savedUser.setTenantName(request.getTenantName());
            savedUser = userRepository.save(savedUser);  // ✅ Save again with tenant info
        }

        // 3. Handle sales/tailor registration - join existing tenant
        if (role == Role.SALES || role == Role.TAILOR) {
            if (request.getTenantName() == null || request.getTenantName().trim().isEmpty()) {
                throw new BadRequestException("Tenant name is required to join a store");
            }

            Tenant tenant = tenantRepository.findByName(request.getTenantName())
                    .orElseThrow(() -> new ResourceNotFoundException("Tenant", "name", request.getTenantName()));

            savedUser.setTenantId(tenant.getId());
            savedUser.setTenantName(tenant.getName());
            savedUser = userRepository.save(savedUser);
        }

        // Generate token
        String token = tokenProvider.generateToken(savedUser.getEmail(), savedUser.getRole().name());

        return AuthResponse.builder()
                .id(savedUser.getId())
                .name(savedUser.getName())
                .email(savedUser.getEmail())
                .phone(savedUser.getPhone())
                .address(savedUser.getAddress())
                .role(savedUser.getRole())
                .status(savedUser.getStatus())
                .tenantId(savedUser.getTenantId())
                .tenantName(savedUser.getTenantName())
                .token(token)
                .tokenType("Bearer")
                .build();
    }

    @Override
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("User not authenticated");
        }
        
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public void logout(String token) {
        // In JWT, logout is handled client-side by removing the token
        // We could implement token blacklisting here if needed
        SecurityContextHolder.clearContext();
    }

    // ============================================================
    // ✅ FORGOT PASSWORD METHODS - ADD THIS ENTIRE BLOCK
    // ============================================================

    @Override
    @Transactional
public boolean sendPasswordResetLink(String email) {
    log.info("Sending password reset link for: {}", email);
    
    // Check if user exists (for security, don't reveal if not found)
    User user = userRepository.findByEmail(email).orElse(null);
    
    if (user == null) {
        // Return true to prevent email enumeration attacks
        log.info("Password reset requested for non-existent email: {}", email);
        return true;
    }
    
    // Generate reset token
    String token = UUID.randomUUID().toString();
    
    // Delete any existing tokens for this email
    resetTokenRepository.deleteByEmail(email);
    
    // Save token in database
    PasswordResetToken resetToken = PasswordResetToken.builder()
            .token(token)
            .userId(user.getId())
            .email(email)
            .expiryDate(LocalDateTime.now().plusHours(24)) // 24-hour expiry
            .used(false)
            .build();
    
    resetTokenRepository.save(resetToken);
    
    log.info("✅ Password reset token generated for: {}", email);
    log.info("🔗 Reset token: {}", token);
    
    // ✅ SEND EMAIL WITH RESET LINK
    try {
        String resetLink = "http://localhost:3000/reset-password?token=" + token;
        emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), resetLink);
        log.info("✅ Password reset email sent to: {}", email);
    } catch (Exception e) {
        log.error("❌ Failed to send password reset email: {}", e.getMessage());
        // Still return true to prevent email enumeration attacks
    }
    
    return true;
}

    @Override
    public boolean resetPassword(String token, String newPassword) {
        log.info("Resetting password with token");
        
        // Find valid token
        PasswordResetToken resetToken = resetTokenRepository.findByTokenAndUsedFalse(token)
                .orElse(null);
        
        if (resetToken == null) {
            log.warn("Invalid reset token: {}", token);
            return false;
        }
        
        // Check if token is expired
        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            log.warn("Expired reset token: {}", token);
            return false;
        }
        
        // Find user
        User user = userRepository.findByEmail(resetToken.getEmail())
                .orElse(null);
        
        if (user == null) {
            log.warn("User not found for reset token: {}", token);
            return false;
        }
        
        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        // Mark token as used
        resetToken.setUsed(true);
        resetTokenRepository.save(resetToken);
        
        log.info("✅ Password reset successful for: {}", user.getEmail());
        
        return true;
    }

    @Override
    public boolean verifyResetToken(String token) {
        log.debug("Verifying reset token");
        
        PasswordResetToken resetToken = resetTokenRepository.findByTokenAndUsedFalse(token)
                .orElse(null);
        
        if (resetToken == null) {
            return false;
        }
        
        // Check if token is expired
        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            return false;
        }
        
        return true;
    }
}