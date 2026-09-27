// src/services/api.js
import axios from 'axios';

// ============================================================
// DYNAMIC API BASE URL - WORKS ON PHONE & COMPUTER
// ============================================================
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  
  // If accessing from network (phone, other devices), use the hostname
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:8080/api`;
  }
  
  // Local development
  return 'http://localhost:8080/api';
};

// ✅ Use environment variable if set, otherwise auto-detect
const API_BASE_URL = import.meta.env.VITE_API_URL || getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});


// ============================================================
// INTERCEPTORS
// ============================================================

// Request interceptor - Add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kiin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and unwrap ApiResponse
api.interceptors.response.use(
  (response) => {
    const apiResponse = response.data;
    if (!apiResponse.success) {
      return Promise.reject({
        message: apiResponse.message || 'Operation failed',
        status: response.status,
        data: apiResponse.data,
        response: response
      });
    }
    return apiResponse.data;
  },
  (error) => {
    if (error.response) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') ||
                              error.config?.url?.includes('/auth/register');

      // Only treat 401 as "session expired" for requests OTHER than login/register
      if (error.response.status === 401 && !isAuthEndpoint) {
        localStorage.removeItem('kiin_token');
        localStorage.removeItem('kiin_user');
        window.location.href = '/login';
      }

      const apiResponse = error.response.data;
      const message = apiResponse?.message || error.message || 'An error occurred';
      return Promise.reject({ 
        message, 
        status: error.response.status,
        data: apiResponse?.data,
         response: error.response 
      });
    }
    return Promise.reject({ message: error.message || 'Network error' });
  }
);

// ============================================================
// AUTH SERVICE
// ============================================================

export const authService = {
  // Login user
  login: async (email, password) => {
    try {
      const user = await api.post('/auth/login', { email, password });
      const { token, ...userData } = user;
      localStorage.setItem('kiin_token', token);
      localStorage.setItem('kiin_user', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: error.message || 'Login failed' };
    }
  },

  // Register user
  register: async (userData) => {
    try {
      const user = await api.post('/auth/register', userData);
      const { token, ...userDataWithoutToken } = user;
      localStorage.setItem('kiin_token', token);
      localStorage.setItem('kiin_user', JSON.stringify(userDataWithoutToken));
      return { success: true, user: userDataWithoutToken };
    } catch (error) {
      return { success: false, error: error.message || 'Registration failed' };
    }
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore logout errors
    }
    localStorage.removeItem('kiin_token');
    localStorage.removeItem('kiin_user');
    return { success: true };
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const user = await api.get('/users/me');
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ✅ UPDATED: Check if user exists (public endpoint)
  checkUserExists: async (email) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/public/users/exists`, {
        params: { email },
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.data && response.data.success) {
        return response.data.data || false;
      }
      return false;
    } catch (error) {
      console.error('Error checking if user exists:', error);
      return false;
    }
  },

   forgotPassword: async (email) => {
    try {
      await api.post('/auth/forgot-password', { email });
      return { 
        success: true, 
        message: 'Password reset link sent to your email. Please check your inbox.' 
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to send reset link. Please try again.' 
      };
    }
  },

  // ✅ Reset Password
  resetPassword: async (token, newPassword) => {
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      return { 
        success: true, 
        message: 'Password reset successful! You can now login with your new password.' 
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to reset password. Please try again.' 
      };
    }
  },

  // ✅ Verify Reset Token
  verifyResetToken: async (token) => {
    try {
      const result = await api.get(`/auth/verify-reset-token/${token}`);
      return { 
        success: true, 
        valid: result === true,
        message: result === true ? 'Token is valid' : 'Token is invalid or expired'
      };
    } catch (error) {
      console.error('Verify token error:', error);
      return { 
        success: false, 
        valid: false,
        error: error.message || 'Invalid or expired token' 
      };
    }
  },
};
// ============================================================
// USER SERVICE
// ============================================================

