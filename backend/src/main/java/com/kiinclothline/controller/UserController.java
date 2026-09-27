package com.kiinclothline.controller;

import com.kiinclothline.dto.request.PasswordChangeRequest;
import com.kiinclothline.dto.request.RegisterRequest;
import com.kiinclothline.dto.response.ApiResponse;
import com.kiinclothline.entity.User;
import com.kiinclothline.enums.Role;
import com.kiinclothline.enums.UserStatus;
import com.kiinclothline.security.UserPrincipal;
import com.kiinclothline.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User Management APIs")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Get current authenticated user details")
    public ResponseEntity<ApiResponse<User>> getCurrentUser(@AuthenticationPrincipal UserPrincipal user) {
        log.info("Fetching current user: {}", user.getEmail());
        User currentUser = userService.getUserById(user.getId());
        return ResponseEntity.ok(ApiResponse.success(currentUser));
    }

    @PutMapping("/me")
@Operation(summary = "Update current user", description = "Update current user's own profile")
public ResponseEntity<ApiResponse<User>> updateCurrentUser(
        @Valid @RequestBody RegisterRequest request,
        @AuthenticationPrincipal UserPrincipal userPrincipal) {
    log.info("User {} updating their own profile", userPrincipal.getEmail());
    
    // Update using service (handles password encoding if provided)
    User updatedUser = userService.updateUser(userPrincipal.getId(), request);
    
    // Return updated user
    User freshUser = userService.getUserById(userPrincipal.getId());
    return ResponseEntity.ok(ApiResponse.success(freshUser, "Profile updated successfully"));
}

// In UserController.java
@PutMapping("/me/password")
@Operation(summary = "Change password", description = "Change current user's password")
public ResponseEntity<ApiResponse<Void>> changePassword(
        @Valid @RequestBody PasswordChangeRequest request,
        @AuthenticationPrincipal UserPrincipal userPrincipal) {
    log.info("User {} changing password", userPrincipal.getEmail());
    try {
        userService.changePassword(userPrincipal.getId(), request.getCurrentPassword(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success(null, "Password changed successfully"));
    } catch (IllegalArgumentException e) {
        log.error("Password change failed: {}", e.getMessage());
        return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
    } catch (Exception e) {
        log.error("Unexpected error during password change: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("An unexpected error occurred"));
    }
}

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES')")
    @Operation(summary = "Get all users", description = "Get list of all users")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        log.info("Fetching all users");
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    @Operation(summary = "Get user by ID", description = "Get user details by ID")
    public ResponseEntity<ApiResponse<User>> getUserById(@PathVariable String userId) {
        log.info("Fetching user: {}", userId);
        User user = userService.getUserById(userId);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @GetMapping("/email/{email}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    @Operation(summary = "Get user by email", description = "Get user details by email")
    public ResponseEntity<ApiResponse<User>> getUserByEmail(@PathVariable String email) {
        log.info("Fetching user by email: {}", email);
        User user = userService.getUserByEmail(email);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @GetMapping("/role/{role}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    @Operation(summary = "Get users by role", description = "Get users by role")
    public ResponseEntity<ApiResponse<List<User>>> getUsersByRole(@PathVariable Role role) {
        log.info("Fetching users by role: {}", role);
        List<User> users = userService.getUsersByRole(role);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    @Operation(summary = "Get users by status", description = "Get users by status")
    public ResponseEntity<ApiResponse<List<User>>> getUsersByStatus(@PathVariable UserStatus status) {
        log.info("Fetching users by status: {}", status);
        List<User> users = userService.getUsersByStatus(status);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/tenant/{tenantId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    @Operation(summary = "Get users by tenant", description = "Get users by tenant ID")
    public ResponseEntity<ApiResponse<List<User>>> getUsersByTenant(@PathVariable String tenantId) {
        log.info("Fetching users by tenant: {}", tenantId);
        List<User> users = userService.getUsersByTenant(tenantId);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @PutMapping("/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    @Operation(summary = "Update user", description = "Update user details")
    public ResponseEntity<ApiResponse<User>> updateUser(
            @PathVariable String userId,
            @Valid @RequestBody RegisterRequest request) {
        log.info("Updating user: {}", userId);
        User updatedUser = userService.updateUser(userId, request);
        return ResponseEntity.ok(ApiResponse.success(updatedUser, "User updated successfully"));
    }

    @PatchMapping("/{userId}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    @Operation(summary = "Activate user", description = "Activate a user account")
    public ResponseEntity<ApiResponse<User>> activateUser(
            @PathVariable String userId,
            @AuthenticationPrincipal UserPrincipal user) {
        log.info("Activating user: {} by {}", userId, user.getEmail());
        User activatedUser = userService.activateUser(userId, user.getEmail());
        return ResponseEntity.ok(ApiResponse.success(activatedUser, "User activated successfully"));
    }

    @PatchMapping("/{userId}/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    @Operation(summary = "Deactivate user", description = "Deactivate a user account")
    public ResponseEntity<ApiResponse<User>> deactivateUser(@PathVariable String userId) {
        log.info("Deactivating user: {}", userId);
        User deactivatedUser = userService.deactivateUser(userId);
        return ResponseEntity.ok(ApiResponse.success(deactivatedUser, "User deactivated successfully"));
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    @Operation(summary = "Delete user", description = "Delete a user")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable String userId) {
        log.info("Deleting user: {}", userId);
        userService.deleteUser(userId);
        return ResponseEntity.ok(ApiResponse.success(null, "User deleted successfully"));
    }

    @GetMapping("/stats/count/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    @Operation(summary = "Count users by status", description = "Count users by status")
    public ResponseEntity<ApiResponse<Long>> countUsersByStatus(@PathVariable UserStatus status) {
        long count = userService.countUsersByStatus(status);
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @GetMapping("/exists")
    @Operation(summary = "Check user exists", description = "Check if user exists by email")
    public ResponseEntity<ApiResponse<Boolean>> existsByEmail(@RequestParam String email) {
        boolean exists = userService.existsByEmail(email);
        return ResponseEntity.ok(ApiResponse.success(exists));
    }
}