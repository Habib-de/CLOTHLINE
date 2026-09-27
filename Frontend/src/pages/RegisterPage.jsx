// RegisterPage.jsx - Backend Integrated with Public Tenant API
import React, { useState, useRef, useEffect } from 'react';
import { 
  CheckCircle, Eye, EyeOff, User, Mail, Lock, ArrowLeft, 
  ChevronRight, ChevronLeft, Shield, Building, Key, Clock,
  Scissors, Users, Store, Crown, Search, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService, publicService } from '../services/api';  // ✅ CHANGED: use publicService

export const RegisterPage = ({ onSwitchToLogin }) => {
  // Get auth functions from context
  const { register } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'SALES',
    adminKey: '',
    tenantName: '',
    tenantId: '',
    selectedTenantId: '',
    phone: '',
    address: '',
    bio: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [tenantSearch, setTenantSearch] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState(false);

  // Synchronous lock — prevents double-submit race conditions.
  const isSubmittingRef = useRef(false);

  // Secret key for admin registration
  const ADMIN_SECRET_KEY = 'kiin_admin_2026';

  // ============================================================
  // LOAD TENANTS FROM PUBLIC ENDPOINT (No auth required)
  // ============================================================
  const loadTenants = async () => {
    try {
      // ✅ CHANGED: Use publicService instead of userService
      const ownerTenants = await publicService.getPublicTenants();
      
      const formattedTenants = ownerTenants.map(t => ({
        id: t.id,
        name: t.name,
         ownerName: t.ownerName || 'Unknown Owner',
         ownerEmail: t.ownerEmail || 'No email'
      }));
      
      setTenants(formattedTenants);
      console.log('✅ Tenants loaded:', formattedTenants.length);
    } catch (error) {
      console.error('Failed to load tenants:', error);
      setTenants([]);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  // ============================================================
  // CHECK EMAIL EXISTS
  // ============================================================
  const checkEmailExists = async (email) => {
    if (!email || !email.includes('@')) {
      setEmailExists(false);
      return;
    }
    
    setIsCheckingEmail(true);
    try {
      const exists = await authService.checkUserExists(email);
      setEmailExists(exists);
    } catch (error) {
      setEmailExists(false);
    }
    setIsCheckingEmail(false);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, email: value });
    // Debounce email check
    clearTimeout(window.emailTimeout);
    window.emailTimeout = setTimeout(() => checkEmailExists(value), 500);
  };

  // ============================================================
  // ROLES
  // ============================================================
  const roles = [
    { value: 'SALES', label: 'Sales', icon: Users, description: 'Manage sales, orders, and customer interactions' },
    { value: 'TAILOR', label: 'Tailor', icon: Scissors, description: 'Handle measurements, fittings, and garment production' },
    { value: 'OWNER', label: 'Owner', icon: Store, description: 'Business owner with complete access to your store' },
    { value: 'ADMIN', label: 'Admin', icon: Crown, description: 'System administrator with full control' },
  ];

  // Steps configuration
  const steps = [
    { id: 1, label: 'Personal Info', icon: User },
    { id: 2, label: 'Security', icon: Lock },
    { id: 3, label: 'Account', icon: Shield },
  ];

  // ============================================================
  // HANDLE FORM CHANGES
  // ============================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (error) setError('');
    if (success) setSuccess('');
    
    // When sales/tailor selects a tenant
    if (name === 'selectedTenantId' && value) {
      const selectedTenant = tenants.find(t => t.id === value);
      if (selectedTenant) {
        setFormData(prev => ({ 
          ...prev, 
          selectedTenantId: value,
          tenantId: value,
          tenantName: selectedTenant.name
        }));
      }
    }
  };

  // Filter tenants based on search
  const filteredTenants = tenants.filter(t => 
    t.name?.toLowerCase().includes(tenantSearch.toLowerCase()) ||
    t.ownerName?.toLowerCase().includes(tenantSearch.toLowerCase())
  );

  // ============================================================
  // VALIDATE STEP
  // ============================================================
  const validateStep = () => {
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        setError('Full name is required');
        return false;
      }
      if (!formData.email.trim()) {
        setError('Email is required');
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        return false;
      }
      if (emailExists) {
        setError('This email is already registered. Please use a different email or login.');
        return false;
      }
      return true;
    }
    
    if (currentStep === 2) {
      if (!formData.password) {
        setError('Password is required');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
      if (!formData.confirmPassword) {
        setError('Please confirm your password');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match ❌');
        return false;
      }
      return true;
    }
    
    if (currentStep === 3) {
      if (!formData.role) {
        setError('Please select a role');
        return false;
      }
      
      if (formData.role === 'ADMIN') {
        if (!formData.adminKey) {
          setError('Admin registration key is required');
          return false;
        }
        if (formData.adminKey !== ADMIN_SECRET_KEY) {
          setError('❌ Invalid admin registration key');
          return false;
        }
      }
      
      if (formData.role === 'OWNER') {
        if (!formData.tenantName.trim()) {
          setError('Store/Tenant name is required for Owner registration');
          return false;
        }
        return true;
      }
      
      if (formData.role === 'SALES' || formData.role === 'TAILOR') {
        if (!formData.selectedTenantId) {
          setError('Please select a company/store to join');
          return false;
        }
        return true;
      }
      
      return true;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (validateStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setError('');
  };

  const isNextDisabled = () => {
    if (currentStep === 2) {
      return (
        !formData.password ||
        formData.password.length < 6 ||
        !formData.confirmPassword ||
        formData.password !== formData.confirmPassword
      );
    }
    return false;
  };

  // ============================================================
  // HANDLE SUBMIT - USE BACKEND API
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Validation
      if (!formData.name.trim()) {
        setError('Name is required');
        return;
      }
      if (!formData.email.trim()) {
        setError('Email is required');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match ❌');
        return;
      }

      if (formData.role === 'ADMIN') {
        if (!formData.adminKey) {
          setError('Admin registration key is required');
          return;
        }
        if (formData.adminKey !== ADMIN_SECRET_KEY) {
          setError('❌ Invalid admin registration key');
          return;
        }
      }

      if (formData.role === 'OWNER') {
        if (!formData.tenantName.trim()) {
          setError('Store/Tenant name is required for Owner registration');
          return;
        }
      }

      if (formData.role === 'SALES' || formData.role === 'TAILOR') {
        if (!formData.selectedTenantId) {
          setError('Please select a company/store to join');
          return;
        }
      }

      // Build registration data for backend
      const registerData = {
    name: formData.name,
    email: formData.email,
    password: formData.password,
    phone: formData.phone || '',
    address: formData.address || '',
    bio: formData.bio || '',
    role: formData.role.toUpperCase(), // ✅ Force uppercase
    tenantName: formData.role === 'OWNER' ? formData.tenantName : 
                (formData.role === 'SALES' || formData.role === 'TAILOR') ? formData.tenantName : null,
    adminKey: formData.role === 'ADMIN' ? formData.adminKey : null,
};

      console.log('📝 Registering user with backend:', registerData);

      // Call backend register API via AuthContext
      const result = await register(registerData);

      if (result.success) {
        console.log('✅ Registration successful!');
        
        let successMessage = '';
        if (formData.role === 'ADMIN') {
          successMessage = '✅ Admin account created successfully! You can now login.';
        } else if (formData.role === 'OWNER') {
          successMessage = `✅ Store "${formData.tenantName}" registered successfully! Please wait for Admin activation before you can login.`;
        } else if (formData.role === 'SALES' || formData.role === 'TAILOR') {
          const selectedTenant = tenants.find(t => t.id === formData.selectedTenantId);
          successMessage = `✅ ${formData.role.toLowerCase()} account created successfully! You have requested to join "${selectedTenant?.name || 'the store'}". Please wait for the Store Owner to activate your account.`;
        } else {
          successMessage = '✅ Account created successfully! Please wait for activation before you can login.';
        }

        setSuccess(successMessage);

        // Navigate to login after 4 seconds
        setTimeout(() => {
          if (onSwitchToLogin) {
            onSwitchToLogin();
          }
        }, 4000);
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
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
        <div className="px-6 pt-4 pb-2 flex flex-col items-center border-b border-gray-100">
          <img 
            src="/logo.png" 
            alt="KIIN CLOTHELIN" 
            className="h-12 w-auto object-contain"
          />
          <p className="text-[10px] text-gray-400 tracking-wider mt-0.5">Create your account</p>
        </div>

        {/* Step Progress */}
        <div className="px-6 pt-3 pb-2">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div 
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      currentStep === step.id 
                        ? 'bg-rose-500 text-white ring-4 ring-rose-100' 
                        : currentStep > step.id 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > step.id ? <CheckCircle size={14} /> : step.id}
                  </div>
                  <span className={`text-[7px] mt-0.5 font-medium ${
                    currentStep === step.id ? 'text-rose-500' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Section */}
        <div className="px-6 pb-4 max-h-[480px] overflow-y-auto">
          <div className="text-center mb-3">
            <h2 className="text-sm font-semibold text-gray-800">
              Step {currentStep} of 3: {steps[currentStep - 1].label}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* STEP 1 - Personal Info */}
            {currentStep === 1 && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="w-full pl-10 pr-3.5 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleEmailChange}
                      placeholder="Enter your email"
                      className={`w-full pl-10 pr-3.5 py-2 bg-gray-50 border-2 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-sm ${
                        emailExists ? 'border-red-400' : 'border-gray-200'
                      }`}
                      required
                    />
                  </div>
                  {isCheckingEmail && (
                    <p className="text-[10px] text-gray-400 mt-0.5">Checking email...</p>
                  )}
                  {emailExists && (
                    <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-1">
                      <AlertCircle size={12} /> This email is already registered
                    </p>
                  )}
                  {formData.email && !emailExists && !isCheckingEmail && (
                    <p className="text-[10px] text-green-500 mt-0.5 flex items-center gap-1">
                      <CheckCircle size={12} /> Email is available
                    </p>
                  )}
                </div>

                {/* Phone (optional) */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Phone (Optional)
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    className="w-full px-3.5 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 p-2 rounded-lg text-xs text-red-600 flex items-center gap-1.5">
                    <span>❌</span> {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={emailExists}
                  className={`w-full py-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm ${
                    emailExists ? 'opacity-50 cursor-not-allowed' : 'hover:from-rose-600 hover:to-rose-700'
                  }`}
                >
                  Next Step <ChevronRight size={16} />
                </button>
              </>
            )}

            {/* STEP 2 - Security */}
            {currentStep === 2 && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min 6 characters"
                      className={`w-full pl-10 pr-10 py-2 bg-gray-50 border-2 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-sm ${
                        formData.password && formData.password.length < 6
                          ? 'border-red-400'
                          : formData.password && formData.password.length >= 6
                          ? 'border-green-400'
                          : 'border-gray-200'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {formData.password && (
                    <div className={`text-[10px] mt-0.5 flex items-center gap-1 ${
                      formData.password.length < 6 ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {formData.password.length < 6 ? (
                        <>❌ {formData.password.length}/6 characters (minimum 6)</>
                      ) : (
                        <>✅ {formData.password.length} characters (good!)</>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      className={`w-full pl-10 pr-10 py-2 bg-gray-50 border-2 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-sm ${
                        formData.confirmPassword && formData.password !== formData.confirmPassword
                          ? 'border-red-400'
                          : formData.confirmPassword && formData.password === formData.confirmPassword
                          ? 'border-green-400'
                          : 'border-gray-200'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {formData.confirmPassword && formData.password && formData.password !== formData.confirmPassword && (
                  <div className="bg-red-50 border border-red-200 p-1.5 rounded-lg text-xs text-red-600 flex items-center gap-1.5">
                    <span>❌</span> Passwords do not match
                  </div>
                )}

                {formData.confirmPassword && formData.password && formData.password === formData.confirmPassword && formData.password.length >= 6 && (
                  <div className="bg-green-50 border border-green-200 p-1.5 rounded-lg text-xs text-green-600 flex items-center gap-1.5">
                    <CheckCircle size={12} /> Passwords match ✓
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 p-2 rounded-lg text-xs text-red-600 flex items-center gap-1.5">
                    <span>❌</span> {error}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isNextDisabled()}
                    className={`flex-1 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm ${
                      isNextDisabled()
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-md shadow-rose-500/20'
                    }`}
                  >
                    Next Step <ChevronRight size={16} />
                  </button>
                </div>
              </>
            )}

            {/* STEP 3 - Account */}
            {currentStep === 3 && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Account Type *
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3.5 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-sm"
                    >
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Role Description */}
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                  <p className="text-[9px] text-gray-600">
                    {roles.find(r => r.value === formData.role)?.description}
                  </p>
                </div>

                {/* Owner Registration - Tenant Name */}
                {formData.role === 'OWNER' && (
                  <div className="space-y-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-[10px] font-medium text-blue-700 flex items-center gap-1">
                      <Store size={12} /> Store Registration
                    </p>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-1.5">
                      <p className="text-[8px] text-yellow-700 flex items-center gap-1">
                        <Clock size={12} /> ⏳ Registration requires Admin approval before you can login.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                        Store/Tenant Name *
                      </label>
                      <div className="relative">
                        <Building size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          name="tenantName"
                          value={formData.tenantName}
                          onChange={handleChange}
                          className="w-full pl-9 pr-3 py-2 bg-white border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                          placeholder="e.g., KIIN Boutique"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Sales/Tailor Registration - Select Tenant */}
                {(formData.role === 'SALES' || formData.role === 'TAILOR') && (
                  <div className="space-y-2 bg-purple-50 p-3 rounded-lg border border-purple-200">
                    <p className="text-[10px] font-medium text-purple-700 flex items-center gap-1">
                      <Building size={12} /> Select Company/Store
                    </p>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-1.5">
                      <p className="text-[8px] text-yellow-700 flex items-center gap-1">
                        <Clock size={12} /> ⏳ Registration requires Store Owner approval before you can login.
                      </p>
                    </div>

                    {tenants.length === 0 ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-center">
                        <p className="text-[8px] text-amber-700">
                          ⚠️ No active stores available. Please register as an OWNER first, or contact a store owner to join.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                          <input
                            type="text"
                            value={tenantSearch}
                            onChange={(e) => setTenantSearch(e.target.value)}
                            placeholder="Search stores..."
                            className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 outline-none"
                          />
                        </div>

                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {filteredTenants.map((tenant) => (
                            <button
                              key={tenant.id}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  selectedTenantId: tenant.id,
                                  tenantId: tenant.id,
                                  tenantName: tenant.name
                                }));
                                setTenantSearch('');
                              }}
                              className={`w-full text-left p-2 rounded-lg border transition ${
                                formData.selectedTenantId === tenant.id
                                  ? 'border-purple-500 bg-purple-50'
                                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                              }`}
                            >
                              <p className="text-xs font-medium text-gray-800">{tenant.name}</p>
                              <p className="text-[9px] text-gray-500">Owner: {tenant.ownerName}</p>
                            </button>
                          ))}
                        </div>

                        {formData.selectedTenantId && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-1.5">
                            <p className="text-[8px] text-green-700 flex items-center gap-1">
                              <CheckCircle size={10} /> Selected: <strong>{formData.tenantName}</strong>
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Admin Registration */}
                {formData.role === 'ADMIN' && (
                  <div className="space-y-2 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <p className="text-[10px] font-medium text-yellow-700 flex items-center gap-1">
                      <Crown size={12} /> Admin Registration
                    </p>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-1.5">
                      <p className="text-[8px] text-green-700 flex items-center gap-1">
                        <CheckCircle size={12} /> ✅ Admin accounts are activated immediately upon registration.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                        Admin Registration Key *
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={showAdminKey ? "text" : "password"}
                          name="adminKey"
                          value={formData.adminKey}
                          onChange={handleChange}
                          placeholder="Enter admin registration key"
                          className="w-full pl-10 pr-10 py-2 bg-white border-2 border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all text-sm"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminKey(!showAdminKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showAdminKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <p className="text-[8px] text-gray-400 mt-0.5">
                        ⚠️ Contact system administrator for the key
                      </p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 p-2 rounded-lg text-xs text-red-600 flex items-center gap-1.5">
                    <span>❌</span> {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-200 p-2 rounded-lg text-xs text-green-600 flex items-center gap-1.5">
                    <CheckCircle size={14} /> {success}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-rose-500/20 text-sm"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Login Link */}
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-rose-500 hover:text-rose-600 font-medium hover:underline"
              >
                Sign in here
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