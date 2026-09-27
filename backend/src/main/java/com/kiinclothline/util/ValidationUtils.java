package com.kiinclothline.util;

import java.math.BigDecimal;

public class ValidationUtils {

    public static boolean isValidPhone(String phone) {
        if (StringUtils.isNullOrEmpty(phone)) return false;
        // Kenyan phone number validation
        String phoneRegex = "^(254|0)[17][0-9]{8}$";
        return phone.matches(phoneRegex);
    }

    public static boolean isValidAmount(BigDecimal amount) {
        return amount != null && amount.compareTo(BigDecimal.ZERO) >= 0;
    }

    public static boolean isValidPassword(String password) {
        return password != null && password.length() >= 6;
    }

    public static boolean isValidName(String name) {
        return name != null && name.trim().length() >= 2 && name.trim().length() <= 100;
    }

    public static boolean isValidIdNumber(String idNumber) {
        if (StringUtils.isNullOrEmpty(idNumber)) return false;
        return idNumber.matches("^[0-9]{8}$");
    }

    public static boolean isValidDateRange(java.time.LocalDate startDate, java.time.LocalDate endDate) {
        return startDate != null && endDate != null && !endDate.isBefore(startDate);
    }
}