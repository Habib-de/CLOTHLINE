package com.kiinclothline.service;

import com.kiinclothline.dto.request.PaymentRequest;
import com.kiinclothline.dto.response.PaymentResponse;

import java.time.LocalDate;
import java.util.List;

public interface PaymentService {
    PaymentResponse recordPayment(PaymentRequest request, String userId);
    PaymentResponse getPaymentById(String paymentId);
    List<PaymentResponse> getPaymentsByOrder(String orderId);
    List<PaymentResponse> getPaymentsByRental(String rentalId);
    List<PaymentResponse> getPaymentsByDateRange(LocalDate startDate, LocalDate endDate);
    void deletePayment(String paymentId);
    double getTotalPayments(LocalDate startDate, LocalDate endDate);
}