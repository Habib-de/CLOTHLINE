// ForgotPasswordPage.jsx - API-Oriented
import React, { useState } from 'react';
import { CheckCircle, Mail, ArrowLeft } from 'lucide-react';
import { authService } from '../services/api'; // ✅ Import the API service

export const ForgotPasswordPage = ({ onBackToLogin }) => { // ✅ Remove onSendResetLink prop
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email.trim()) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }

    // ✅ Call the actual API
    const result = await authService.forgotPassword(email);
    
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || 'Failed to send reset link. Please try again.');
    }
    setIsLoading(false);
  };

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
          <p className="text-[10px] text-gray-400 tracking-wider mt-1">Reset your password</p>
        </div>

        {/* Form Section */}
        <div className="px-6 pb-5">
          <div className="text-center mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Forgot Password</h2>
            <p className="text-gray-500 text-xs mt-0.5">
              Enter your email to receive a reset link
            </p>
          </div>

          {success ? (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-700">Reset link sent!</p>
                <p className="text-xs text-green-600 mt-1">
                  Check your email for instructions to reset your password.
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
              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-sm"
                    required
                  />
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
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" /> 
                    Send Reset Link
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