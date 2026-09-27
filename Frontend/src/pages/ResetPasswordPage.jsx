// ResetPasswordPage.jsx - API-Oriented
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/api';

export const ResetPasswordPage = ({ onBackToLogin }) => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ✅ Verify token on page load
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('No reset token provided. Please request a new password reset link.');
        setIsVerifying(false);
        return;
      }

      try {
        const result = await authService.verifyResetToken(token);
        if (result.success && result.valid) {
          setIsValidToken(true);
        } else {
          setError('Invalid or expired reset token. Please request a new password reset link.');
        }
      } catch (err) {
        setError('Failed to verify reset token. Please try again.');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    const result = await authService.resetPassword(token, newPassword);
    
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        if (onBackToLogin) onBackToLogin();
      }, 3000);
    } else {
      setError(result.error || 'Failed to reset password. Please try again.');
    }
    setIsLoading(false);
  };

  // Show loading state while verifying token
  if (isVerifying) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-rose-50 via-slate-100 to-rose-50 flex items-center justify-center p-3 overflow-hidden fixed inset-0">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-8 max-w-sm w-full text-center">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Show error if token is invalid
  if (!isValidToken && !success) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-rose-50 via-slate-100 to-rose-50 flex items-center justify-center p-3 overflow-hidden fixed inset-0">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-6 max-w-sm w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔗</span>
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Invalid Reset Link</h2>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <button
              onClick={onBackToLogin}
              className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            className="h-16 w-auto object-contain"
          />
          <p className="text-[10px] text-gray-400 tracking-wider mt-1">Create new password</p>
        </div>

        {/* Form Section */}
        <div className="px-6 pb-5">
          <div className="text-center mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Reset Password</h2>
            <p className="text-gray-500 text-xs mt-0.5">
              Enter your new password below
            </p>
          </div>

          {success ? (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-700">Password Reset Successful!</p>
                <p className="text-xs text-green-600 mt-1">
                  Your password has been reset. You will be redirected to login shortly.
                </p>
              </div>
              <button
                type="button"
                onClick={onBackToLogin}
                className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* New Password */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-sm"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[8px] text-gray-400 mt-0.5">Minimum 6 characters</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 p-2.5 rounded-lg text-xs text-red-600 flex items-center gap-1.5">
                  <span>❌</span> {error}
                </div>
              )}
              
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Resetting...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> 
                    Reset Password
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onBackToLogin}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Login
              </button>
            </form>
          )}
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