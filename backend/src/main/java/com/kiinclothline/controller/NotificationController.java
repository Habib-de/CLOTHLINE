package com.kiinclothline.controller;

import com.kiinclothline.dto.response.ApiResponse;
import com.kiinclothline.entity.Notification;
import com.kiinclothline.entity.User;
import com.kiinclothline.security.UserPrincipal;
import com.kiinclothline.service.NotificationService;
import com.kiinclothline.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Notification Management APIs")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    @GetMapping
    @Operation(summary = "Get user notifications", description = "Get all notifications for current user")
    public ResponseEntity<ApiResponse<List<Notification>>> getUserNotifications(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        log.info("Fetching notifications for user: {}", userPrincipal.getEmail());
        User user = userService.getUserById(userPrincipal.getId());
        List<Notification> notifications = notificationService.getUserNotifications(user);
        return ResponseEntity.ok(ApiResponse.success(notifications));
    }

    @GetMapping("/unread")
    @Operation(summary = "Get unread notifications", description = "Get unread notifications for current user")
    public ResponseEntity<ApiResponse<List<Notification>>> getUnreadNotifications(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        log.info("Fetching unread notifications for user: {}", userPrincipal.getEmail());
        User user = userService.getUserById(userPrincipal.getId());
        List<Notification> notifications = notificationService.getUserUnreadNotifications(user);
        return ResponseEntity.ok(ApiResponse.success(notifications));
    }

    @GetMapping("/count/unread")
    @Operation(summary = "Count unread notifications", description = "Count unread notifications for current user")
    public ResponseEntity<ApiResponse<Long>> countUnreadNotifications(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        log.info("Counting unread notifications for user: {}", userPrincipal.getEmail());
        User user = userService.getUserById(userPrincipal.getId());
        long count = notificationService.countUnread(user);
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @PatchMapping("/{notificationId}/read")
    @Operation(summary = "Mark notification as read", description = "Mark a notification as read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable String notificationId) {
        log.info("Marking notification as read: {}", notificationId);
        notificationService.markAsRead(notificationId);
        return ResponseEntity.ok(ApiResponse.success(null, "Notification marked as read"));
    }

    @PatchMapping("/read-all")
    @Operation(summary = "Mark all as read", description = "Mark all notifications as read")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        log.info("Marking all notifications as read for user: {}", userPrincipal.getEmail());
        User user = userService.getUserById(userPrincipal.getId());
        notificationService.markAllAsRead(user);
        return ResponseEntity.ok(ApiResponse.success(null, "All notifications marked as read"));
    }

    @DeleteMapping("/{notificationId}")
    @Operation(summary = "Delete notification", description = "Delete a notification")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(@PathVariable String notificationId) {
        log.info("Deleting notification: {}", notificationId);
        notificationService.deleteNotification(notificationId);
        return ResponseEntity.ok(ApiResponse.success(null, "Notification deleted successfully"));
    }

    @DeleteMapping("/clear-all")
    @Operation(summary = "Clear all notifications", description = "Delete all notifications for current user")
    public ResponseEntity<ApiResponse<Void>> clearAllNotifications(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        log.info("Clearing all notifications for user: {}", userPrincipal.getEmail());
        User user = userService.getUserById(userPrincipal.getId());
        notificationService.deleteAllUserNotifications(user);
        return ResponseEntity.ok(ApiResponse.success(null, "All notifications cleared"));
    }

    @PostMapping("/send")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    @Operation(summary = "Send notification to all", description = "Send notification to all users")
    public ResponseEntity<ApiResponse<Notification>> sendNotificationToAll(
            @RequestParam String message,
            @RequestParam String type,
            @RequestParam(required = false) String link) {
        log.info("Sending notification to all: {}", message);
        com.kiinclothline.enums.NotificationType notificationType = 
                com.kiinclothline.enums.NotificationType.valueOf(type.toUpperCase());
        Notification notification = notificationService.createNotificationForAll(message, notificationType, link);
        return ResponseEntity.ok(ApiResponse.success(notification, "Notification sent to all users"));
    }
}