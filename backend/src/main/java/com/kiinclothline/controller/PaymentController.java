package com.kiinclothline.controller;

import com.kiinclothline.dto.request.PaymentRequest;
import com.kiinclothline.dto.response.ApiResponse;
import com.kiinclothline.dto.response.PaymentResponse;
import com.kiinclothline.security.UserPrincipal;
import com.kiinclothline.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Payment Management APIs")
@SecurityRequirement(name = "bearerAuth")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES')")
    @Operation(summary = "Record payment", description = "Record a new payment")
    public ResponseEntity<ApiResponse<PaymentResponse>> recordPayment(
            @Valid @RequestBody PaymentRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        log.info("Recording payment by user: {}", user.getEmail());
        PaymentResponse response = paymentService.recordPayment(request, user.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Payment recorded successfully"));
    }

    @GetMapping("/{paymentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES')")
    @Operation(summary = "Get payment by ID", description = "Get payment details by ID")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentById(@PathVariable String paymentId) {
        log.info("Fetching payment: {}", paymentId);
        PaymentResponse response = paymentService.getPaymentById(paymentId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/order/{orderId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES')")
    @Operation(summary = "Get payments by order", description = "Get all payments for an order")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getPaymentsByOrder(
            @PathVariable String orderId) {
        log.info("Fetching payments for order: {}", orderId);
        List<PaymentResponse> responses = paymentService.getPaymentsByOrder(orderId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/rental/{rentalId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES')")
    @Operation(summary = "Get payments by rental", description = "Get all payments for a rental")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getPaymentsByRental(
            @PathVariable String rentalId) {
        log.info("Fetching payments for rental: {}", rentalId);
        List<PaymentResponse> responses = paymentService.getPaymentsByRental(rentalId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/date-range")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    @Operation(summary = "Get payments by date range", description = "Get payments between dates")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getPaymentsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        log.info("Fetching payments from {} to {}", startDate, endDate);
        List<PaymentResponse> responses = paymentService.getPaymentsByDateRange(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @DeleteMapping("/{paymentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    @Operation(summary = "Delete payment", description = "Delete a payment")
    public ResponseEntity<ApiResponse<Void>> deletePayment(@PathVariable String paymentId) {
        log.info("Deleting payment: {}", paymentId);
        paymentService.deletePayment(paymentId);
        return ResponseEntity.ok(ApiResponse.success(null, "Payment deleted successfully"));
    }

    @GetMapping("/stats/total")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    @Operation(summary = "Get total payments", description = "Get total payments for a date range")
    public ResponseEntity<ApiResponse<Double>> getTotalPayments(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        double total = paymentService.getTotalPayments(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(total, "Total payments calculated successfully"));
    }
}