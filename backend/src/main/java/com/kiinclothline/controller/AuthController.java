package com.kiinclothline.controller;

import com.kiinclothline.dto.request.LoginRequest;
import com.kiinclothline.dto.request.RegisterRequest;
import com.kiinclothline.dto.response.ApiResponse;
import com.kiinclothline.dto.response.AuthResponse;
import com.kiinclothline.exception.BadRequestException;
import com.kiinclothline.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication APIs")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Login user", description = "Authenticate user and return JWT token")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login attempt for user: {}", request.getEmail());
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
    }

    @PostMapping("/register")
    @Operation(summary = "Register user", description = "Register a new user")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Registration attempt for user: {}", request.getEmail());
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Registration successful"));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout user", description = "Logout current user")
    public ResponseEntity<ApiResponse<Void>> logout() {
        log.info("Logout request received");
        // JWT is stateless, client handles token removal
        return ResponseEntity.ok(ApiResponse.success(null, "Logout successful"));
    }

     @PostMapping("/forgot-password")
    @Operation(summary = "Forgot password", description = "Send password reset link to user's email")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        log.info("Password reset requested for: {}", email);
        
        authService.sendPasswordResetLink(email);
        
        // Always return success to prevent email enumeration
        return ResponseEntity.ok(ApiResponse.success(null, "Password reset link sent to your email"));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password", description = "Reset password using token")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");
        
        log.info("Password reset attempt with token");
        boolean success = authService.resetPassword(token, newPassword);
        
        if (!success) {
            throw new BadRequestException("Invalid or expired reset token");
        }
        
        return ResponseEntity.ok(ApiResponse.success(null, "Password reset successful"));
    }

    @GetMapping("/verify-reset-token/{token}")
    @Operation(summary = "Verify reset token", description = "Check if reset token is valid")
    public ResponseEntity<ApiResponse<Boolean>> verifyResetToken(@PathVariable String token) {
        boolean valid = authService.verifyResetToken(token);
        return ResponseEntity.ok(ApiResponse.success(valid, valid ? "Token is valid" : "Token is invalid or expired"));
    }
}