// src/context/NotificationContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('kiin_notifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
        setUnreadCount(parsed.filter(n => !n.read).length);
      } catch (e) {
        console.error('Error loading notifications:', e);
      }
    }
  }, []);

  // Save notifications to localStorage
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('kiin_notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  const addNotification = (message, type = 'info', link = null, userId = null) => {
    // ✅ Check for duplicate notifications (prevents double count)
    const isDuplicate = notifications.some(n => 
      n.message === message && 
      n.type === type && 
      n.userId === userId &&
      Date.now() - new Date(n.createdAt).getTime() < 5000
    );
    
    if (isDuplicate) {
      console.log('⚠️ Duplicate notification prevented:', message);
      return null;
    }

    const notification = {
      id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 4),
      message,
      type,
      link,
      userId,
      read: false,
      createdAt: new Date().toISOString(),
      timestamp: Date.now()
    };

    // ✅ Update both state and localStorage consistently
    setNotifications(prev => {
      const updated = [notification, ...prev].slice(0, 200);
      localStorage.setItem('kiin_notifications', JSON.stringify(updated));
      return updated;
    });
    
    setUnreadCount(prev => prev + 1);
    
    return notification;
  };

  const markAsRead = (id, currentUser) => {
    // If no user, don't mark anything
    if (!currentUser) return;
    
    const userEmail = currentUser.email;
    if (!userEmail) return;
    
    setNotifications(prev => {
      const updated = prev.map(n => {
        // Only mark as read if this notification belongs to the current user
        if (n.id === id && (n.userId === userEmail || n.userId === 'all' || !n.userId)) {
          return { ...n, read: true };
        }
        return n;
      });
      localStorage.setItem('kiin_notifications', JSON.stringify(updated));
      return updated;
    });
    
    // ✅ Recalculate unread count for this user
    const current = JSON.parse(localStorage.getItem('kiin_notifications') || '[]');
    const userNotifications = current.filter(n => 
      n.userId === userEmail || n.userId === 'all' || !n.userId
    );
    setUnreadCount(userNotifications.filter(n => !n.read).length);
  };

  const markAllAsRead = (currentUser) => {
    // If no user, don't mark anything
    if (!currentUser) return;
    
    const userEmail = currentUser.email;
    if (!userEmail) return;
    
    setNotifications(prev => {
      const updated = prev.map(n => {
        // Only mark as read if this notification belongs to the current user
        if (n.userId === userEmail || n.userId === 'all' || !n.userId) {
          return { ...n, read: true };
        }
        return n;
      });
      localStorage.setItem('kiin_notifications', JSON.stringify(updated));
      return updated;
    });
    
    // ✅ Recalculate unread count for this user
    const current = JSON.parse(localStorage.getItem('kiin_notifications') || '[]');
    const userNotifications = current.filter(n => 
      n.userId === userEmail || n.userId === 'all' || !n.userId
    );
    setUnreadCount(userNotifications.filter(n => !n.read).length);
  };

  const deleteNotification = (id, currentUser) => {
    // If no user, don't delete anything
    if (!currentUser) return;
    
    const userEmail = currentUser.email;
    if (!userEmail) return;
    
    setNotifications(prev => {
      const updated = prev.filter(n => {
        // Only delete if this notification belongs to the current user
        if (n.id === id && (n.userId === userEmail || n.userId === 'all' || !n.userId)) {
          return false;
        }
        return true;
      });
      localStorage.setItem('kiin_notifications', JSON.stringify(updated));
      return updated;
    });
    
    // ✅ Recalculate unread count for this user
    const current = JSON.parse(localStorage.getItem('kiin_notifications') || '[]');
    const userNotifications = current.filter(n => 
      n.userId === userEmail || n.userId === 'all' || !n.userId
    );
    setUnreadCount(userNotifications.filter(n => !n.read).length);
  };

  const clearAll = (currentUser) => {
    // If no user, don't clear anything
    if (!currentUser) return;
    
    const userEmail = currentUser.email;
    if (!userEmail) return;
    
    setNotifications(prev => {
      const updated = prev.filter(n => {
        // Only keep notifications that don't belong to this user
        return !(n.userId === userEmail || n.userId === 'all' || !n.userId);
      });
      localStorage.setItem('kiin_notifications', JSON.stringify(updated));
      return updated;
    });
    
    // ✅ Recalculate unread count for this user
    const current = JSON.parse(localStorage.getItem('kiin_notifications') || '[]');
    const userNotifications = current.filter(n => 
      n.userId === userEmail || n.userId === 'all' || !n.userId
    );
    setUnreadCount(userNotifications.filter(n => !n.read).length);
  };

  const getUserNotifications = (currentUser) => {
    // If no user, return empty array
    if (!currentUser) return [];
    
    // Get the user's email - handle different possible structures
    const userEmail = currentUser.email || currentUser.email?.toLowerCase() || null;
    
    // If no email, return empty array (don't show all notifications)
    if (!userEmail) return [];
    
    // Filter notifications for this user
    return notifications.filter(n => {
      // If notification has no userId, it's for everyone
      if (!n.userId) return true;
      // If notification is for 'all' users
      if (n.userId === 'all') return true;
      // Check if this notification is for the current user (case-insensitive)
      return n.userId.toLowerCase() === userEmail.toLowerCase();
    });
  };

  // ✅ NEW: Get unread count for a specific user
  const getUserUnreadCount = (currentUser) => {
    const userNotifications = getUserNotifications(currentUser);
    return userNotifications.filter(n => !n.read).length;
  };

  // ✅ IMPORTANT: This MUST return JSX with children
  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll,
      getUserNotifications,
      getUserUnreadCount
    }}>
      {children}
    </NotificationContext.Provider>
  );
};