package com.kiinclothline.dto.response;

import com.kiinclothline.enums.Role;
import com.kiinclothline.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String id;
    private String name;
    private String email;
    private String phone;
    private String address;
    private Role role;
    private UserStatus status;
    private String tenantId;
    private String tenantName;
    private String token;
    private String tokenType;
}