export const userService = {
  // Get all users (Admin/Owner only)
  getAllUsers: async () => {
    try {
      return await api.get('/users');
    } catch (error) {
      return [];
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    try {
      return await api.get(`/users/${userId}`);
    } catch (error) {
      return null;
    }
  },

  // Get users by role
  getUsersByRole: async (role) => {
    try {
      return await api.get(`/users/role/${role}`);
    } catch (error) {
      return [];
    }
  },

  // Get users by status
  getUsersByStatus: async (status) => {
    try {
      return await api.get(`/users/status/${status}`);
    } catch (error) {
      return [];
    }
  },

  // Get users by tenant
  getUsersByTenant: async (tenantId) => {
    try {
      return await api.get(`/users/tenant/${tenantId}`);
    } catch (error) {
      return [];
    }
  },

  // Update user
  updateUser: async (userId, userData) => {
    try {
      const user = await api.put(`/users/${userId}`, userData);
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

    // ✅ Add this new method for self-profile update
  updateCurrentUser: async (userData) => {
    try {
      const user = await api.put('/users/me', userData);
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  changePassword: async (currentPassword, newPassword) => {
  try {
    await api.put('/users/me/password', { 
      currentPassword, 
      newPassword 
    });
    return { success: true };
  } catch (error) {
    // ✅ Extract the error message from the backend response
    let errorMessage = 'Failed to update password';
    
    // Try to get the error message from the response
    if (error.response && error.response.data) {
      const data = error.response.data;
      // Check different possible message locations
      if (data.message) {
        errorMessage = data.message;
      } else if (data.error) {
        errorMessage = data.error;
      } else if (data.errors && data.errors.length > 0) {
        errorMessage = data.errors[0].message || errorMessage;
      } else if (typeof data === 'string') {
        errorMessage = data;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return { success: false, error: errorMessage };
  }
},

  // Activate user
  activateUser: async (userId) => {
    try {
      await api.patch(`/users/${userId}/activate`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Deactivate user
  deactivateUser: async (userId) => {
    try {
      await api.patch(`/users/${userId}/deactivate`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      await api.delete(`/users/${userId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

// ============================================================
// ORDER SERVICE
// ============================================================

export const orderService = {
  // Create order
  createOrder: async (orderData) => {
    try {
      const order = await api.post('/orders', orderData);
      return { success: true, order };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Update order
  updateOrder: async (orderId, orderData) => {
    try {
      const order = await api.put(`/orders/${orderId}`, orderData);
      return { success: true, order };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get all orders
  getAllOrders: async () => {
    try {
      return await api.get('/orders');
    } catch (error) {
      return [];
    }
  },

  // Get order by ID
  getOrderById: async (orderId) => {
    try {
      return await api.get(`/orders/${orderId}`);
    } catch (error) {
      return null;
    }
  },

  // Get order by receipt number
  getOrderByRecNo: async (recNo) => {
    try {
      return await api.get(`/orders/recno/${recNo}`);
    } catch (error) {
      return null;
    }
  },

  // Get orders by status
  getOrdersByStatus: async (status) => {
    try {
      return await api.get(`/orders/status/${status}`);
    } catch (error) {
      return [];
    }
  },

  // Get orders by tailor
  getOrdersByTailor: async (tailorEmail) => {
    try {
      return await api.get(`/orders/tailor/${encodeURIComponent(tailorEmail)}`);
    } catch (error) {
      return [];
    }
  },

  // Update order status
  updateOrderStatus: async (orderId, status) => {
    try {
      const order = await api.patch(`/orders/${orderId}/status?status=${status}`);
      return { success: true, order };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Delete order
  deleteOrder: async (orderId) => {
    try {
      await api.delete(`/orders/${orderId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get order count
  getOrderCount: async () => {
    try {
      return await api.get('/orders/stats/count');
    } catch (error) {
      return 0;
    }
  },

  // Get revenue
  getRevenue: async (startDate, endDate) => {
    try {
      return await api.get(`/orders/stats/revenue?startDate=${startDate}&endDate=${endDate}`);
    } catch (error) {
      return 0;
    }
  },
};

// ============================================================
// PAYMENT SERVICE
// ============================================================

export const paymentService = {
  // Record payment
  recordPayment: async (paymentData) => {
    try {
      const payment = await api.post('/payments', paymentData);
      return { success: true, payment };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get payment by ID
  getPaymentById: async (paymentId) => {
    try {
      return await api.get(`/payments/${paymentId}`);
    } catch (error) {
      return null;
    }
  },

  // Get payments by order
  getPaymentsByOrder: async (orderId) => {
    try {
      return await api.get(`/payments/order/${orderId}`);
    } catch (error) {
      return [];
    }
  },

  // Get payments by rental
  getPaymentsByRental: async (rentalId) => {
    try {
      return await api.get(`/payments/rental/${rentalId}`);
    } catch (error) {
      return [];
    }
  },

  // Delete payment
  deletePayment: async (paymentId) => {
    try {
      await api.delete(`/payments/${paymentId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get total payments
  getTotalPayments: async (startDate, endDate) => {
    try {
      return await api.get(`/payments/stats/total?startDate=${startDate}&endDate=${endDate}`);
    } catch (error) {
      return 0;
    }
  },
};

// ============================================================
// SUIT SERVICE
// ============================================================

export const suitService = {
  // Create suit
  createSuit: async (suitData) => {
    try {
      const suit = await api.post('/suits', suitData);
      return { success: true, suit };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Update suit
  updateSuit: async (suitId, suitData) => {
    try {
      const suit = await api.put(`/suits/${suitId}`, suitData);
      return { success: true, suit };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get all suits
  getAllSuits: async () => {
    try {
      return await api.get('/suits');
    } catch (error) {
      return [];
    }
  },

  // Get suit by ID
  getSuitById: async (suitId) => {
    try {
      return await api.get(`/suits/${suitId}`);
    } catch (error) {
      return null;
    }
  },

  // Get suits by category
  getSuitsByCategory: async (category) => {
    try {
      return await api.get(`/suits/category/${category}`);
    } catch (error) {
      return [];
    }
  },

  // Search suits
  searchSuits: async (keyword) => {
    try {
      return await api.get(`/suits/search?keyword=${encodeURIComponent(keyword)}`);
    } catch (error) {
      return [];
    }
  },

  // Delete suit
  deleteSuit: async (suitId) => {
    try {
      await api.delete(`/suits/${suitId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get suit count
  getSuitCount: async () => {
    try {
      return await api.get('/suits/stats/count');
    } catch (error) {
      return 0;
    }
  },
};

// ============================================================
// RENTAL SERVICE - FIXED ✅
// ============================================================

export const rentalService = {
  // Create rental
  createRental: async (rentalData) => {
    try {
      const rental = await api.post('/rentals', rentalData);
      return { success: true, rental };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Update rental
  updateRental: async (rentalId, rentalData) => {
    try {
      const rental = await api.put(`/rentals/${rentalId}`, rentalData);
      return { success: true, rental };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ✅ FIXED: Accept query parameters
  getAllRentals: async (queryParams = '') => {
    try {
      const url = `/rentals${queryParams}`;
      return await api.get(url);
    } catch (error) {
      console.error('Error fetching rentals:', error);
      return [];
    }
  },

  // Get rental by ID
  getRentalById: async (rentalId) => {
    try {
      return await api.get(`/rentals/${rentalId}`);
    } catch (error) {
      return null;
    }
  },

  // Get rental by reference
  getRentalByReference: async (reference) => {
    try {
      return await api.get(`/rentals/reference/${reference}`);
    } catch (error) {
      return null;
    }
  },

  // Get rentals by status
  getRentalsByStatus: async (status) => {
    try {
      return await api.get(`/rentals/status/${status}`);
    } catch (error) {
      return [];
    }
  },

  // Get active rentals
  getActiveRentals: async () => {
    try {
      return await api.get('/rentals/active');
    } catch (error) {
      return [];
    }
  },

  // Get overdue rentals
  getOverdueRentals: async () => {
    try {
      return await api.get('/rentals/overdue');
    } catch (error) {
      return [];
    }
  },

  // Update rental status
  updateRentalStatus: async (rentalId, status) => {
    try {
      const rental = await api.patch(`/rentals/${rentalId}/status?status=${status}`);
      return { success: true, rental };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Delete rental
  deleteRental: async (rentalId) => {
    try {
      await api.delete(`/rentals/${rentalId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get rental count
  getRentalCount: async () => {
    try {
      return await api.get('/rentals/stats/count');
    } catch (error) {
      return 0;
    }
  },
};

// ============================================================
// NOTIFICATION SERVICE
// ============================================================

export const notificationService = {
  // Get all notifications
  getNotifications: async () => {
    try {
      return await api.get('/notifications');
    } catch (error) {
      return [];
    }
  },

  // Get unread notifications
  getUnreadNotifications: async () => {
    try {
      return await api.get('/notifications/unread');
    } catch (error) {
      return [];
    }
  },

  // Get unread count
  getUnreadCount: async () => {
    try {
      return await api.get('/notifications/count/unread');
    } catch (error) {
      return 0;
    }
  },

  // Mark as read
  markAsRead: async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Mark all as read
  markAllAsRead: async () => {
    try {
      await api.patch('/notifications/read-all');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Clear all notifications
  clearAllNotifications: async () => {
    try {
      await api.delete('/notifications/clear-all');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Send notification to all (Admin/Owner only)
  sendNotificationToAll: async (message, type, link) => {
    try {
      const notification = await api.post(
        `/notifications/send?message=${encodeURIComponent(message)}&type=${type}${link ? `&link=${encodeURIComponent(link)}` : ''}`
      );
      return { success: true, notification };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

// ============================================================
// PUBLIC SERVICE (No authentication required)
// ============================================================

export const publicService = {
  // Get public tenants (for registration - no auth required)
  getPublicTenants: async () => {
    try {
      // Use axios directly to avoid interceptor issues
      const response = await axios.get(`${API_BASE_URL}/public/tenants`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Check if response is successful
      if (response.data && response.data.success) {
        return response.data.data || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to load public tenants:', error);
      return [];
    }
  },
};

export default api;