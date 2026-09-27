import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService, userService } from '../services/api';

const AuthContext = createContext(null);

// Normalize email helper (keep for compatibility)
const normalizeEmail = (value) => (value || '').trim().toLowerCase();

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

    // ============================================================
  // CHECK IF USER IS ALREADY LOGGED IN (on mount)
  // ============================================================
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      
      // Check if we have a token
      const token = localStorage.getItem('kiin_token');
      const savedUser = localStorage.getItem('kiin_user');
      
      if (token && savedUser) {
        // ✅ GUEST USER - Skip API call
        if (token === 'guest-token') {
          try {
            const user = JSON.parse(savedUser);
            setUser(user);
            setLoading(false);
            return;
          } catch (e) {
            localStorage.removeItem('kiin_token');
            localStorage.removeItem('kiin_user');
            setUser(null);
            setLoading(false);
            return;
          }
        }
        
        // ✅ REAL USER - Verify with backend
        try {
          // Verify user is still valid with backend
          const result = await authService.getCurrentUser();
          
          if (result.success && result.user) {
            setUser(result.user);
            // Update stored user in case details changed
            localStorage.setItem('kiin_user', JSON.stringify(result.user));
          } else {
            // Token invalid or expired
            localStorage.removeItem('kiin_token');
            localStorage.removeItem('kiin_user');
            setUser(null);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('kiin_token');
          localStorage.removeItem('kiin_user');
          setUser(null);
        }
      } else {
        // No token found
        setUser(null);
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  // ============================================================
  // LOGIN - Uses backend API
  // ============================================================
  const login = async (email, password, role) => {
    console.log('🔐 AuthContext.login called with:', { email, password, role });
    
    try {
      const result = await authService.login(email, password);
      
      if (result.success && result.user) {
        console.log('✅ AuthContext: Login successful!', result.user);
        setUser(result.user);
        return { success: true, user: result.user };
      } else {
        console.log('❌ AuthContext: Login failed:', result.error);
        return { success: false, error: result.error || 'Login failed' };
      }
    } catch (error) {
      console.error('❌ AuthContext: Login error:', error);
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  // ============================================================
  // REGISTER - Uses backend API
  // ============================================================

const register = async (formData) => {
  console.log('📝 AuthContext.register called with:', formData);
  
  try {
    // Map frontend form data to backend RegisterRequest
    const registerData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone || '',
      address: formData.address || '',
      bio: formData.bio || '',
      role: formData.role || 'CLIENT',
      tenantName: formData.tenantName || null,
      adminKey: formData.adminKey || null,
    };
    
    const result = await authService.register(registerData);
    
    if (result.success && result.user) {
      console.log('✅ AuthContext: Registration successful!', result.user);
      
      // ✅ FIX: DO NOT auto-login
      // Remove token and user from localStorage so user goes to login page
      localStorage.removeItem('kiin_token');
      localStorage.removeItem('kiin_user');
      
      // ✅ Do NOT set user state (remove this line)
      // setUser(result.user);  // ❌ REMOVED - prevents auto-login
      
      return { success: true, user: result.user };
    } else {
      console.log('❌ AuthContext: Registration failed:', result.error);
      return { success: false, error: result.error || 'Registration failed' };
    }
  } catch (error) {
    console.error('❌ AuthContext: Registration error:', error);
    return { success: false, error: error.message || 'Registration failed' };
  }
};

  // ============================================================
  // FORGOT PASSWORD - Uses backend API
  // ============================================================
  const forgotPassword = async (email) => {
    console.log('🔑 AuthContext.forgotPassword called with:', email);
    
    try {
      // Check if user exists
      const exists = await authService.checkUserExists(email);
      
      if (!exists) {
        return { success: false, error: 'No account found with this email address' };
      }
      
      // In a real app, this would trigger a password reset email
      // For now, we'll simulate it
      console.log('✅ Password reset requested for:', email);
      
      // TODO: Call password reset endpoint when available
      // await api.post('/auth/forgot-password', { email });
      
      return { 
        success: true, 
        message: 'Password reset link sent to your email. Check your inbox.' 
      };
    } catch (error) {
      console.error('❌ Forgot password error:', error);
      return { success: false, error: error.message || 'Failed to process request' };
    }
  };

  // ============================================================
  // LOGOUT - Uses backend API
  // ============================================================
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    setUser(null);
    localStorage.removeItem('kiin_token');
    localStorage.removeItem('kiin_user');
    
    // Optionally reload to reset state
    // window.location.reload();
  };

  // ============================================================
// UPDATE USER (for profile updates) - Uses /me endpoint
// ============================================================
const updateUser = async (userData) => {
  if (!user) return { success: false, error: 'No user logged in' };
  
  try {
    // ✅ Use /me endpoint for self-update (no role required)
    const result = await userService.updateCurrentUser(userData);
    
    if (result.success && result.user) {
      // Update the stored user
      setUser(result.user);
      localStorage.setItem('kiin_user', JSON.stringify(result.user));
      return { success: true, user: result.user };
    } else {
      return { success: false, error: result.error || 'Update failed' };
    }
  } catch (error) {
    console.error('Update user error:', error);
    return { success: false, error: error.message || 'Update failed' };
  }
};

  // ============================================================
  // REFRESH USER (re-fetch current user from backend)
  // ============================================================
  const refreshUser = async () => {
    try {
      const result = await authService.getCurrentUser();
      if (result.success && result.user) {
        setUser(result.user);
        localStorage.setItem('kiin_user', JSON.stringify(result.user));
        return { success: true, user: result.user };
      }
      return { success: false, error: 'Failed to refresh user' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register,
      forgotPassword,
      logout,
      updateUser,
      refreshUser,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};