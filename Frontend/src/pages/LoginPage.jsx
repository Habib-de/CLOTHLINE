import React, { useState } from 'react';
import { CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = ({ onSwitchToRegister, onForgotPassword }) => {
  // Get auth functions from context
  const { login, loading: authLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [userExists, setUserExists] = useState(null); // null = unknown, true/false
  const [userStatus, setUserStatus] = useState(null); // Store user status

  // ============================================================
  // CHECK IF USER EXISTS (on email change)
  // ============================================================
  const checkUserExists = async (emailValue) => {
    if (!emailValue || !emailValue.includes('@')) {
      setUserExists(null);
      setUserStatus(null);
      return;
    }
    
    try {
      const { authService } = await import('../services/api');
      const exists = await authService.checkUserExists(emailValue);
      setUserExists(exists);
      
      // If user exists, get their status from the backend
      if (exists) {
        // You might want to add an endpoint to get user status by email
        // For now, we'll just show the pending message on login attempt
      }
    } catch (error) {
      setUserExists(null);
      setUserStatus(null);
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    clearTimeout(window.emailTimeout);
    window.emailTimeout = setTimeout(() => checkUserExists(value), 500);
  };

  const isClient = email === 'client@kiin.com' || email === 'client@kiin.co.ke';

  // ============================================================
  // HANDLE LOGIN SUBMIT
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    console.log('🔍 === LOGIN ATTEMPT ===');
    console.log('📧 Email:', email);
    console.log('🔑 Password entered:', password);

    try {
      // Special case: Client login (no password required)
      if (isClient) {
        const result = await login(email, '', 'CLIENT');
        if (result.success) {
          console.log('✅ Client login successful!');
          setIsLoading(false);
          return;
        } else {
          setError(result.error || 'Client login failed');
          setIsLoading(false);
          return;
        }
      }

      // Regular user login
      if (!password) {
        setError('Please enter your password');
        setIsLoading(false);
        return;
      }

      const result = await login(email, password);
      
      if (result.success) {
        console.log('✅ Login successful!');
      } else {
        // Check if the error message contains "pending" or "not active"
        if (result.error && result.error.toLowerCase().includes('pending')) {
          setError('⏳ Your account is pending approval. Please wait for activation.');
        } else if (result.error && result.error.toLowerCase().includes('inactive')) {
          setError('❌ Your account has been deactivated. Please contact support.');
        } else {
          setError(result.error || 'Login failed. Please check your credentials.');
        }
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setError(error.message || 'An error occurred during login');
    }

    setIsLoading(false);
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="h-screen w-screen bg-gradient-to-br from-rose-50 via-slate-100 to-rose-50 flex items-center justify-center p-3 overflow-hidden fixed inset-0">
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-2000"></div>
      </div>

      <div className="w-full max-w-sm bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 relative z-10 overflow-hidden">
        {/* Logo Section */}
        <div className="px-6 pt-6 pb-4 flex flex-col items-center">
          <img 
            src="/logo.png" 
            alt="KIIN CLOTHELIN" 
            className="h-20 w-auto object-contain"
          />
          <p className="text-[10px] text-gray-400 tracking-wider mt-1">Premium Tailoring Services</p>
        </div>

        {/* Form Section */}
        <div className="px-6 pb-5">
          <div className="text-center mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Welcome Back</h2>
            <p className="text-gray-500 text-xs mt-0.5">Sign in to manage your tailoring services</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Enter your email"
                className="w-full px-3.5 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-sm"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
              />
            </div>
            
            {/* Password - Hidden for Client */}
            {!isClient && userExists !== false && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-sm pr-10"
                    autoComplete="current-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    required={!isClient}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Client Info - No Password Required */}
            {isClient && (
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 p-2.5 rounded-lg text-center">
                <span className="text-xs font-medium text-emerald-700">
                  🎉 No password required for Client login
                </span>
              </div>
            )}

            {/* User Not Found */}
            {email && userExists === false && !isClient && (
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-center">
                <span className="text-xs font-medium text-amber-700">
                  ⚠️ No account found with this email. Please register first.
                </span>
              </div>
            )}

            {/* User Exists - Show they can login */}
            {email && userExists === true && !isClient && (
              <div className="bg-green-50 border border-green-200 p-1.5 rounded-lg text-center">
                <span className="text-[10px] text-green-700">
                  ✅ Account found! Enter your password to continue.
                </span>
              </div>
            )}

            {/* Remember Me & Forgot Password - Only show for non-client */}
            {!isClient && userExists === true && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3 h-3 rounded border-gray-300 text-rose-500 focus:ring-rose-500"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-xs text-rose-500 hover:text-rose-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}
            
            {error && (
              <div className={`p-2.5 rounded-lg text-xs flex items-center gap-1.5 ${
                error.includes('pending') || error.includes('wait') 
                  ? 'bg-amber-50 border border-amber-200 text-amber-700'
                  : error.includes('inactive') || error.includes('deactivated')
                  ? 'bg-red-50 border border-red-200 text-red-600'
                  : 'bg-red-50 border border-red-200 text-red-600'
              }`}>
                <span>{error.includes('pending') || error.includes('wait') ? '⏳' : '❌'}</span> 
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading || authLoading}
              className={`w-full py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm ${
                (isLoading || authLoading) ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {(isLoading || authLoading) ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Loading...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" /> 
                  {isClient ? 'Continue as Client' : 'Sign in'}
                </>
              )}
            </button>
            <div className="mt-2">
  <button
    type="button"
    onClick={() => {
      const guestClient = {
        id: 'guest-client-' + Date.now(),
        name: 'Guest Client',
        email: 'guest@kiin.com',
        role: 'CLIENT',
        status: 'ACTIVE'
      };
      localStorage.setItem('kiin_user', JSON.stringify(guestClient));
      localStorage.setItem('kiin_token', 'guest-token');
      window.location.reload();
    }}
    className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium rounded-lg transition text-sm flex items-center justify-center gap-2"
  >
    👤 Browse as Guest
  </button>
</div>
          </form>

          {/* Register Link */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-rose-500 hover:text-rose-600 font-medium hover:underline"
              >
                Register here
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-2 border-t border-gray-100">
          <p className="text-[8px] text-gray-400">
            © 2026 KIIN·CLOTHELIN. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};