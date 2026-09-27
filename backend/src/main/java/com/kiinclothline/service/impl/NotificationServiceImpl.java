package com.kiinclothline.service.impl;

import com.kiinclothline.entity.Notification;
import com.kiinclothline.entity.User;
import com.kiinclothline.enums.NotificationType;
import com.kiinclothline.exception.ResourceNotFoundException;
import com.kiinclothline.repository.NotificationRepository;
import com.kiinclothline.repository.UserRepository;
import com.kiinclothline.service.NotificationService;
import com.kiinclothline.util.StringUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public Notification createNotification(User user, String message, NotificationType type, String link) {
        Notification notification = Notification.builder()
                .id(StringUtils.generateId())
                .userId(user.getId())
                .message(message)
                .type(type)
                .link(link)
                .isRead(false)
                .build();

        return notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public Notification createNotificationForAll(String message, NotificationType type, String link) {
        // Get all active users
        List<User> users = userRepository.findByStatus(com.kiinclothline.enums.UserStatus.ACTIVE);
        
        Notification lastNotification = null;
        for (User user : users) {
            lastNotification = createNotification(user, message, type, link);
        }
        
        return lastNotification;
    }

    @Override
    @Transactional
    public void markAsRead(String notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));
        
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead(User user) {
        List<Notification> notifications = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(user.getId());
        for (Notification notification : notifications) {
            notification.setIsRead(true);
        }
        notificationRepository.saveAll(notifications);
    }

    @Override
    public List<Notification> getUserNotifications(User user) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    @Override
    public List<Notification> getUserUnreadNotifications(User user) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(user.getId());
    }

    @Override
    public long countUnread(User user) {
        return notificationRepository.countByUserIdAndIsReadFalse(user.getId());
    }

    @Override
    @Transactional
    public void deleteNotification(String notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));
        notificationRepository.delete(notification);
    }

    @Override
    @Transactional
    public void deleteAllUserNotifications(User user) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        notificationRepository.deleteAll(notifications);
    }
}