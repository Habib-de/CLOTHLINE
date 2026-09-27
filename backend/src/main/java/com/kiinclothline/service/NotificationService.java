package com.kiinclothline.service;

import com.kiinclothline.entity.Notification;
import com.kiinclothline.entity.User;
import com.kiinclothline.enums.NotificationType;

import java.util.List;

public interface NotificationService {
    Notification createNotification(User user, String message, NotificationType type, String link);
    Notification createNotificationForAll(String message, NotificationType type, String link);
    void markAsRead(String notificationId);
    void markAllAsRead(User user);
    List<Notification> getUserNotifications(User user);
    List<Notification> getUserUnreadNotifications(User user);
    long countUnread(User user);
    void deleteNotification(String notificationId);
    void deleteAllUserNotifications(User user);
}