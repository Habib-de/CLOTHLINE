// Settings.jsx - FULLY API-ORIENTED
import React, { useState } from 'react';
import { 
  Settings, ArrowLeft, Lock, 
  Shield, Palette, Save, CheckCircle, 
  Eye, EyeOff, AlertCircle, User, Mail, BadgeCheck, LogOut
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import toast from 'react-hot-toast';

export const SettingsPage = ({ user, setActiveView }) => {
  // Use settings context
  const {
    darkMode,
    setDarkMode,
    notifications: pushNotifications,
    setNotifications: setPushNotifications,
    emailNotifications,
    setEmailNotifications,
    language,
    setLanguage,
    savePreferences,
    isLoading
  } = useSettings();

  // Use auth context for logout and refresh
  const { logout, refreshUser } = useAuth();

  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('preferences');
  const [saveMessage, setSaveMessage] = useState('');
  const [saveMessageType, setSaveMessageType] = useState('');

  // ============================================================
  // ✅ CHANGE PASSWORD - API ORIENTED
  // ============================================================
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setLoading(true);

    // Validate
    if (newPassword.length < 6) {
      setPasswordError('❌ New password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('❌ Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // ✅ API call using userService
      // ✅ CORRECT - passing two strings
const result = await userService.changePassword(currentPassword, newPassword);

      if (result.success) {
        toast.success('✅ Password updated successfully!');
        setPasswordSuccess('✅ Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(''), 3000);
        await refreshUser();
      } else {
        setPasswordError('❌ ' + (result.error || 'Failed to update password'));
      }
    } catch (error) {
      console.error('Password change error:', error);
      setPasswordError('❌ ' + (error.message || 'Failed to update password'));
    }

    setLoading(false);
  };

  // ============================================================
  // ✅ SAVE PREFERENCES
  // ============================================================
  const handleSavePreferences = () => {
    const success = savePreferences();
    if (success) {
      setSaveMessage('✅ Preferences saved successfully!');
      setSaveMessageType('success');
      setTimeout(() => {
        setSaveMessage('');
        setSaveMessageType('');
      }, 3000);
    }
  };

  // ============================================================
  // ✅ TABS
  // ============================================================
  const tabs = [
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'account', label: 'Account', icon: User },
  ];

  // ============================================================
  // ✅ LOADING STATE
  // ============================================================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // ============================================================
  // ✅ RENDER
  // ============================================================
  return (
    <div className="space-y-3 sm:space-y-4 max-w-4xl mx-auto px-3 sm:px-0 pb-20 sm:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10 py-2 sm:py-0 -mx-3 px-3 sm:mx-0 sm:px-0 sm:relative sm:bg-transparent sm:backdrop-blur-none">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setActiveView('dashboard')}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg sm:rounded-xl transition"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <h2 className="text-base sm:text-xl font-bold text-gray-800 flex items-center gap-1.5 sm:gap-2">
            <Settings className="w-4 h-4 sm:w-6 sm:h-6 text-rose-500" />
            <span>Settings</span>
          </h2>
        </div>
        <span className="text-[10px] sm:hidden text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full capitalize">
          {activeTab}
        </span>
      </div>

      {/* Mobile: Tab Navigation */}
      <div className="flex gap-0.5 bg-gray-100/80 rounded-lg p-0.5 sm:hidden sticky top-11 z-10 -mx-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-1 px-1.5 rounded-md text-[9px] font-semibold transition flex items-center justify-center gap-0.5 ${
                activeTab === tab.id
                  ? 'bg-white shadow-sm text-rose-600'
                  : 'text-gray-500'
              }`}
            >
              <Icon className="w-2.5 h-2.5" />
              <span className="leading-none">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Desktop: Grid layout */}
      <div className="hidden sm:grid sm:grid-cols-1 md:grid-cols-2 gap-4">
        {/* Preferences - Desktop */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-rose-500" />
            Preferences
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Dark Mode</p>
                <p className="text-xs text-gray-400">{darkMode ? '🌙 Dark' : '☀️ Light'}</p>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`w-12 h-6 rounded-full transition ${darkMode ? 'bg-gray-800' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow transform transition ${darkMode ? 'translate-x-6' : ''}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Push Notifications</p>
                <p className="text-xs text-gray-400">{pushNotifications ? '🔔 On' : '🔕 Off'}</p>
              </div>
              <button
                onClick={() => setPushNotifications(!pushNotifications)}
                className={`w-12 h-6 rounded-full transition ${pushNotifications ? 'bg-rose-500' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow transform transition ${pushNotifications ? 'translate-x-6' : ''}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Email Notifications</p>
                <p className="text-xs text-gray-400">{emailNotifications ? '📧 On' : '📧 Off'}</p>
              </div>
              <button
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`w-12 h-6 rounded-full transition ${emailNotifications ? 'bg-rose-500' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow transform transition ${emailNotifications ? 'translate-x-6' : ''}`} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none"
              >
                <option value="en">🌍 English</option>
                <option value="sw">🌍 Swahili</option>
                <option value="fr">🌍 French</option>
                <option value="es">🌍 Spanish</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">Current: {language.toUpperCase()}</p>
            </div>

            {saveMessage && (
              <div className={`p-2 rounded-lg text-xs flex items-center gap-1.5 ${
                saveMessageType === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-600' 
                  : 'bg-red-50 border border-red-200 text-red-600'
              }`}>
                <CheckCircle className="w-4 h-4" /> {saveMessage}
              </div>
            )}

            <button
              onClick={handleSavePreferences}
              className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm transition flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Preferences
            </button>
          </div>
        </div>

        {/* Security - Desktop */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-rose-500" />
            Security
          </h3>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {passwordError && (
              <div className="bg-red-50 border border-red-200 p-2 rounded-lg text-xs text-red-600 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="bg-green-50 border border-green-200 p-2 rounded-lg text-xs text-green-600 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> {passwordSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-lg text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Lock className="w-4 h-4" />
              )}
              Change Password
            </button>
          </form>
        </div>
      </div>

      {/* Mobile: Tab Content */}
      <div className="sm:hidden space-y-3">
        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <h3 className="font-semibold text-sm text-gray-800 flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-rose-500" />
              Preferences
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700">Dark Mode</p>
                  <p className="text-[9px] text-gray-400 truncate">{darkMode ? '🌙 Dark' : '☀️ Light'}</p>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-10 h-5 rounded-full transition flex-shrink-0 ${darkMode ? 'bg-gray-800' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow transform transition ${darkMode ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700">Push Notifications</p>
                  <p className="text-[9px] text-gray-400 truncate">{pushNotifications ? '🔔 On' : '🔕 Off'}</p>
                </div>
                <button
                  onClick={() => setPushNotifications(!pushNotifications)}
                  className={`w-10 h-5 rounded-full transition flex-shrink-0 ${pushNotifications ? 'bg-rose-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow transform transition ${pushNotifications ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700">Email Notifications</p>
                  <p className="text-[9px] text-gray-400 truncate">{emailNotifications ? '📧 On' : '📧 Off'}</p>
                </div>
                <button
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`w-10 h-5 rounded-full transition flex-shrink-0 ${emailNotifications ? 'bg-rose-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow transform transition ${emailNotifications ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 outline-none"
                >
                  <option value="en">🌍 English</option>
                  <option value="sw">🌍 Swahili</option>
                  <option value="fr">🌍 French</option>
                  <option value="es">🌍 Spanish</option>
                </select>
                <p className="text-[8px] text-gray-400 mt-0.5">Current: {language.toUpperCase()}</p>
              </div>

              {saveMessage && (
                <div className={`p-1.5 rounded-lg text-[10px] flex items-center gap-1 ${
                  saveMessageType === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-600' 
                    : 'bg-red-50 border border-red-200 text-red-600'
                }`}>
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /> {saveMessage}
                </div>
              )}

              <button
                onClick={handleSavePreferences}
                className="w-full py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs transition flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" /> Save Preferences
              </button>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <h3 className="font-semibold text-sm text-gray-800 flex items-center gap-2 mb-3">
              <Lock className="w-4 h-4 text-rose-500" />
              Security
            </h3>

            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 outline-none pr-8"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 outline-none pr-8"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[8px] text-gray-400 mt-0.5">Minimum 6 characters</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 outline-none pr-8"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {passwordError && (
                <div className="bg-red-50 border border-red-200 p-1.5 rounded-lg text-[10px] text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="bg-green-50 border border-green-200 p-1.5 rounded-lg text-[10px] text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /> {passwordSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-1.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-lg text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Lock className="w-3.5 h-3.5" />
                )}
                Change Password
              </button>
            </form>
          </div>
        )}

        {/* Account Tab - with Logout */}
        {activeTab === 'account' && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <h3 className="font-semibold text-sm text-gray-800 flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-rose-500" />
              Account Information
            </h3>
            
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-rose-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400">Name</p>
                  <p className="text-xs font-medium truncate">{user?.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400">Email</p>
                  <p className="text-xs font-medium truncate">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <BadgeCheck className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400">Role</p>
                  <p className="text-xs font-medium capitalize">{user?.role}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400">Status</p>
                  <p className="text-xs font-medium text-green-600">Active</p>
                </div>
              </div>

              {user?.role === 'OWNER' && user?.tenantName && (
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Settings className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400">Store/Tenant</p>
                    <p className="text-xs font-medium truncate">{user?.tenantName}</p>
                  </div>
                </div>
              )}

              {user?.role === 'OWNER' && user?.tenantId && (
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400">Tenant ID</p>
                    <p className="text-[9px] font-mono truncate bg-gray-50 px-1.5 py-0.5 rounded">{user?.tenantId}</p>
                  </div>
                </div>
              )}

              {/* Logout Button */}
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to logout?')) {
                    logout();
                  }
                }}
                className="w-full mt-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 border border-red-200"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Account Info - Desktop with Logout */}
      <div className="hidden sm:block bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-rose-500" />
            Account Information
          </h3>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to logout?')) {
                logout();
              }
            }}
            className="text-sm text-red-500 hover:text-red-700 font-medium transition flex items-center gap-1"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4">
          <div>
            <p className="text-xs text-gray-400">Name</p>
            <p className="font-medium">{user?.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Role</p>
            <p className="font-medium capitalize">{user?.role}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Status</p>
            <p className="font-medium text-green-600">Active</p>
          </div>
          {user?.role === 'OWNER' && user?.tenantName && (
            <div>
              <p className="text-xs text-gray-400">Store/Tenant</p>
              <p className="font-medium">{user?.tenantName}</p>
            </div>
          )}
          {user?.role === 'OWNER' && user?.tenantId && (
            <div>
              <p className="text-xs text-gray-400">Tenant ID</p>
              <p className="font-medium font-mono text-xs">{user?.tenantId}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};