package com.kiinclothline.controller;

import com.kiinclothline.dto.response.ApiResponse;
import com.kiinclothline.entity.Tenant;
import com.kiinclothline.entity.User;
import com.kiinclothline.enums.UserStatus;
import com.kiinclothline.repository.TenantRepository;
import com.kiinclothline.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/public")  // ✅ All public endpoints here
@RequiredArgsConstructor
public class PublicController {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;  // ✅ Added for email check

    // ✅ CHANGED: Now returns owner name instead of owner ID
    @GetMapping("/tenants")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPublicTenants() {
        log.info("📋 Fetching public tenants for registration");
        List<Tenant> tenants = tenantRepository.findByStatus(UserStatus.ACTIVE);
        
        // ✅ Build response with owner name
        List<Map<String, Object>> result = new ArrayList<>();
        for (Tenant tenant : tenants) {
            Map<String, Object> tenantData = new HashMap<>();
            tenantData.put("id", tenant.getId());
            tenantData.put("name", tenant.getName());
            tenantData.put("status", tenant.getStatus());
            
            // ✅ Get owner name from User repository
            if (tenant.getOwnerId() != null) {
                User owner = userRepository.findById(tenant.getOwnerId()).orElse(null);
                tenantData.put("ownerName", owner != null ? owner.getName() : "Unknown Owner");
                tenantData.put("ownerEmail", owner != null ? owner.getEmail() : "No email");
            } else {
                tenantData.put("ownerName", "Unknown Owner");
                tenantData.put("ownerEmail", "No email");
            }
            
            result.add(tenantData);
        }
        
        log.info("✅ Found {} active tenants", result.size());
        return ResponseEntity.ok(ApiResponse.success(result, "Tenants loaded successfully"));
    }

    // ✅ Public endpoint: Check if user exists by email
    @GetMapping("/users/exists")
    public ResponseEntity<ApiResponse<Boolean>> checkUserExists(@RequestParam String email) {
        log.info("📧 Checking if user exists: {}", email);
        boolean exists = userRepository.existsByEmail(email);
        log.info("✅ User exists: {}", exists);
        return ResponseEntity.ok(ApiResponse.success(exists, "User check completed"));
    }
}