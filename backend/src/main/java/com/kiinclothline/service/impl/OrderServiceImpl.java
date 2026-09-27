package com.kiinclothline.service.impl;

import com.kiinclothline.dto.request.OrderRequest;
import com.kiinclothline.dto.response.OrderResponse;
import com.kiinclothline.entity.MeasurementItem;
import com.kiinclothline.entity.Order;
import com.kiinclothline.entity.User;
import com.kiinclothline.enums.OrderStatus;
import com.kiinclothline.enums.PaymentStatus;
import com.kiinclothline.exception.BadRequestException;
import com.kiinclothline.exception.ResourceNotFoundException;
import com.kiinclothline.repository.MeasurementItemRepository;
import com.kiinclothline.repository.OrderRepository;
import com.kiinclothline.repository.UserRepository;
import com.kiinclothline.service.OrderService;
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
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final MeasurementItemRepository measurementItemRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public OrderResponse createOrder(OrderRequest request, String userId) {
        // Validate customer
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Validate receipt number
        if (orderRepository.findByRecNo(request.getRecNo()).isPresent()) {
            throw new BadRequestException("Receipt number already exists: " + request.getRecNo());
        }

        // Validate dates
        if (request.getOrderDate() == null) {
            request.setOrderDate(LocalDate.now());
        }

        // Validate total and deposit
        BigDecimal total = request.getTotal() != null ? request.getTotal() : BigDecimal.ZERO;
        BigDecimal deposit = request.getDeposit() != null ? request.getDeposit() : BigDecimal.ZERO;
        
        if (deposit.compareTo(total) > 0) {
            throw new BadRequestException("Deposit cannot be greater than total amount");
        }

        BigDecimal balance = total.subtract(deposit);

        // Create order
        Order order = Order.builder()
                .id(StringUtils.generateId())
                .recNo(request.getRecNo())
                .orderDate(request.getOrderDate())
                .customerName(request.getCustomerName())
                .customerPhone(request.getCustomerPhone())
                .customerAddress(request.getCustomerAddress())
                .suitType(request.getSuitType())
                .style(request.getStyle())
                .deposit(deposit)
                .total(total)
                .balance(balance)
                .paymentStatus(balance.compareTo(BigDecimal.ZERO) == 0 ? PaymentStatus.PAID : PaymentStatus.PENDING)
                .status(request.getStatus() != null ? request.getStatus() : OrderStatus.PENDING)
                .tailorEmail(request.getTailorEmail())
                .createdBy(user.getEmail())
                .build();

        Order savedOrder = orderRepository.save(order);

        // Save measurement items
        if (request.getMeasurementItems() != null && !request.getMeasurementItems().isEmpty()) {
            for (OrderRequest.MeasurementItemRequest itemRequest : request.getMeasurementItems()) {
                MeasurementItem item = MeasurementItem.builder()
                        .id(StringUtils.generateId())
                        .order(savedOrder)
                        .itemType(itemRequest.getItemType())
                        .itemName(itemRequest.getItemName())
                        .coatFL(itemRequest.getCoatFL())
                        .coatCh(itemRequest.getCoatCh())
                        .coatWa(itemRequest.getCoatWa())
                        .coatSh(itemRequest.getCoatSh())
                        .coatSl(itemRequest.getCoatSl())
                        .tFL(itemRequest.getTFL())
                        .tWa(itemRequest.getTWa())
                        .tTh(itemRequest.getTTh())
                        .tKn(itemRequest.getTKn())
                        .tB1(itemRequest.getTB1())
                        .tB2(itemRequest.getTB2())
                        .build();
                measurementItemRepository.save(item);
            }
        }

        return convertToResponse(savedOrder);
    }

    @Override
    @Transactional
    public OrderResponse updateOrder(String orderId, OrderRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        // Update fields
        order.setCustomerName(request.getCustomerName());
        order.setCustomerPhone(request.getCustomerPhone());
        order.setCustomerAddress(request.getCustomerAddress());
        order.setSuitType(request.getSuitType());
        order.setStyle(request.getStyle());
        order.setTailorEmail(request.getTailorEmail());

        if (request.getDeposit() != null) {
            order.setDeposit(request.getDeposit());
        }
        if (request.getTotal() != null) {
            order.setTotal(request.getTotal());
            order.setBalance(order.getTotal().subtract(order.getDeposit()));
        }
        if (request.getStatus() != null) {
            order.setStatus(request.getStatus());
        }

        // Update payment status
        if (order.getBalance().compareTo(BigDecimal.ZERO) == 0) {
            order.setPaymentStatus(PaymentStatus.PAID);
        } else if (order.getDeposit().compareTo(BigDecimal.ZERO) > 0) {
            order.setPaymentStatus(PaymentStatus.PARTIAL);
        }

        Order updatedOrder = orderRepository.save(order);

                // Update measurement items
        if (request.getMeasurementItems() != null) {
            // Delete existing items
            measurementItemRepository.deleteByOrderId(orderId);
            
            // Create/recreate items, preserving original IDs when provided
            for (OrderRequest.MeasurementItemRequest itemRequest : request.getMeasurementItems()) {
                                String itemId = itemRequest.getId() != null && !itemRequest.getId().trim().isEmpty()
                        ? itemRequest.getId()
                        : StringUtils.generateId();

                MeasurementItem item = MeasurementItem.builder()
                        .id(itemId)
                        .order(updatedOrder)
                        .itemType(itemRequest.getItemType())
                        .itemName(itemRequest.getItemName())
                        .coatFL(itemRequest.getCoatFL())
                        .coatCh(itemRequest.getCoatCh())
                        .coatWa(itemRequest.getCoatWa())
                        .coatSh(itemRequest.getCoatSh())
                        .coatSl(itemRequest.getCoatSl())
                        .tFL(itemRequest.getTFL())
                        .tWa(itemRequest.getTWa())
                        .tTh(itemRequest.getTTh())
                        .tKn(itemRequest.getTKn())
                        .tB1(itemRequest.getTB1())
                        .tB2(itemRequest.getTB2())
                        .build();
                measurementItemRepository.save(item);
            }
        }

        return convertToResponse(updatedOrder);
    }

    @Override
    public OrderResponse getOrderById(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        return convertToResponse(order);
    }

    @Override
    public OrderResponse getOrderByRecNo(String recNo) {
        Order order = orderRepository.findByRecNo(recNo)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "recNo", recNo));
        return convertToResponse(order);
    }

    @Override
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<OrderResponse> getOrdersByCustomer(String customerName) {
        return orderRepository.findByCustomerNameContainingIgnoreCase(customerName).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<OrderResponse> getOrdersByStatus(OrderStatus status) {
        return orderRepository.findByStatus(status).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<OrderResponse> getOrdersByTailor(String tailorEmail) {
        return orderRepository.findByTailorEmail(tailorEmail).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<OrderResponse> getOrdersByDateRange(LocalDate startDate, LocalDate endDate) {
        return orderRepository.findByOrderDateBetween(startDate, endDate).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(String orderId, OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        
        order.setStatus(status);
        Order updatedOrder = orderRepository.save(order);
        
        return convertToResponse(updatedOrder);
    }

    @Override
    @Transactional
    public void deleteOrder(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        
        // Delete measurement items first
        measurementItemRepository.deleteByOrderId(orderId);
        
        // Delete order
        orderRepository.delete(order);
    }

    @Override
    public long countOrders() {
        return orderRepository.count();
    }

    @Override
    public double getTotalRevenue(LocalDate startDate, LocalDate endDate) {
        Double revenue = orderRepository.getTotalRevenueBetween(startDate, endDate);
        return revenue != null ? revenue : 0.0;
    }

    private OrderResponse convertToResponse(Order order) {
        OrderResponse response = OrderResponse.builder()
                .id(order.getId())
                .recNo(order.getRecNo())
                .orderDate(order.getOrderDate())
                .customerName(order.getCustomerName())
                .customerPhone(order.getCustomerPhone())
                .customerAddress(order.getCustomerAddress())
                .suitType(order.getSuitType())
                .style(order.getStyle())
                .deposit(order.getDeposit())
                .total(order.getTotal())
                .balance(order.getBalance())
                .paymentStatus(order.getPaymentStatus())
                .status(order.getStatus())
                .tailorEmail(order.getTailorEmail())
                .createdBy(order.getCreatedBy())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();

        // Convert measurement items
        if (order.getMeasurementItems() != null) {
            List<OrderResponse.MeasurementItemResponse> items = order.getMeasurementItems().stream()
                    .map(item -> OrderResponse.MeasurementItemResponse.builder()
                            .id(item.getId())
                            .itemType(item.getItemType())
                            .itemName(item.getItemName())
                            .coatFL(item.getCoatFL())
                            .coatCh(item.getCoatCh())
                            .coatWa(item.getCoatWa())
                            .coatSh(item.getCoatSh())
                            .coatSl(item.getCoatSl())
                            .tFL(item.getTFL())
                            .tWa(item.getTWa())
                            .tTh(item.getTTh())
                            .tKn(item.getTKn())
                            .tB1(item.getTB1())
                            .tB2(item.getTB2())
                            .build())
                    .collect(Collectors.toList());
            response.setMeasurementItems(items);
        }

        // Convert payments
        if (order.getPayments() != null) {
            List<OrderResponse.PaymentResponse> payments = order.getPayments().stream()
                    .map(payment -> OrderResponse.PaymentResponse.builder()
                            .id(payment.getId())
                            .amount(payment.getAmount())
                            .method(payment.getMethod().name())
                            .note(payment.getNote())
                            .paymentDate(payment.getPaymentDate())
                            .receivedBy(payment.getReceivedBy())
                            .build())
                    .collect(Collectors.toList());
            response.setPayments(payments);
        }

        return response;
    }
}