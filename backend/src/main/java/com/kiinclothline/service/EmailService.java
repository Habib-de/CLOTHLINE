package com.kiinclothline.service;

public interface EmailService {
    void sendPasswordResetEmail(String to, String name, String resetLink);
}