// Profile.jsx - API-Oriented
import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, Building, Shield, Calendar, 
  ArrowLeft, Edit2, Save, X, CheckCircle, 
  Camera, MapPin, Briefcase, Clock, Users
} from 'lucide-react';
import { userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const Profile = ({ user, setActiveView }) => {
  const { updateUser, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
  setLoading(true);
  setSuccess('');
  
  try {
    // ✅ Send ALL required fields with existing values
    const result = await updateUser({
      name: formData.name,
      email: formData.email, // ✅ Send email (even though it's disabled)
      phone: formData.phone || '',
      address: formData.address || '',
      bio: formData.bio || '',
      role: user?.role || 'CLIENT', // ✅ Send role
      // Don't send password - backend will skip it
    });
    
    if (result.success) {
      toast.success('Profile updated successfully! ✅');
      setSuccess('Profile updated successfully! ✅');
      setIsEditing(false);
      await refreshUser();
    } else {
      toast.error(result.error || 'Failed to update profile');
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    const errorMsg = error.response?.data?.message || error.message || 'Failed to update profile';
    toast.error(errorMsg);
    setSuccess('');
  }
  
  setLoading(false);
};

  const getRoleIcon = () => {
    switch(user?.role) {
      case 'ADMIN': return <Shield className="w-5 h-5 text-purple-600" />;
      case 'OWNER': return <Building className="w-5 h-5 text-blue-600" />;
      case 'SALES': return <Briefcase className="w-5 h-5 text-green-600" />;
      case 'TAILOR': return <Users className="w-5 h-5 text-orange-600" />;
      default: return <User className="w-5 h-5 text-gray-600" />;
    }
  };

  const getRoleColor = () => {
    switch(user?.role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-700';
      case 'OWNER': return 'bg-blue-100 text-blue-700';
      case 'SALES': return 'bg-green-100 text-green-700';
      case 'TAILOR': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 max-w-4xl mx-auto px-2 sm:px-0">
      {/* Header - WITHOUT buttons */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={() => setActiveView('dashboard')}
          className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-xl transition flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <h2 className="text-sm sm:text-xl font-bold text-gray-800 flex items-center gap-1.5 sm:gap-2 truncate">
          <User className="w-4 h-4 sm:w-6 sm:h-6 text-rose-500 flex-shrink-0" />
          My Profile
        </h2>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 p-2 sm:p-3 rounded-lg text-[11px] sm:text-sm text-green-700 flex items-center gap-1.5 sm:gap-2">
          <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" /> {success}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Cover/Header */}
        <div className="bg-gradient-to-r from-rose-500 to-rose-600 p-3 sm:p-6">
          <div className="flex items-center gap-2.5 sm:gap-4">
            <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white flex-shrink-0">
              <span className="text-lg sm:text-3xl font-bold text-white">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-xl font-bold text-white truncate">{formData.name || user?.name}</h3>
              <div className="flex items-center gap-1 sm:gap-2 mt-1 flex-wrap">
                <span className={`text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap ${getRoleColor()}`}>
                  {user?.role}
                </span>
                {user?.role === 'OWNER' && user?.tenantName && (
                  <span className="text-[9px] sm:text-xs bg-white/20 text-white px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
                    {user?.tenantName}
                  </span>
                )}
                <span className="text-[9px] sm:text-xs bg-white/20 text-white px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
                  <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs text-gray-400">Email</p>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                    disabled
                  />
                ) : (
                  <p className="text-xs sm:text-sm text-gray-800 truncate">{formData.email}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2 sm:gap-3">
              <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs text-gray-400">Phone</p>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    className="w-full px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                ) : (
                  <p className="text-xs sm:text-sm text-gray-800 truncate">{formData.phone || 'Not set'}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2 sm:gap-3">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs text-gray-400">Address</p>
                {isEditing ? (
                  <input
                    type="text"
                    name="address"
                    value={formData.address || ''}
                    onChange={handleChange}
                    placeholder="Enter address"
                    className="w-full px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                ) : (
                  <p className="text-xs sm:text-sm text-gray-800 truncate">{formData.address || 'Not set'}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2 sm:gap-3">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs text-gray-400">Joined</p>
                <p className="text-xs sm:text-sm text-gray-800">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="flex items-start gap-2 sm:gap-3">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-400">Bio</p>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio || ''}
                  onChange={handleChange}
                  placeholder="Tell us about yourself..."
                  rows="3"
                  className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 outline-none resize-none"
                />
              ) : (
                <p className="text-xs sm:text-sm text-gray-800">{formData.bio || 'No bio yet'}</p>
              )}
            </div>
          </div>

          {/* Tenant Info (Owner only) */}
          {user?.role === 'OWNER' && user?.tenantId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <Building className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-blue-600">Store/Tenant Information</p>
                  <p className="text-xs sm:text-sm font-medium text-blue-800 truncate">{user?.tenantName}</p>
                  <p className="text-[10px] sm:text-xs text-blue-600 truncate">Tenant ID: {user?.tenantId}</p>
                </div>
              </div>
            </div>
          )}

          {/* ✅ BUTTONS AT BOTTOM OF CARD */}
          <div className="pt-2 border-t border-gray-100">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" /> Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};