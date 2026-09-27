package com.kiinclothline.service.impl;

import com.kiinclothline.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Override
    public void sendPasswordResetEmail(String to, String name, String resetLink) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Password Reset Request - KIIN Clothline");
            message.setText(
                "Hello " + name + ",\n\n" +
                "We received a request to reset your password for your KIIN Clothline account.\n\n" +
                "Click the link below to reset your password:\n" +
                resetLink + "\n\n" +
                "This link will expire in 24 hours.\n\n" +
                "If you did not request this, please ignore this email.\n\n" +
                "Best regards,\n" +
                "KIIN Clothline Team"
            );
            
            mailSender.send(message);
            log.info("✅ Password reset email sent to: {}", to);
        } catch (Exception e) {
            log.error("❌ Failed to send password reset email to {}: {}", to, e.getMessage());
            throw new RuntimeException("Failed to send email", e);
        }
    }
}