package com.kiinclothline.security;

public class SecurityConstants {
    public static final String SECRET = "kiinClothlineSecretKey2026ForJWTGenerationWith256Bits";
    public static final long EXPIRATION_TIME = 86400000; // 24 hours
    public static final String TOKEN_PREFIX = "Bearer ";
    public static final String HEADER_STRING = "Authorization";
    public static final String SIGN_UP_URL = "/api/auth/**";
}