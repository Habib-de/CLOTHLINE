package com.kiinclothline.repository;

import com.kiinclothline.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, String> {
    List<Payment> findByOrderId(String orderId);
    List<Payment> findByRentalId(String rentalId);
    List<Payment> findByPaymentDateBetween(LocalDate startDate, LocalDate endDate);
    List<Payment> findByMethod(String method);
}