package com.kiinclothline.controller;

import com.kiinclothline.dto.request.OrderRequest;
import com.kiinclothline.dto.response.ApiResponse;
import com.kiinclothline.dto.response.OrderResponse;
import com.kiinclothline.enums.OrderStatus;
import com.kiinclothline.security.UserPrincipal;
import com.kiinclothline.service.OrderService;
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
@RequestMapping("/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Order Management APIs")
@SecurityRequirement(name = "bearerAuth")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES')")
    @Operation(summary = "Create order", description = "Create a new tailoring order")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @Valid @RequestBody OrderRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        log.info("Creating order by user: {}", user.getEmail());
        OrderResponse response = orderService.createOrder(request, user.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Order created successfully"));
    }

    @PutMapping("/{orderId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES')")
    @Operation(summary = "Update order", description = "Update an existing order")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrder(
            @PathVariable String orderId,
            @Valid @RequestBody OrderRequest request) {
        log.info("Updating order: {}", orderId);
        OrderResponse response = orderService.updateOrder(orderId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Order updated successfully"));
    }

    @GetMapping("/{orderId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES', 'TAILOR')")
    @Operation(summary = "Get order by ID", description = "Get order details by ID")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(@PathVariable String orderId) {
        log.info("Fetching order: {}", orderId);
        OrderResponse response = orderService.getOrderById(orderId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/recno/{recNo}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES', 'TAILOR')")
    @Operation(summary = "Get order by receipt number", description = "Get order details by receipt number")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderByRecNo(@PathVariable String recNo) {
        log.info("Fetching order by recNo: {}", recNo);
        OrderResponse response = orderService.getOrderByRecNo(recNo);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES', 'TAILOR')")
    @Operation(summary = "Get all orders", description = "Get list of all orders")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getAllOrders() {
        log.info("Fetching all orders");
        List<OrderResponse> responses = orderService.getAllOrders();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/customer")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES')")
    @Operation(summary = "Get orders by customer", description = "Get orders by customer name")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getOrdersByCustomer(
            @RequestParam String customerName) {
        log.info("Fetching orders by customer: {}", customerName);
        List<OrderResponse> responses = orderService.getOrdersByCustomer(customerName);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES', 'TAILOR')")
    @Operation(summary = "Get orders by status", description = "Get orders by status")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getOrdersByStatus(
            @PathVariable OrderStatus status) {
        log.info("Fetching orders by status: {}", status);
        List<OrderResponse> responses = orderService.getOrdersByStatus(status);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/tailor/{tailorEmail}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'TAILOR')")
    @Operation(summary = "Get orders by tailor", description = "Get orders assigned to a tailor")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getOrdersByTailor(
            @PathVariable String tailorEmail) {
        log.info("Fetching orders for tailor: {}", tailorEmail);
        List<OrderResponse> responses = orderService.getOrdersByTailor(tailorEmail);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/date-range")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    @Operation(summary = "Get orders by date range", description = "Get orders between dates")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getOrdersByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        log.info("Fetching orders from {} to {}", startDate, endDate);
        List<OrderResponse> responses = orderService.getOrdersByDateRange(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PatchMapping("/{orderId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES', 'TAILOR')")
    @Operation(summary = "Update order status", description = "Update the status of an order")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable String orderId,
            @RequestParam OrderStatus status) {
        log.info("Updating status for order: {} to {}", orderId, status);
        OrderResponse response = orderService.updateOrderStatus(orderId, status);
        return ResponseEntity.ok(ApiResponse.success(response, "Order status updated successfully"));
    }

    @DeleteMapping("/{orderId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    @Operation(summary = "Delete order", description = "Delete an order")
    public ResponseEntity<ApiResponse<Void>> deleteOrder(@PathVariable String orderId) {
        log.info("Deleting order: {}", orderId);
        orderService.deleteOrder(orderId);
        return ResponseEntity.ok(ApiResponse.success(null, "Order deleted successfully"));
    }

    @GetMapping("/stats/count")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    @Operation(summary = "Get order count", description = "Get total number of orders")
    public ResponseEntity<ApiResponse<Long>> getOrderCount() {
        long count = orderService.countOrders();
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @GetMapping("/stats/revenue")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    @Operation(summary = "Get total revenue", description = "Get total revenue for a date range")
    public ResponseEntity<ApiResponse<Double>> getTotalRevenue(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        double revenue = orderService.getTotalRevenue(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(revenue, "Revenue calculated successfully"));
    }
}