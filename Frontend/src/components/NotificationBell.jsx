// src/components/NotificationBell.jsx
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell, BellRing, X, CheckCheck, Trash2, ChevronRight, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { notificationService } from '../services/api';
import toast from 'react-hot-toast';

export const NotificationBell = ({ user, setActiveView }) => {
  const [showPanel, setShowPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);
  
  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  
  // Clear all confirmation modal state
  const [clearAllModalOpen, setClearAllModalOpen] = useState(false);
  
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAll, 
    getUserNotifications, 
    getUserUnreadCount,
    refreshNotifications
  } = useNotifications();

  const userNotifications = getUserNotifications(user);
  const userUnreadCount = getUserUnreadCount(user);

  

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowPanel(false);
        if (deleteModalOpen) {
          setDeleteModalOpen(false);
          setNotificationToDelete(null);
        }
        if (clearAllModalOpen) {
          setClearAllModalOpen(false);
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [deleteModalOpen, clearAllModalOpen]);

  // Refresh notifications when panel opens
  useEffect(() => {
    if (showPanel && refreshNotifications) {
      refreshNotifications();
    }
  }, [showPanel]);

  const togglePanel = () => {
    setShowPanel(!showPanel);
  };

  const getIcon = () => {
    return userUnreadCount > 0 ? (
      <BellRing className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
    ) : (
      <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
    );
  };

  // ✅ UPDATED: Uppercase types
  const getTypeColor = (type) => {
    const t = type?.toUpperCase() || 'INFO';
    switch(t) {
      case 'PAYMENT': return 'bg-green-50 border-green-200 text-green-700';
      case 'ORDER': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'SECURITY': return 'bg-red-50 border-red-200 text-red-700';
      case 'WARNING': return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'SUCCESS': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getTypeIcon = (type) => {
    const t = type?.toUpperCase() || 'INFO';
    switch(t) {
      case 'PAYMENT': return '💰';
      case 'ORDER': return '📦';
      case 'SECURITY': return '🔐';
      case 'WARNING': return '⚠️';
      case 'SUCCESS': return '✅';
      default: return '📌';
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const navigateToNotifications = () => {
  setShowPanel(false);
  if (typeof setActiveView === 'function') {
    setActiveView('notifications');
  }
};

  // ✅ Handle mark all as read with API
  const handleMarkAllAsRead = async () => {
    setIsLoading(true);
    try {
      await markAllAsRead(user);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Open clear all confirmation modal (instead of window.confirm)
  const openClearAllModal = () => {
    setClearAllModalOpen(true);
  };

  // ✅ Close clear all modal
  const closeClearAllModal = () => {
    setClearAllModalOpen(false);
  };

  // ✅ Confirm clear all
  const confirmClearAll = async () => {
    setIsLoading(true);
    try {
      await clearAll(user);
      toast.success('All notifications cleared');
      closeClearAllModal();
    } catch (error) {
      toast.error('Failed to clear notifications');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Open delete confirmation modal
  const openDeleteModal = (notificationId, e) => {
    e.stopPropagation();
    setNotificationToDelete(notificationId);
    setDeleteModalOpen(true);
  };

  // ✅ Close delete confirmation modal
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setNotificationToDelete(null);
  };

  // ✅ Confirm delete notification
  const confirmDeleteNotification = async () => {
    if (!notificationToDelete) return;
    
    setIsLoading(true);
    try {
      await deleteNotification(notificationToDelete, user);
      toast.success('Notification deleted');
      closeDeleteModal();
    } catch (error) {
      toast.error('Failed to delete notification');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Handle mark single as read
  const handleMarkAsRead = async (notificationId, link) => {
    setIsLoading(true);
    try {
      await markAsRead(notificationId, user);
      if (link) {
        window.location.hash = link;
      }
      setShowPanel(false);
    } catch (error) {
      toast.error('Failed to mark as read');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // DELETE CONFIRMATION MODAL
  // ============================================================
    const DeleteConfirmationModal = () => {
    if (!deleteModalOpen) return null;

    return createPortal(
      <div 
        className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm"
        onClick={closeDeleteModal}
      >
        <div 
          className="bg-white rounded-2xl max-w-sm w-full p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6 sm:w-7 sm:h-7 text-red-500" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1 sm:mb-2">Delete Notification</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 px-2">
              Are you sure you want to delete this notification? This action cannot be undone.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={closeDeleteModal}
                className="w-full sm:flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 rounded-xl font-medium transition text-sm sm:text-base order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteNotification}
                disabled={isLoading}
                className="w-full sm:flex-1 py-2.5 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-xl font-medium transition text-sm sm:text-base order-1 sm:order-2 disabled:opacity-50"
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // ============================================================
  // CLEAR ALL CONFIRMATION MODAL
  // ============================================================
    const ClearAllConfirmationModal = () => {
    if (!clearAllModalOpen) return null;

    return createPortal(
      <div 
        className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm"
        onClick={closeClearAllModal}
      >
        <div 
          className="bg-white rounded-2xl max-w-sm w-full p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1 sm:mb-2">Clear All Notifications</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 px-2">
              Are you sure you want to clear all your notifications? This action cannot be undone.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={closeClearAllModal}
                className="w-full sm:flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 rounded-xl font-medium transition text-sm sm:text-base order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearAll}
                disabled={isLoading}
                className="w-full sm:flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl font-medium transition text-sm sm:text-base order-1 sm:order-2 disabled:opacity-50"
              >
                {isLoading ? 'Clearing...' : 'Clear All'}
              </button>
            </div>
          </div>
        </div>
      </div>,
       document.body
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={togglePanel}
        className="relative p-1 sm:p-2 hover:bg-gray-100 rounded-lg sm:rounded-xl transition text-gray-600 flex items-center justify-center h-7 sm:h-8"
        aria-label="Notifications"
        disabled={isLoading}
      >
        {getIcon()}
        {userUnreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[12px] h-[12px] sm:min-w-[18px] sm:h-[18px] bg-rose-500 text-white text-[6px] sm:text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 sm:px-1 leading-none">
            {userUnreadCount > 99 ? '99+' : userUnreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
       {showPanel && createPortal(
        <>
          {/* Mobile: Full-screen modal overlay */}
          <div className="fixed inset-0 z-[999] sm:hidden">
            <div 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
              onClick={() => setShowPanel(false)}
            ></div>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] max-w-[260px] bg-white rounded-lg shadow-2xl overflow-hidden max-h-[65vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-gray-100 bg-white">
                <div className="flex items-center gap-1">
                  <Bell className="w-3 h-3 text-gray-500" />
                  <span className="font-semibold text-[11px] text-gray-800">Notifications</span>
                  {userUnreadCount > 0 && (
                    <span className="text-[8px] bg-rose-100 text-rose-600 px-1 py-[1px] rounded-full font-medium">
                      {userUnreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <>
                      <button
                        onClick={handleMarkAllAsRead}
                        disabled={isLoading}
                        className="p-1 hover:bg-gray-100 rounded-md transition text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        title="Mark all as read"
                      >
                        <CheckCheck className="w-3 h-3" />
                      </button>
                      <button
                        onClick={openClearAllModal}
                        disabled={isLoading}
                        className="p-0.5 hover:bg-gray-100 rounded-md transition text-gray-400 hover:text-red-500 disabled:opacity-50"
                        title="Clear all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowPanel(false)}
                    className="p-0.5 hover:bg-gray-100 rounded-md transition text-gray-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div className="overflow-y-auto flex-1">
                {userNotifications.length === 0 ? (
                  <div className="text-center py-6 px-2.5">
                    <Bell className="w-7 h-7 text-gray-300 mx-auto mb-1.5" />
                    <p className="text-[11px] text-gray-400">No notifications yet</p>
                    <p className="text-[9px] text-gray-300">We'll notify you when something happens</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {userNotifications.slice(0, 10).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-1.5 hover:bg-gray-50 transition cursor-pointer ${!notification.read ? 'bg-blue-50/30 border-l-[3px] border-l-rose-500' : ''}`}
                        onClick={() => handleMarkAsRead(notification.id, notification.link)}
                      >
                        <div className="flex items-start gap-1">
                          <div className={`shrink-0 w-[18px] h-[18px] rounded-md flex items-center justify-center text-[10px] ${getTypeColor(notification.type)}`}>
                            {getTypeIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[9.5px] leading-tight ${!notification.read ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[7px] text-gray-400">
                                {formatTime(notification.createdAt)}
                              </span>
                              {!notification.read && (
                                <span className="w-1 h-1 bg-rose-500 rounded-full"></span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => openDeleteModal(notification.id, e)}
                            disabled={isLoading}
                            className="shrink-0 p-0.5 hover:bg-gray-200 rounded transition text-gray-400 hover:text-red-500 disabled:opacity-50"
                          >
                            <X className="w-2 h-2" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {userNotifications.length > 10 && (
                      <div className="p-1.5 text-center text-[9px] text-gray-400">
                        +{userNotifications.length - 10} more notifications
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-100 p-1.5 bg-gray-50">
                <button
                  onClick={navigateToNotifications}
                  className="w-full py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-md text-[10px] font-medium transition flex items-center justify-center gap-1"
                >
                  <Bell className="w-3 h-3" /> View All Notifications
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Desktop: Dropdown panel */}
          {/* Desktop: Centered modal */}
<div className="hidden sm:flex fixed inset-0 z-[999] items-center justify-center p-4 pointer-events-none">
  <div
    className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
    onClick={() => setShowPanel(false)}
  ></div>
  <div className="relative w-full max-w-[400px] max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 flex flex-col pointer-events-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-gray-500" />
                <span className="font-semibold text-sm text-gray-800">Notifications</span>
                {userUnreadCount > 0 && (
                  <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-medium">
                    {userUnreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {notifications.length > 0 && (
                  <>
                    <button
                      onClick={handleMarkAllAsRead}
                      disabled={isLoading}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                    <button
                      onClick={openClearAllModal}
                      disabled={isLoading}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-red-500 disabled:opacity-50"
                      title="Clear all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowPanel(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto max-h-[380px]">
              {userNotifications.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No notifications yet</p>
                  <p className="text-xs text-gray-300">We'll notify you when something happens</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {userNotifications.slice(0, 10).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 hover:bg-gray-50 transition cursor-pointer ${!notification.read ? 'bg-blue-50/30' : ''}`}
                      onClick={() => handleMarkAsRead(notification.id, notification.link)}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm ${getTypeColor(notification.type)}`}>
                          {getTypeIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs ${!notification.read ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] text-gray-400">
                              {formatTime(notification.createdAt)}
                            </span>
                            {!notification.read && (
                              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => openDeleteModal(notification.id, e)}
                          disabled={isLoading}
                          className="shrink-0 p-1 hover:bg-gray-200 rounded transition text-gray-400 hover:text-red-500 disabled:opacity-50"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {userNotifications.length > 10 && (
                    <div className="p-3 text-center text-xs text-gray-400">
                      +{userNotifications.length - 10} more
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {userNotifications.length > 0 && (
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-4 py-2 text-center">
                <button
                  onClick={navigateToNotifications}
                  className="text-[10px] text-blue-500 hover:text-blue-700 font-medium transition flex items-center justify-center gap-1"
                >
                  📋 View all notifications
                </button>
              </div>
            )}
          </div>
          </div>  
        </>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal />

      {/* Clear All Confirmation Modal */}
      <ClearAllConfirmationModal />
    </div>
  );
};