package com.kiinclothline.util;

import java.util.UUID;

public class StringUtils {

    public static boolean isNullOrEmpty(String str) {
        return str == null || str.trim().isEmpty();
    }

    public static boolean isNotNullOrEmpty(String str) {
        return !isNullOrEmpty(str);
    }

    public static String generateId() {
        return UUID.randomUUID().toString();
    }

    public static String generateReference(String prefix) {
        String timestamp = String.valueOf(System.currentTimeMillis()).substring(5);
        String random = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        return prefix + "-" + timestamp + "-" + random;
    }

    public static String normalizeEmail(String email) {
        return email != null ? email.trim().toLowerCase() : "";
    }

    public static String safeSubstring(String str, int maxLength) {
        if (isNullOrEmpty(str)) return "";
        return str.length() > maxLength ? str.substring(0, maxLength) + "..." : str;
    }

    public static boolean isValidEmail(String email) {
        if (isNullOrEmpty(email)) return false;
        String emailRegex = "^[A-Za-z0-9+_.-]+@(.+)$";
        return email.matches(emailRegex);
    }

    public static String capitalize(String str) {
        if (isNullOrEmpty(str)) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }

    public static String generateRecNo() {
        String timestamp = String.valueOf(System.currentTimeMillis()).substring(4);
        return "R" + timestamp;
    }
}