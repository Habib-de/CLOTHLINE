package com.kiinclothline.service;

import com.kiinclothline.dto.request.LoginRequest;
import com.kiinclothline.dto.request.RegisterRequest;
import com.kiinclothline.dto.response.AuthResponse;
import com.kiinclothline.entity.User;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    AuthResponse register(RegisterRequest request);
    User getCurrentUser();
    boolean existsByEmail(String email);
    void logout(String token);

    boolean sendPasswordResetLink(String email);
    boolean resetPassword(String token, String newPassword);
    boolean verifyResetToken(String token);
}