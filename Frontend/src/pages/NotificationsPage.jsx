// src/pages/NotificationsPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Bell, CheckCircle, AlertCircle, AlertTriangle, Info, X, 
  ChevronLeft, ChevronRight, RefreshCw, Trash2, CheckCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const PAGE_SIZE = 10;

export const NotificationsPage = ({ setActiveView }) => {
  const { user } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAll,
    getUserNotifications
  } = useNotifications();

  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [selectedType, setSelectedType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const userNotifications = getUserNotifications(user);
  const userRole = user?.role || 'client';

  // ============================================
  // ROLE-BASED TYPE OPTIONS
  // ============================================
  const getTypeOptions = () => {
    const baseOptions = [
      { value: 'all', label: 'All Types' },
    ];

    // Admin & Owner: See everything
    if (userRole === 'admin' || userRole === 'owner') {
      return [
        ...baseOptions,
        { value: 'payment', label: '💰 Payment' },
        { value: 'order', label: '📦 Order' },
        { value: 'security', label: '🔐 Security' },
        { value: 'warning', label: '⚠️ Warning' },
        { value: 'success', label: '✅ Success' },
      ];
    }

    // Sales: See payments, orders, warnings
    if (userRole === 'sales') {
      return [
        ...baseOptions,
        { value: 'payment', label: '💰 Payment' },
        { value: 'order', label: '📦 Order' },
        { value: 'warning', label: '⚠️ Warning' },
        { value: 'success', label: '✅ Success' },
      ];
    }

    // Tailor: See orders and warnings (their assigned orders)
    if (userRole === 'tailor') {
      return [
        ...baseOptions,
        { value: 'order', label: '📦 Order' },
        { value: 'warning', label: '⚠️ Warning' },
        { value: 'success', label: '✅ Success' },
      ];
    }

    // Client: See payments and warnings
    if (userRole === 'client') {
      return [
        ...baseOptions,
        { value: 'payment', label: '💰 Payment' },
        { value: 'warning', label: '⚠️ Warning' },
      ];
    }

    // Default fallback
    return baseOptions;
  };

  const typeOptions = getTypeOptions();

  // ============================================
  // FILTER NOTIFICATIONS
  // ============================================
  const filteredNotifications = userNotifications.filter(n => {
    if (filter === 'unread' && n.read) return false;
    if (filter === 'read' && !n.read) return false;
    if (selectedType !== 'all' && n.type !== selectedType) return false;
    return true;
  });

  // ============================================
  // PAGINATION
  // ============================================
  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / PAGE_SIZE));

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, selectedType]);

  // Clamp current page if the list shrinks (e.g. after deleting/clearing)
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const goToPage = (page) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  // ============================================
  // HELPERS
  // ============================================
  const getTypeColor = (type) => {
    switch(type) {
      case 'payment': return 'bg-green-100 text-green-700';
      case 'order': return 'bg-blue-100 text-blue-700';
      case 'security': return 'bg-red-100 text-red-700';
      case 'warning': return 'bg-amber-100 text-amber-700';
      case 'success': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'payment': return '💰';
      case 'order': return '📦';
      case 'security': return '🔐';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      default: return '📌';
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'payment': return 'Payment';
      case 'order': return 'Order';
      case 'security': return 'Security';
      case 'warning': return 'Warning';
      case 'success': return 'Success';
      default: return 'Info';
    }
  };

  // ============================================
  // STATS
  // ============================================
  const totalNotifications = userNotifications.length;
  const unreadNotifications = userNotifications.filter(n => !n.read).length;

  // ============================================
  // FILTER OPTIONS
  // ============================================
  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: 'read', label: 'Read' }
  ];

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-2 sm:space-y-3 max-w-4xl mx-auto px-2 sm:px-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 pt-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <button
            onClick={() => setActiveView('dashboard')}
            className="p-1 sm:p-1.5 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-xl font-bold text-gray-800 flex items-center gap-1 sm:gap-1.5">
              <Bell className="w-4 h-4 sm:w-6 sm:h-6 text-rose-500 flex-shrink-0" />
              <span className="truncate">Notifications</span>
            </h2>
            <p className="text-[9px] sm:text-sm text-gray-500 -mt-0.5 flex items-center gap-1.5 flex-wrap">
              {unreadNotifications > 0 ? `${unreadNotifications} unread` : 'All caught up!'}
              <span className="text-[7px] sm:text-[10px] bg-gray-100 px-1.5 py-0.5 rounded-full">
                {userRole}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {unreadNotifications > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 px-1.5 py-1 sm:px-3 sm:py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] sm:text-sm hover:bg-blue-100 transition whitespace-nowrap"
            >
              <CheckCheck className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Mark all read</span>
            </button>
          )}
          {totalNotifications > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 px-1.5 py-1 sm:px-3 sm:py-1.5 bg-red-50 text-red-600 rounded-lg text-[9px] sm:text-sm hover:bg-red-100 transition whitespace-nowrap"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Clear all</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-3">
        <div className="bg-white p-2 sm:p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-[8px] sm:text-[10px] text-gray-400 uppercase">Total</p>
          <p className="text-sm sm:text-xl font-bold">{totalNotifications}</p>
        </div>
        <div className="bg-white p-2 sm:p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-[8px] sm:text-[10px] text-gray-400 uppercase">Unread</p>
          <p className="text-sm sm:text-xl font-bold text-blue-600">{unreadNotifications}</p>
        </div>
        <div className="bg-white p-2 sm:p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-[8px] sm:text-[10px] text-gray-400 uppercase">Read</p>
          <p className="text-sm sm:text-xl font-bold text-green-600">{totalNotifications - unreadNotifications}</p>
        </div>
        <div className="bg-white p-2 sm:p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-[8px] sm:text-[10px] text-gray-400 uppercase">Types</p>
          <p className="text-sm sm:text-xl font-bold text-purple-600">
            {new Set(userNotifications.map(n => n.type)).size}
          </p>
        </div>
      </div>

      {/* Filters - Role-based */}
      <div className="bg-white rounded-xl border border-gray-100 p-1.5 sm:p-4 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-1 sm:gap-2 min-w-max">
          {/* Read Status Filter */}
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-lg text-[8px] sm:text-xs font-medium transition whitespace-nowrap ${
                  filter === option.value 
                    ? 'bg-white shadow-sm text-gray-800' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Type Filter - Role-based */}
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
            {typeOptions.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-lg text-[8px] sm:text-xs font-medium transition whitespace-nowrap ${
                  selectedType === type.value 
                    ? 'bg-white shadow-sm text-gray-800' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Bell className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
            <p className="text-xs sm:text-base text-gray-500 font-medium">No notifications found</p>
            <p className="text-[9px] sm:text-sm text-gray-400">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {paginatedNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-2 sm:p-4 hover:bg-gray-50 transition cursor-pointer ${
                  !notification.read ? 'bg-blue-50/30 border-l-2 sm:border-l-4 border-l-rose-500' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-1.5 sm:gap-3">
                  <div className={`flex-shrink-0 w-7 h-7 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-xs sm:text-base ${getTypeColor(notification.type)}`}>
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1 sm:gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`text-[11px] sm:text-sm leading-snug ${!notification.read ? 'font-semibold text-gray-800' : 'text-gray-600'} break-words`}>
                          {notification.message}
                        </p>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                          <span className="text-[8px] sm:text-[10px] text-gray-400 whitespace-nowrap">
                            {formatTime(notification.createdAt)}
                          </span>
                          <span className="text-[7px] sm:text-[10px] bg-gray-100 text-gray-500 px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
                            {getTypeLabel(notification.type)}
                          </span>
                          {!notification.read && (
                            <span className="text-[7px] sm:text-[10px] bg-rose-100 text-rose-600 px-1.5 sm:px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                              New
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="flex-shrink-0 p-0.5 sm:p-1 hover:bg-gray-200 rounded transition text-gray-400 hover:text-red-500"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {filteredNotifications.length > PAGE_SIZE && (
          <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-3 py-2 sm:px-4 sm:py-3">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-sm font-medium text-gray-600 hover:bg-gray-100 transition disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Prev</span>
            </button>

            <span className="text-[10px] sm:text-sm text-gray-500 whitespace-nowrap">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-sm font-medium text-gray-600 hover:bg-gray-100 transition disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
            >
              <span className="hidden xs:inline">Next</span>
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      {totalNotifications > 0 && (
        <div className="text-center text-[8px] sm:text-xs text-gray-400">
          {totalNotifications} notification{totalNotifications !== 1 ? 's' : ''} total
        </div>
      )}
    </div>
  );
};