package com.kiinclothline.service;

import com.kiinclothline.dto.request.OrderRequest;
import com.kiinclothline.dto.response.OrderResponse;
import com.kiinclothline.entity.Order;
import com.kiinclothline.enums.OrderStatus;

import java.time.LocalDate;
import java.util.List;

public interface OrderService {
    OrderResponse createOrder(OrderRequest request, String userId);
    OrderResponse updateOrder(String orderId, OrderRequest request);
    OrderResponse getOrderById(String orderId);
    OrderResponse getOrderByRecNo(String recNo);
    List<OrderResponse> getAllOrders();
    List<OrderResponse> getOrdersByCustomer(String customerName);
    List<OrderResponse> getOrdersByStatus(OrderStatus status);
    List<OrderResponse> getOrdersByTailor(String tailorEmail);
    List<OrderResponse> getOrdersByDateRange(LocalDate startDate, LocalDate endDate);
    OrderResponse updateOrderStatus(String orderId, OrderStatus status);
    void deleteOrder(String orderId);
    long countOrders();
    double getTotalRevenue(LocalDate startDate, LocalDate endDate);
}