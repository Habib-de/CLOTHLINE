package com.kiinclothline.service.impl;

import com.kiinclothline.dto.request.PaymentRequest;
import com.kiinclothline.dto.response.PaymentResponse;
import com.kiinclothline.entity.Order;
import com.kiinclothline.entity.Payment;
import com.kiinclothline.entity.SuitRental;
import com.kiinclothline.entity.User;
import com.kiinclothline.enums.PaymentStatus;
import com.kiinclothline.exception.BadRequestException;
import com.kiinclothline.exception.ResourceNotFoundException;
import com.kiinclothline.repository.OrderRepository;
import com.kiinclothline.repository.PaymentRepository;
import com.kiinclothline.repository.SuitRentalRepository;
import com.kiinclothline.repository.UserRepository;
import com.kiinclothline.service.PaymentService;
import com.kiinclothline.util.StringUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final SuitRentalRepository rentalRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public PaymentResponse recordPayment(PaymentRequest request, String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Validate payment target
        if (request.getOrderId() == null && request.getRentalId() == null) {
            throw new BadRequestException("Either orderId or rentalId must be provided");
        }

        if (request.getOrderId() != null && request.getRentalId() != null) {
            throw new BadRequestException("Cannot pay for both order and rental at the same time");
        }

        Payment payment = Payment.builder()
                .id(StringUtils.generateId())
                .amount(request.getAmount())
                .method(request.getMethod())
                .note(request.getNote())
                .paymentDate(request.getPaymentDate())
                .receiptNo(request.getReceiptNo())
                .receivedBy(user.getName() + " (" + user.getRole() + ")")
                .build();

        // Handle order payment
        if (request.getOrderId() != null) {
            Order order = orderRepository.findById(request.getOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Order", "id", request.getOrderId()));
            
            payment.setOrder(order);
            
            // Update order balance
            BigDecimal newDeposit = order.getDeposit().add(request.getAmount());
            BigDecimal newBalance = order.getTotal().subtract(newDeposit);
            
            order.setDeposit(newDeposit);
            order.setBalance(newBalance);
            
            if (newBalance.compareTo(BigDecimal.ZERO) == 0) {
                order.setPaymentStatus(PaymentStatus.PAID);
            } else if (newDeposit.compareTo(BigDecimal.ZERO) > 0) {
                order.setPaymentStatus(PaymentStatus.PARTIAL);
            }
            
            orderRepository.save(order);
        }

        // Handle rental payment
        if (request.getRentalId() != null) {
            SuitRental rental = rentalRepository.findById(request.getRentalId())
                    .orElseThrow(() -> new ResourceNotFoundException("Rental", "id", request.getRentalId()));
            
            payment.setRental(rental);
            
            // Update rental balance
            BigDecimal newDeposit = rental.getDeposit().add(request.getAmount());
            BigDecimal newBalance = rental.getTotalAmount().subtract(newDeposit);
            
            rental.setDeposit(newDeposit);
            rental.setRemainingBalance(newBalance);
            
            if (newBalance.compareTo(BigDecimal.ZERO) == 0) {
                rental.setPaymentStatus(PaymentStatus.PAID);
            } else if (newDeposit.compareTo(BigDecimal.ZERO) > 0) {
                rental.setPaymentStatus(PaymentStatus.PARTIAL);
            }
            
            rentalRepository.save(rental);
        }

        Payment savedPayment = paymentRepository.save(payment);
        return convertToResponse(savedPayment);
    }

    @Override
    public PaymentResponse getPaymentById(String paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));
        return convertToResponse(payment);
    }

    @Override
    public List<PaymentResponse> getPaymentsByOrder(String orderId) {
        return paymentRepository.findByOrderId(orderId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<PaymentResponse> getPaymentsByRental(String rentalId) {
        return paymentRepository.findByRentalId(rentalId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<PaymentResponse> getPaymentsByDateRange(LocalDate startDate, LocalDate endDate) {
        return paymentRepository.findByPaymentDateBetween(startDate, endDate).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deletePayment(String paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));
        
        // Revert the payment from order or rental
        if (payment.getOrder() != null) {
            Order order = payment.getOrder();
            order.setDeposit(order.getDeposit().subtract(payment.getAmount()));
            order.setBalance(order.getTotal().subtract(order.getDeposit()));
            
            if (order.getBalance().compareTo(BigDecimal.ZERO) == 0) {
                order.setPaymentStatus(PaymentStatus.PAID);
            } else if (order.getDeposit().compareTo(BigDecimal.ZERO) > 0) {
                order.setPaymentStatus(PaymentStatus.PARTIAL);
            } else {
                order.setPaymentStatus(PaymentStatus.PENDING);
            }
            
            orderRepository.save(order);
        }
        
        if (payment.getRental() != null) {
            SuitRental rental = payment.getRental();
            rental.setDeposit(rental.getDeposit().subtract(payment.getAmount()));
            rental.setRemainingBalance(rental.getTotalAmount().subtract(rental.getDeposit()));
            
            if (rental.getRemainingBalance().compareTo(BigDecimal.ZERO) == 0) {
                rental.setPaymentStatus(PaymentStatus.PAID);
            } else if (rental.getDeposit().compareTo(BigDecimal.ZERO) > 0) {
                rental.setPaymentStatus(PaymentStatus.PARTIAL);
            } else {
                rental.setPaymentStatus(PaymentStatus.PENDING);
            }
            
            rentalRepository.save(rental);
        }
        
        paymentRepository.delete(payment);
    }

    @Override
    public double getTotalPayments(LocalDate startDate, LocalDate endDate) {
        List<Payment> payments = paymentRepository.findByPaymentDateBetween(startDate, endDate);
        return payments.stream()
                .mapToDouble(p -> p.getAmount().doubleValue())
                .sum();
    }

    private PaymentResponse convertToResponse(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .amount(payment.getAmount())
                .method(payment.getMethod().name())
                .note(payment.getNote())
                .paymentDate(payment.getPaymentDate())
                .receiptNo(payment.getReceiptNo())
                .receivedBy(payment.getReceivedBy())
                .orderId(payment.getOrder() != null ? payment.getOrder().getId() : null)
                .rentalId(payment.getRental() != null ? payment.getRental().getId() : null)
                .build();
    }
}