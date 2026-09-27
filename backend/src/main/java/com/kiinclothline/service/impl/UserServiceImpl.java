package com.kiinclothline.service.impl;

import com.kiinclothline.dto.request.RegisterRequest;
import com.kiinclothline.entity.User;
import com.kiinclothline.enums.Role;
import com.kiinclothline.enums.UserStatus;
import com.kiinclothline.exception.DuplicateResourceException;
import com.kiinclothline.exception.ResourceNotFoundException;
import com.kiinclothline.repository.UserRepository;
import com.kiinclothline.service.UserService;
import com.kiinclothline.util.StringUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public User createUser(RegisterRequest request) {
        log.info("Creating new user with email: {}", request.getEmail());
        
        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("User already exists with email: {}", request.getEmail());
            throw new DuplicateResourceException("User", "email", request.getEmail());
        }

        // Validate password
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }

        // Create new user
        User user = User.builder()
                .id(StringUtils.generateId())
                .name(request.getName())
                .email(request.getEmail().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .address(request.getAddress())
                .bio(request.getBio())
                .role(request.getRole() != null ? request.getRole() : Role.CLIENT)
                .status(request.getRole() == Role.ADMIN ? UserStatus.ACTIVE : UserStatus.PENDING)
                .build();

        User savedUser = userRepository.save(user);
        log.info("User created successfully with id: {}", savedUser.getId());
        
        return savedUser;
    }

    @Override
    @Transactional
    public User updateUser(String userId, RegisterRequest request) {
        log.info("Updating user with id: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("User not found with id: {}", userId);
                    return new ResourceNotFoundException("User", "id", userId);
                });

        // Update fields only if provided
        if (request.getName() != null && !request.getName().isEmpty()) {
            user.setName(request.getName());
        }
        
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress());
        }
        
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            if (request.getPassword().length() < 6) {
                throw new IllegalArgumentException("Password must be at least 6 characters");
            }
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        User updatedUser = userRepository.save(user);
        log.info("User updated successfully with id: {}", updatedUser.getId());
        
        return updatedUser;
    }

    @Override
    public User getUserById(String userId) {
        log.debug("Fetching user by id: {}", userId);
        return userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("User not found with id: {}", userId);
                    return new ResourceNotFoundException("User", "id", userId);
                });
    }

    @Override
    public User getUserByEmail(String email) {
        log.debug("Fetching user by email: {}", email);
        return userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> {
                    log.error("User not found with email: {}", email);
                    return new ResourceNotFoundException("User", "email", email);
                });
    }

    @Override
    public List<User> getAllUsers() {
        log.debug("Fetching all users");
        return userRepository.findAll();
    }

    @Override
    public List<User> getUsersByRole(Role role) {
        log.debug("Fetching users by role: {}", role);
        return userRepository.findByRole(role);
    }

    @Override
    public List<User> getUsersByStatus(UserStatus status) {
        log.debug("Fetching users by status: {}", status);
        return userRepository.findByStatus(status);
    }

    @Override
    public List<User> getUsersByTenant(String tenantId) {
        log.debug("Fetching users by tenantId: {}", tenantId);
        return userRepository.findByTenantId(tenantId);
    }

    @Override
    @Transactional
    public User activateUser(String userId, String activatedBy) {
        log.info("Activating user with id: {} by: {}", userId, activatedBy);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("User not found with id: {}", userId);
                    return new ResourceNotFoundException("User", "id", userId);
                });

        // Check if user is already active
        if (user.getStatus() == UserStatus.ACTIVE) {
            log.warn("User is already active: {}", userId);
            return user;
        }

        user.setStatus(UserStatus.ACTIVE);
        user.setActivatedBy(activatedBy);
        user.setActivatedAt(LocalDateTime.now());

        User activatedUser = userRepository.save(user);
        log.info("User activated successfully: {}", activatedUser.getId());
        
        return activatedUser;
    }

    @Override
    @Transactional
    public User deactivateUser(String userId) {
        log.info("Deactivating user with id: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("User not found with id: {}", userId);
                    return new ResourceNotFoundException("User", "id", userId);
                });

        // Check if user is already inactive
        if (user.getStatus() == UserStatus.INACTIVE) {
            log.warn("User is already inactive: {}", userId);
            return user;
        }

        // Don't deactivate admin users
        if (user.getRole() == Role.ADMIN) {
            log.warn("Cannot deactivate admin user: {}", userId);
            throw new IllegalArgumentException("Cannot deactivate admin user");
        }

        user.setStatus(UserStatus.INACTIVE);

        User deactivatedUser = userRepository.save(user);
        log.info("User deactivated successfully: {}", deactivatedUser.getId());
        
        return deactivatedUser;
    }

    @Override
    @Transactional
    public void deleteUser(String userId) {
        log.info("Deleting user with id: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("User not found with id: {}", userId);
                    return new ResourceNotFoundException("User", "id", userId);
                });

        // Don't delete admin users
        if (user.getRole() == Role.ADMIN) {
            log.warn("Cannot delete admin user: {}", userId);
            throw new IllegalArgumentException("Cannot delete admin user");
        }

        userRepository.delete(user);
        log.info("User deleted successfully: {}", userId);
    }

    @Override
    public boolean existsByEmail(String email) {
        log.debug("Checking if user exists with email: {}", email);
        return userRepository.existsByEmail(email.toLowerCase());
    }

    @Override
    public long countUsersByStatus(UserStatus status) {
        log.debug("Counting users by status: {}", status);
        return userRepository.countByStatus(status);
    }

    /**
     * Additional helper method to get user statistics
     */
    public UserStats getUserStats() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByStatus(UserStatus.ACTIVE);
        long pendingUsers = userRepository.countByStatus(UserStatus.PENDING);
        long inactiveUsers = userRepository.countByStatus(UserStatus.INACTIVE);
        
        return UserStats.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .pendingUsers(pendingUsers)
                .inactiveUsers(inactiveUsers)
                .build();
    }

    /**
     * Helper method to reset password
     */
    @Transactional
    public void resetPassword(String userId, String newPassword) {
        log.info("Resetting password for user: {}", userId);
        
        if (newPassword == null || newPassword.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        log.info("Password reset successfully for user: {}", userId);
    }

    // In UserServiceImpl.java
@Override
@Transactional
public void changePassword(String userId, String currentPassword, String newPassword) {
    log.info("Changing password for user: {}", userId);
    
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    
    // Verify current password
    if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
        throw new IllegalArgumentException("Current password is incorrect");
    }
    
    // Validate new password
    if (newPassword == null || newPassword.length() < 6) {
        throw new IllegalArgumentException("New password must be at least 6 characters");
    }
    
    // Update password
    user.setPassword(passwordEncoder.encode(newPassword));
    userRepository.save(user);
    
    log.info("Password changed successfully for user: {}", userId);
}

    /**
     * Inner class for user statistics
     */
    @lombok.Builder
    @lombok.Data
    public static class UserStats {
        private long totalUsers;
        private long activeUsers;
        private long pendingUsers;
        private long inactiveUsers;
    }
}