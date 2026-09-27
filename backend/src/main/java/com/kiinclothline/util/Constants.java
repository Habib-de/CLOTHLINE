package com.kiinclothline.util;

public class Constants {
    // JWT
    public static final String TOKEN_PREFIX = "Bearer ";
    public static final String HEADER_STRING = "Authorization";
    public static final String JWT_SECRET = "jwt.secret";
    public static final String JWT_EXPIRATION = "jwt.expiration";

    // Roles
    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_OWNER = "OWNER";
    public static final String ROLE_SALES = "SALES";
    public static final String ROLE_TAILOR = "TAILOR";
    public static final String ROLE_CLIENT = "CLIENT";

    // Status
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_INACTIVE = "INACTIVE";

    // Order Status
    public static final String ORDER_PENDING = "PENDING";
    public static final String ORDER_IN_PROGRESS = "IN_PROGRESS";
    public static final String ORDER_COMPLETED = "COMPLETED";
    public static final String ORDER_CANCELLED = "CANCELLED";

    // Rental Status
    public static final String RENTAL_PENDING = "PENDING";
    public static final String RENTAL_RENTED = "RENTED";
    public static final String RENTAL_RETURNED = "RETURNED";
    public static final String RENTAL_CANCELLED = "CANCELLED";

    // Payment Method
    public static final String PAYMENT_CASH = "CASH";
    public static final String PAYMENT_M_PESA = "M_PESA";
    public static final String PAYMENT_BANK = "BANK";

    // Payment Status
    public static final String PAYMENT_PENDING = "PENDING";
    public static final String PAYMENT_PARTIAL = "PARTIAL";
    public static final String PAYMENT_PAID = "PAID";

    // API Endpoints
    public static final String API_BASE = "/api";
    public static final String API_AUTH = API_BASE + "/auth";
    public static final String API_ADMIN = API_BASE + "/admin";
    public static final String API_OWNER = API_BASE + "/owner";
    public static final String API_SALES = API_BASE + "/sales";
    public static final String API_TAILOR = API_BASE + "/tailor";

    // Default Values
    public static final String DEFAULT_ROLE = "CLIENT";
    public static final String DEFAULT_STATUS = "PENDING";
    public static final String DEFAULT_LANGUAGE = "en";

    // Dates
    public static final String DATE_FORMAT = "yyyy-MM-dd";
    public static final String DATE_TIME_FORMAT = "yyyy-MM-dd HH:mm:ss";
    public static final String TIMEZONE = "Africa/Nairobi";

    // Admin Key
    public static final String ADMIN_SECRET_KEY = "kiin_admin_2026";
}