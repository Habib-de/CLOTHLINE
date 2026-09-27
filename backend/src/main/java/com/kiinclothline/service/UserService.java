package com.kiinclothline.service;

import com.kiinclothline.dto.request.RegisterRequest;
import com.kiinclothline.dto.response.AuthResponse;
import com.kiinclothline.entity.User;
import com.kiinclothline.enums.Role;
import com.kiinclothline.enums.UserStatus;

import java.util.List;

public interface UserService {
    User createUser(RegisterRequest request);
    User updateUser(String userId, RegisterRequest request);
    User getUserById(String userId);
    User getUserByEmail(String email);
    List<User> getAllUsers();
    List<User> getUsersByRole(Role role);
    List<User> getUsersByStatus(UserStatus status);
    List<User> getUsersByTenant(String tenantId);
    User activateUser(String userId, String activatedBy);
    User deactivateUser(String userId);
    void deleteUser(String userId);
    boolean existsByEmail(String email);
    long countUsersByStatus(UserStatus status);

    void changePassword(String userId, String currentPassword, String newPassword);
}