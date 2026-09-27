package com.kiinclothline.repository;

import com.kiinclothline.entity.Order;
import com.kiinclothline.enums.OrderStatus;
import com.kiinclothline.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {
    Optional<Order> findByRecNo(String recNo);
    List<Order> findByCustomerNameContainingIgnoreCase(String customerName);
    List<Order> findByStatus(OrderStatus status);
    List<Order> findByPaymentStatus(PaymentStatus paymentStatus);
    List<Order> findByTailorEmail(String tailorEmail);
    List<Order> findByOrderDateBetween(LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT o FROM Order o WHERE o.tailorEmail = :tailorEmail AND o.status = :status")
    List<Order> findByTailorEmailAndStatus(@Param("tailorEmail") String tailorEmail, @Param("status") OrderStatus status);
    
    @Query("SELECT SUM(o.total) FROM Order o WHERE o.orderDate BETWEEN :startDate AND :endDate")
    Double getTotalRevenueBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}