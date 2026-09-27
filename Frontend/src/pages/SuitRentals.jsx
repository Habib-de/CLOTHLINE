// src/pages/SuitRentals.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Search, Filter, RefreshCw, 
  Eye, CheckCircle, XCircle, Clock, 
  AlertCircle, User, Shirt, DollarSign,
  MapPin, Phone, Mail, Edit2, Trash2, Plus,
  X, Save, Percent, Tag, CreditCard,
  Wallet, Building, Upload, Camera,
  Calendar as CalendarIcon, Clock as ClockIcon,
  Receipt, ChevronLeft, ChevronRight, FileText,
  Users, ShoppingBag, PenTool, Signature
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { PaymentModal } from '../components/PaymentModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { rentalService, suitService, notificationService } from '../services/api';

// ============================================================
// ✅ HELPER FUNCTIONS
// ============================================================

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return dateString;
  }
};

const generateReference = () => {
  return 'SR-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
};

const formatCurrency = (amount) => {
  return `KES ${(amount || 0).toLocaleString()}`;
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const calculateDays = (start, end) => {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = endDate.getTime() - startDate.getTime();
  return Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);
};

// ============================================================
// ✅ IMAGE COMPRESSION HELPER
// ============================================================

const compressImage = (file, maxWidth = 600, maxHeight = 600, quality = 0.6) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG with quality setting
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

// ============================================================
// ✅ MAIN COMPONENT
// ============================================================

export const SuitRentals = ({ setActiveView, activeView }) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  
  // ===== STATE =====
  const [rentals, setRentals] = useState([]);
  const [suits, setSuits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRental, setSelectedRental] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingRentalAction, setPendingRentalAction] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState(null);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  const [editingRental, setEditingRental] = useState(null);
  const [fullScreenImage, setFullScreenImage] = useState(null); 
  
  // ===== PAGINATION STATE =====
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10
  });

  // ===== EDIT FORM STATE =====
  const [editFormData, setEditFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerIdNumber: '',
     customerIdImage: null,
    suitName: '',
    suitCategory: '',
    suitColor: '',
    rentalStartDate: '',
    rentalEndDate: '',
    rentalFee: 0,
    deposit: 0,
    totalAmount: 0,
    days: 0,
    remainingBalance: 0,
    paymentMethod: 'CASH',
    paymentStatus: 'PENDING',
    mpesaCode: '',
    notes: '',
    status: 'PENDING'
  });

  // ===== CREATE FORM STATE =====
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerIdNumber: '',
    customerIdImage: null,
    suitName: '',
    suitCategory: '',
    suitColor: '',
    suitId: '',
    rentalStartDate: '',
    rentalEndDate: '',
    rentalFee: 0,
    deposit: 0,
    totalAmount: 0,
    days: 0,
    remainingBalance: 0,
    paymentMethod: 'CASH',
    paymentStatus: 'PENDING',
    mpesaCode: '',
    notes: '',
    rentedBy: user?.name || '',
    status: 'PENDING'
  });

  // ===== SIGNATURE STATE =====
  const [signatureData, setSignatureData] = useState(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // ============================================================
// ✅ API CALL FUNCTIONS - FIXED
// ============================================================

// Load rentals with pagination
const loadRentals = async (page = 0) => {
  setLoading(true);
  try {
    // Build query params - ALWAYS include page and size
    let queryParams = `?page=${page}&size=${pagination.itemsPerPage}`;
    if (filterStatus !== 'all') {
      queryParams += `&status=${filterStatus}`;
    }
    if (searchQuery) {
      queryParams += `&search=${encodeURIComponent(searchQuery)}`;
    }

    const response = await rentalService.getAllRentals(queryParams);
    
    console.log('📊 loadRentals response:', response);
    
    // ✅ Handle Spring Boot Page response
    if (response && response.content) {
      // Paginated response (Spring Page)
      setRentals(response.content);
      setPagination({
        currentPage: response.number || 0,
        totalPages: response.totalPages || 1,
        totalItems: response.totalElements || 0,
        itemsPerPage: response.size || 10
      });
      console.log(`✅ Loaded ${response.content.length} rentals, total: ${response.totalElements}`);
    } else if (Array.isArray(response)) {
      // Plain array response (fallback)
      setRentals(response);
      setPagination({
        currentPage: 0,
        totalPages: 1,
        totalItems: response.length,
        itemsPerPage: 10
      });
    } else {
      setRentals([]);
      setPagination({
        currentPage: 0,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 10
      });
    }
  } catch (error) {
    console.error('Error loading rentals:', error);
    showNotification(error.message || 'Failed to load rentals', 'error');
    setRentals([]);
  }
  setLoading(false);
};

  // Load suits
  const loadSuits = async () => {
    try {
      const response = await suitService.getAllSuits();
      setSuits(response || []);
    } catch (error) {
      console.error('Error loading suits:', error);
      setSuits([]);
    }
  };

  // Load all data
  const loadData = () => {
    loadRentals(0);
    loadSuits();
  };

  // Create rental
  const handleCreateRental = async () => {
    // Validation
    if (!formData.customerName) {
      showNotification('Please enter customer name', 'error');
      return;
    }
    if (!formData.suitName) {
      showNotification('Please enter the suit name', 'error');
      return;
    }
    if (!formData.rentalStartDate || !formData.rentalEndDate) {
      showNotification('Please select rental dates', 'error');
      return;
    }
    if (new Date(formData.rentalEndDate) < new Date(formData.rentalStartDate)) {
      showNotification('End date must be on or after start date', 'error');
      return;
    }
    if (!signatureData) {
      showNotification('Please sign the terms and conditions', 'error');
      return;
    }

    setShowTermsModal(true);
    setPendingRentalAction('create');
  };

  const performCreateRental = async () => {
    setIsSubmitting(true);
    try {
      const days = calculateDays(formData.rentalStartDate, formData.rentalEndDate);
      const total = (formData.rentalFee || 0) * days;
      const balance = total - (formData.deposit || 0);
      
      const rentalData = {
        customerName: formData.customerName,
        customerPhone: formData.customerPhone || '',
        customerEmail: formData.customerEmail || '',
        customerIdNumber: formData.customerIdNumber || '',
        customerIdImage: formData.customerIdImage || null,
        customerIdImage: formData.customerIdImage || null,
        suitName: formData.suitName || 'Unknown Suit',
        suitCategory: formData.suitCategory || 'FORMAL',
        suitColor: formData.suitColor || '',
        suitPricePerDay: formData.rentalFee || 8500,
        rentalStartDate: formData.rentalStartDate,
        rentalEndDate: formData.rentalEndDate,
        days: days,
        rentalFee: formData.rentalFee || 0,
        deposit: formData.deposit || 0,
        totalAmount: total,
        remainingBalance: balance,
        paymentMethod: formData.paymentMethod || 'CASH',
        paymentStatus: balance <= 0 ? 'PAID' : 'PENDING',
        mpesaCode: formData.mpesaCode || '',
        notes: formData.notes || '',
        status: 'PENDING',
        signature: signatureData,
        termsAccepted: true
      };

      const result = await rentalService.createRental(rentalData);
      
      if (result.success) {
        // Send notification via API
        await notificationService.sendNotificationToAll(
          `👔 New suit rental: ${result.rental.reference} - ${result.rental.customerName} rented ${result.rental.suitName}`,
          'ORDER',
          '/suit-rentals'
        );
        
        showNotification(`✅ Suit rental created! Ref: ${result.rental.reference}`);
        setShowCreateModal(false);
        resetForm();
        loadRentals(0);
      } else {
        showNotification(result.error || 'Failed to create rental', 'error');
      }
    } catch (error) {
      console.error('Error creating rental:', error);
      showNotification(error.message || 'Failed to create rental', 'error');
    }
    setIsSubmitting(false);
  };

  // Update rental
  const handleSaveEdit = async () => {
    if (!editingRental) return;

    if (!editFormData.customerName) {
      showNotification('Please enter customer name', 'error');
      return;
    }
    if (!editFormData.suitName) {
      showNotification('Please enter the suit name', 'error');
      return;
    }
    if (!editFormData.rentalStartDate || !editFormData.rentalEndDate) {
      showNotification('Please select rental dates', 'error');
      return;
    }
    if (new Date(editFormData.rentalEndDate) < new Date(editFormData.rentalStartDate)) {
      showNotification('End date must be on or after start date', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const days = calculateDays(editFormData.rentalStartDate, editFormData.rentalEndDate);
      const total = (editFormData.rentalFee || 0) * days;
      const balance = total - (editFormData.deposit || 0);
      
      const updateData = {
        customerName: editFormData.customerName,
        customerPhone: editFormData.customerPhone,
        customerEmail: editFormData.customerEmail,
        customerIdNumber: editFormData.customerIdNumber,
        customerIdImage: editFormData.customerIdImage || null,
        suitName: editFormData.suitName,
        suitCategory: editFormData.suitCategory,
        suitColor: editFormData.suitColor,
        rentalStartDate: editFormData.rentalStartDate,
        rentalEndDate: editFormData.rentalEndDate,
        days: days,
        rentalFee: editFormData.rentalFee,
        suitPricePerDay: editFormData.rentalFee,
        deposit: editFormData.deposit,
        totalAmount: total,
        remainingBalance: balance,
        paymentMethod: editFormData.paymentMethod,
        paymentStatus: balance <= 0 ? 'PAID' : 'PENDING',
        mpesaCode: editFormData.mpesaCode,
        notes: editFormData.notes,
        status: editFormData.status
      };

      const result = await rentalService.updateRental(editingRental.id, updateData);
      
      if (result.success) {
        await notificationService.sendNotificationToAll(
          `✏️ Suit rental ${editingRental.reference} updated - ${editFormData.customerName}`,
          'ORDER',
          '/suit-rentals'
        );
        
        showNotification('Rental updated successfully!');
        setShowEditModal(false);
        setEditingRental(null);
        loadRentals(pagination.currentPage);
      } else {
        showNotification(result.error || 'Failed to update rental', 'error');
      }
    } catch (error) {
      console.error('Error updating rental:', error);
      showNotification(error.message || 'Failed to update rental', 'error');
    }
    setIsSubmitting(false);
  };

  // Delete rental
  const handleDeleteRental = async () => {
    if (!selectedRental) return;
    
    setIsSubmitting(true);
    try {
      const result = await rentalService.deleteRental(selectedRental.id);
      
      if (result.success) {
        await notificationService.sendNotificationToAll(
          `🗑️ Suit rental ${selectedRental.reference} deleted - ${selectedRental.customerName}`,
          'WARNING',
          '/suit-rentals'
        );
        
        showNotification('Rental deleted successfully!');
        setShowDeleteModal(false);
        setSelectedRental(null);
        loadRentals(pagination.currentPage);
      } else {
        showNotification(result.error || 'Failed to delete rental', 'error');
      }
    } catch (error) {
      console.error('Error deleting rental:', error);
      showNotification(error.message || 'Failed to delete rental', 'error');
    }
    setIsSubmitting(false);
  };

  // Update rental status
  const handleUpdateStatus = async (rentalId, newStatus) => {
    try {
      const result = await rentalService.updateRentalStatus(rentalId, newStatus);
      
      if (result.success) {
        await notificationService.sendNotificationToAll(
          `📋 Suit rental ${result.rental.reference} status changed to ${newStatus}`,
          'ORDER',
          '/suit-rentals'
        );
        
        showNotification(`Status updated to ${newStatus}!`);
        loadRentals(pagination.currentPage);
      } else {
        showNotification(result.error || 'Failed to update status', 'error');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showNotification(error.message || 'Failed to update status', 'error');
    }
  };

  // Handle payment complete (from PaymentModal)
  const handlePaymentComplete = (updatedOrder) => {
    showNotification(`✅ Payment recorded for ${updatedOrder.reference || updatedOrder.recNo}`);
    loadRentals(pagination.currentPage);
  };

  // ============================================================
  // ✅ EFFECTS
  // ============================================================

  useEffect(() => {
    loadData();
  }, []);

  // Debounced search and filter
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) {
        loadRentals(0);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [filterStatus, searchQuery]);

  // ============================================================
  // ✅ FORM HELPERS
  // ============================================================

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      customerIdNumber: '',
      customerIdImage: null,
      suitName: '',
      suitCategory: '',
      suitColor: '',
      rentalStartDate: '',
      rentalEndDate: '',
      rentalFee: 0,
      deposit: 0,
      totalAmount: 0,
      days: 0,
      remainingBalance: 0,
      paymentMethod: 'CASH',
      paymentStatus: 'PENDING',
      mpesaCode: '',
      notes: '',
      rentedBy: user?.name || '',
      status: 'PENDING'
    });
    setSignatureData(null);
    clearSignature();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  };

  // ============================================================
  // ✅ AUTO-CALCULATE TOTAL
  // ============================================================

  useEffect(() => {
    const days = calculateDays(formData.rentalStartDate, formData.rentalEndDate);
    const dailyRate = formData.rentalFee || 0;
    const subtotal = dailyRate * days;
    const deposit = formData.deposit || 0;
    const balance = Math.max(0, subtotal - deposit);

    setFormData(prev => ({
      ...prev,
      days,
      totalAmount: subtotal,
      remainingBalance: balance
    }));
  }, [formData.rentalStartDate, formData.rentalEndDate, formData.rentalFee, formData.deposit]);

  useEffect(() => {
    if (!showEditModal) return;
    const days = calculateDays(editFormData.rentalStartDate, editFormData.rentalEndDate);
    const dailyRate = editFormData.rentalFee || 0;
    const subtotal = dailyRate * days;
    const deposit = editFormData.deposit || 0;
    const balance = Math.max(0, subtotal - deposit);

    setEditFormData(prev => ({
      ...prev,
      days,
      totalAmount: subtotal,
      remainingBalance: balance
    }));
  }, [showEditModal, editFormData.rentalStartDate, editFormData.rentalEndDate, editFormData.rentalFee, editFormData.deposit]);

  // ============================================================
  // ✅ SIGNATURE HANDLERS
  // ============================================================

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureData(canvas.toDataURL('image/png'));
    }
  };

  // ============================================================
  // ✅ STATUS BADGE
  // ============================================================

  const getStatusBadge = (status) => {
    const statusMap = {
      PENDING: { label: '⏳ Pending', color: 'bg-yellow-100 text-yellow-800' },
      RENTED: { label: '📌 Rented', color: 'bg-blue-100 text-blue-800' },
      RETURNED: { label: '✅ Returned', color: 'bg-green-100 text-green-800' },
      CANCELLED: { label: '❌ Cancelled', color: 'bg-red-100 text-red-800' }
    };
    return statusMap[status] || { label: status || 'Pending', color: 'bg-gray-100 text-gray-800' };
  };

  // ============================================================
  // ✅ NOTIFICATION
  // ============================================================

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ============================================================
  // ✅ STATS
  // ============================================================

  const totalRentals = rentals.length;
  const pendingRentals = rentals.filter(r => r.status === 'PENDING').length;
  const activeRentals = rentals.filter(r => r.status === 'RENTED').length;
  const returnedRentals = rentals.filter(r => r.status === 'RETURNED').length;
  const totalRevenue = rentals.reduce((sum, r) => sum + (r.totalAmount || 0), 0);

  // ============================================================
  // ✅ RENDER
  // ============================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-3 sm:px-4 pb-24">
      {/* NOTIFICATION */}
      {notification && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2 ${
          notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span className="text-sm font-medium">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-70">
            <X size={16} />
          </button>
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            onClick={() => setActiveView('dashboard')}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-xs sm:text-xl font-bold text-gray-800 flex items-center gap-1.5 leading-tight truncate">
              <ShoppingBag className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-rose-500 flex-shrink-0" />
              <span className="truncate">Suit Rentals</span>
            </h2>
            <p className="text-[8px] sm:text-sm text-gray-500 leading-tight truncate">
              {totalRentals} rentals • {activeRentals} active
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1 px-2 py-1 sm:px-4 sm:py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[10px] sm:text-sm transition flex-shrink-0 whitespace-nowrap"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4" /> 
          <span className="hidden xs:inline">New Rental</span>
          <span className="inline xs:hidden">New Rental</span>
        </button>
      </div>

      {/* STATS */}
<div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
  {/* Total - Hidden on mobile */}
  <div className="hidden sm:block bg-white p-1.5 rounded-lg shadow-sm border border-gray-100 text-center">
    <p className="text-[7px] text-gray-400 uppercase">Total</p>
    <p className="text-sm font-bold">{totalRentals}</p>
  </div>
  
  <div className="bg-white p-1.5 rounded-lg shadow-sm border border-gray-100 text-center">
    <p className="text-[7px] text-gray-400 uppercase">Pending</p>
    <p className="text-sm font-bold text-yellow-600">{pendingRentals}</p>
  </div>
  
  {/* Active - Hidden on mobile */}
  <div className="hidden sm:block bg-white p-1.5 rounded-lg shadow-sm border border-gray-100 text-center">
    <p className="text-[7px] text-gray-400 uppercase">Active</p>
    <p className="text-sm font-bold text-blue-600">{activeRentals}</p>
  </div>
  
  <div className="bg-white p-1.5 rounded-lg shadow-sm border border-gray-100 text-center">
    <p className="text-[7px] text-gray-400 uppercase">Returned</p>
    <p className="text-sm font-bold text-green-600">{returnedRentals}</p>
  </div>
  
  <div className="bg-white p-1.5 rounded-lg shadow-sm border border-gray-100 text-center sm:col-span-1">
    <p className="text-[7px] text-gray-400 uppercase">Revenue</p>
    <p className="text-sm font-bold text-rose-600 truncate">{formatCurrency(totalRevenue)}</p>
  </div>
</div>

      {/* SEARCH & FILTER */}
      <div className="bg-white rounded-xl border border-gray-100 p-2 sm:p-4 shadow-sm">
        <div className="flex flex-row gap-1.5 sm:gap-2">
  <div className="flex-1 min-w-0">
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search..."
        className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 outline-none"
      />
    </div>
  </div>
  <select
    value={filterStatus}
    onChange={(e) => setFilterStatus(e.target.value)}
    className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-lg text-[10px] sm:text-sm focus:ring-2 focus:ring-rose-500 outline-none flex-shrink-0"
  >
    <option value="all">All</option>
    <option value="PENDING">⏳ Pending</option>
    <option value="RENTED">📌 Rented</option>
    <option value="RETURNED">✅ Returned</option>
    <option value="CANCELLED">❌ Cancelled</option>
  </select>
</div>
      </div>

            {/* RENTALS TABLE */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {rentals.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No suit rentals found</p>
            <p className="text-sm text-gray-400">Click "New Rental" to rent out a suit</p>
          </div>
        ) : (
          <>
                        {/* MOBILE: compact card list */}
            <div className="sm:hidden divide-y divide-gray-100">
              {rentals.map((rental) => (
                <div key={rental.id} className="p-2 space-y-1">
                  {/* Row 1: Ref + Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[8px] text-gray-400">{rental.reference}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full whitespace-nowrap ${getStatusBadge(rental.status).color}`}>
                      {getStatusBadge(rental.status).label}
                    </span>
                  </div>

                  {/* Row 2: Name + Days + Amount */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-semibold text-sm text-gray-800 truncate">{rental.customerName}</span>
                      <span className="text-[10px] text-blue-600 font-semibold flex-shrink-0">
                        • {rental.days || 0} days
                      </span>
                    </div>
                    <p className="font-bold text-sm text-gray-800 flex-shrink-0">{formatCurrency(rental.totalAmount)}</p>
                  </div>

                  {/* Row 3: Suit + Category + Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full border border-gray-200 flex-shrink-0"
                        style={{ backgroundColor: rental.suitColor || '' }}
                      />
                      <span className="text-xs text-gray-600 truncate">
                        {rental.suitName}
                        {rental.suitCategory && (
                          <span className="text-[9px] text-gray-400 ml-0.5">({rental.suitCategory})</span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => {
                          setSelectedRental(rental);
                          setShowDetailModal(true);
                        }}
                        className="p-1 hover:bg-blue-50 rounded-lg text-blue-500"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedOrderForReceipt(rental);
                          setShowReceiptModal(true);
                        }}
                        className="p-1 hover:bg-purple-50 rounded-lg text-purple-500"
                        title="View Receipt"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>

                      {rental.remainingBalance > 0 && (
                        <button
                          onClick={() => {
                            setSelectedOrderForPayment(rental);
                            setShowPaymentModal(true);
                          }}
                          className="p-1 hover:bg-orange-50 rounded-lg text-orange-500"
                          title="Record Payment"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setSelectedRental(rental);
                          setShowDeleteModal(true);
                        }}
                        className="p-1 hover:bg-red-50 rounded-lg text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP/TABLET: table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-2 py-2 text-left text-[9px] sm:text-xs font-medium text-gray-500 uppercase">Ref</th>
                    <th className="px-2 py-2 text-left text-[9px] sm:text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-2 py-2 text-left text-[9px] sm:text-xs font-medium text-gray-500 uppercase">Suit</th>
                    <th className="px-2 py-2 text-left text-[9px] sm:text-xs font-medium text-gray-500 uppercase">Dates</th>
                    <th className="px-2 py-2 text-center text-[9px] sm:text-xs font-medium text-gray-500 uppercase">Days</th>
                    <th className="px-2 py-2 text-right text-[9px] sm:text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-2 py-2 text-center text-[9px] sm:text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-2 py-2 text-center text-[9px] sm:text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rentals.map((rental) => (
                    <tr key={rental.id} className="hover:bg-gray-50 transition">
                      <td className="px-2 py-2 whitespace-nowrap">
                        <span className="font-mono text-[10px] font-bold text-gray-600">{rental.reference}</span>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <p className="font-medium text-sm text-gray-800 truncate max-w-[80px] sm:max-w-none">{rental.customerName}</p>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div 
                            className="w-3 h-3 rounded-full border border-gray-200 flex-shrink-0"
                            style={{ backgroundColor: rental.suitColor || '' }}
                          />
                          <p className="text-sm font-medium text-gray-800 truncate max-w-[90px] sm:max-w-none">
                            {rental.suitName}
                            {rental.suitCategory && (
                              <span className="text-[9px] text-gray-400 ml-0.5">({rental.suitCategory})</span>
                            )}
                          </p>
                        </div>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <div className="text-[10px] flex items-center gap-0.5">
                          <span>{formatDate(rental.rentalStartDate)}</span>
                          <span className="text-gray-300 text-[8px]">→</span>
                          <span>{formatDate(rental.rentalEndDate)}</span>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <span className="font-semibold text-blue-600 text-sm">{rental.days || 0}</span>
                      </td>
                      <td className="px-2 py-2 text-right">
                        <p className="font-bold text-sm text-gray-800 whitespace-nowrap">{formatCurrency(rental.totalAmount)}</p>
                      </td>
                      <td className="px-2 py-2 text-center whitespace-nowrap">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${getStatusBadge(rental.status).color}`}>
                          {getStatusBadge(rental.status).label}
                        </span>
                        <span className="text-[7px] text-gray-400 ml-0.5">by {rental.rentedBy || 'System'}</span>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            onClick={() => {
                              setSelectedRental(rental);
                              setShowDetailModal(true);
                            }}
                            className="p-1 hover:bg-blue-50 rounded-lg text-blue-500 transition"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedOrderForReceipt(rental);
                              setShowReceiptModal(true);
                            }}
                            className="p-1 hover:bg-purple-50 rounded-lg text-purple-500 transition"
                            title="View Receipt"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {rental.remainingBalance > 0 && (
                            <button
                              onClick={() => {
                                setSelectedOrderForPayment(rental);
                                setShowPaymentModal(true);
                              }}
                              className="p-1 hover:bg-orange-50 rounded-lg text-orange-500 transition"
                              title="Record Payment"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => {
                              setSelectedRental(rental);
                              setShowDeleteModal(true);
                            }}
                            className="p-1 hover:bg-red-50 rounded-lg text-red-400 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* PAGINATION */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 bg-white rounded-xl px-3 py-2 border border-gray-100">
          <button
            onClick={() => loadRentals(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 0}
            className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600">
            Page {pagination.currentPage + 1} of {pagination.totalPages}
            <span className="text-xs text-gray-400 ml-2">
              ({pagination.totalItems} total)
            </span>
          </span>
          <button
            onClick={() => loadRentals(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages - 1}
            className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ===== CREATE RENTAL MODAL ===== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white sm:rounded-2xl w-full sm:max-w-2xl h-auto max-h-[calc(100vh-5rem)] sm:max-h-[95vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 sm:px-6 sm:py-4 sm:rounded-t-2xl flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <div className="bg-rose-100 p-2 rounded-lg">
                  <ShoppingBag className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">New Suit Rental</h3>
                  <p className="text-xs text-gray-400">Fill in the rental details</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Customer Info */}
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-rose-500" /> Customer Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Customer Name *</label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                    <input
                      type="text"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                      placeholder="Email address"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">ID Number</label>
                    <input
                      type="text"
                      value={formData.customerIdNumber}
                      onChange={(e) => setFormData({...formData, customerIdNumber: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                      placeholder="ID/Passport number"
                    />
                  </div>
                  <div className="sm:col-span-2">
      <label className="block text-xs font-medium text-gray-600 mb-1">ID Image</label>
      <div className="flex items-center gap-3">
        <input
  type="file"
  accept="image/*"
  onChange={async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Compress the image before storing
        const compressedImage = await compressImage(file, 600, 600, 0.6);
        setFormData({...formData, customerIdImage: compressedImage});
        showNotification('Image compressed successfully', 'success');
      } catch (error) {
        console.error('Error compressing image:', error);
        showNotification('Failed to compress image', 'error');
      }
    }
  }}
  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
/>
        {formData.customerIdImage && (
          <button
            onClick={() => setFormData({...formData, customerIdImage: null})}
            className="p-1.5 hover:bg-red-100 rounded-lg text-red-500 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {formData.customerIdImage && (
        <div className="mt-2">
          <img 
            src={formData.customerIdImage} 
            alt="ID Preview" 
            className="max-h-20 rounded-lg border border-gray-200"
          />
        </div>
      )}
      <p className="text-[10px] text-gray-400 mt-1">Upload a photo of the customer's ID (optional)</p>
    </div>
                </div>
              </div>

              {/* Suit Details */}
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-rose-500" /> Suit Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Suit Name *</label>
                    <input
                      type="text"
                      value={formData.suitName}
                      onChange={(e) => setFormData({...formData, suitName: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                      placeholder="e.g., Classic Tuxedo"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                    <select
                      value={formData.suitCategory}
                      onChange={(e) => setFormData({...formData, suitCategory: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                    >
                      <option value="FORMAL">Formal</option>
                      <option value="MODERN">Modern</option>
                      <option value="BUSINESS">Business</option>
                      <option value="CASUAL">Casual</option>
                      <option value="PREMIUM">Premium</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                    <input
                      type="text"
                      value={formData.suitColor}
                      onChange={(e) => setFormData({...formData, suitColor: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                      placeholder="e.g., Navy Blue, Black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Daily Rate (KES)</label>
                    <input
                      type="number"
                      value={formData.rentalFee}
                      onChange={(e) => setFormData({...formData, rentalFee: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                      placeholder="8500"
                      min="0"
                      step="100"
                    />
                  </div>
                </div>
              </div>

              {/* Rental Dates */}
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-rose-500" /> Rental Period
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start Date *</label>
                    <input
                      type="date"
                      value={formData.rentalStartDate}
                      onChange={(e) => setFormData({...formData, rentalStartDate: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End Date *</label>
                    <input
                      type="date"
                      value={formData.rentalEndDate}
                      onChange={(e) => setFormData({...formData, rentalEndDate: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                  </div>
                </div>
                {formData.rentalStartDate && formData.rentalEndDate && (
                  <div className="mt-2 text-xs text-gray-500">
                    Duration: {formData.days} days • Total: {formatCurrency(formData.totalAmount)}
                  </div>
                )}
              </div>

              {/* Financials */}
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-rose-500" /> Financials
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Total (KES)</label>
                    <input
                      type="number"
                      value={formData.totalAmount}
                      readOnly
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm font-bold text-rose-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Deposit (KES)</label>
                    <input
                      type="number"
                      value={formData.deposit}
                      onChange={(e) => setFormData({...formData, deposit: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                      placeholder="5000"
                      min="0"
                      step="100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Balance (KES)</label>
                    <input
                      type="number"
                      value={formData.remainingBalance}
                      readOnly
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm font-bold text-orange-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Signature */}
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-rose-500" /> Digital Signature
                </h4>
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-3">
                  <p className="text-xs text-gray-500">Sign below to accept the terms and conditions</p>
                  <div className="relative rounded-lg overflow-hidden border border-gray-300 bg-white">
                    <canvas
                      ref={canvasRef}
                      width={500}
                      height={160}
                      className="w-full h-[160px] cursor-crosshair touch-none block"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                    {!signatureData && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-sm text-gray-300">Sign here</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={clearSignature}
                      className="text-xs font-medium text-red-500 hover:text-red-600 transition"
                    >
                      Clear Signature
                    </button>
                    {signatureData && (
                      <div className="text-xs text-green-600 flex items-center gap-1 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Signature captured
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none resize-none"
                  rows="2"
                  placeholder="Special notes about this rental..."
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-2 pt-2 pb-2 sm:px-6 sm:py-4 flex items-center justify-end gap-1 sm:gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-2 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition whitespace-nowrap"
              >
                Cancel
              </button>
              <button
  onClick={handleCreateRental}  // ← Changed to handleCreateRental
  disabled={isSubmitting}
  className="px-2 py-1.5 sm:px-4 sm:py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[10px] sm:text-sm font-medium transition flex items-center gap-0.5 whitespace-nowrap"
>
  <Save className="w-3 h-3 sm:w-4 sm:h-4" /> {isSubmitting ? 'Creating...' : 'Create Rental'}
</button>
            </div>
          </div>
        </div>
      )}


       {/* ===== TERMS AND CONDITIONS MODAL - COMPACT ===== */}
{showTermsModal && (
  <div 
    className="fixed inset-0 z-[200] flex items-start sm:items-center justify-center pt-6 px-3 pb-3 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
    onClick={(e) => e.target === e.currentTarget && setShowTermsModal(false)}
  >
    <div className="bg-white w-full rounded-2xl max-w-sm max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-300 pb-3 sm:pb-4">
      
      {/* Header - Shows "View" mode when viewing */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-3 sm:px-4 py-2.5 sm:py-3 rounded-t-2xl flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="bg-rose-100 p-1.5 rounded-lg">
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600" />
          </div>
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-gray-800">
              {pendingRentalAction === 'view' ? '📋 View Terms' : 'Terms & Conditions'}
            </h3>
            <p className="text-[9px] sm:text-[10px] text-gray-500">
              {pendingRentalAction === 'view' ? 'Customer Agreement' : 'Suit Rental Agreement'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => {
            setShowTermsModal(false);
            setPendingRentalAction(null);
          }} 
          className="p-1 hover:bg-gray-100 rounded-lg transition"
        >
          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
        </button>
      </div>

      {/* Content - Compact */}
      <div className="p-3 sm:p-4 space-y-2">
        {/* Agreement Notice */}
        <div className="bg-rose-50 border border-rose-100 rounded-lg p-2.5 sm:p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 flex-shrink-0 mt-0.5" />
             <p className="text-[9px] sm:text-[11px] text-rose-800 leading-relaxed">
              {pendingRentalAction === 'view' ? (
                <span>📄 <span className="font-semibold">Customer Agreement</span> - Accepted on {selectedRental?.termsAcceptedAt ? formatDate(selectedRental.termsAcceptedAt) : 'N/A'}</span>
              ) : (
                <span><span className="font-semibold">Please read carefully.</span> By signing, you agree to all terms below.</span>
              )}
            </p>
          </div>
        </div>

        {/* Terms List - Compact Cards */}
        <div className="space-y-1.5 max-h-[40vh] overflow-y-auto pr-1">
          {[
            { num: '1', title: 'Rental Period', desc: 'Suit must be returned by the agreed end date. Late returns incur daily charges.' },
            { num: '2', title: 'Payment', desc: 'Full payment required before pickup. Deposit is refundable upon return in good condition.' },
            { num: '3', title: 'Condition', desc: 'Return suit in same condition. Damage or excessive wear may result in charges.' },
            { num: '4', title: 'Late Returns', desc: 'Late returns incur additional daily charges at the full daily rate.' },
            { num: '5', title: 'Cancellation', desc: 'Cancel 24hrs before start for full refund of any deposit paid.' },
            { num: '6', title: 'Liability', desc: 'Customer assumes full responsibility. Loss/theft may result in full replacement cost.' },
            { num: '7', title: 'ID Verification', desc: 'Valid ID required and will be stored securely for verification purposes.' },
            { num: '8', title: 'Governing Law', desc: 'This agreement is governed by the laws of Kenya. Any disputes shall be resolved through the appropriate legal channels.' }
          ].map((term) => (
            <div key={term.num} className="bg-gray-50 rounded-lg border border-gray-100 p-2">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 bg-rose-100 rounded-full flex items-center justify-center text-[7px] font-bold text-rose-600 flex-shrink-0 mt-0.5">
                  {term.num}
                </span>
                <div className="flex-1 min-w-0">
                  <h5 className="font-semibold text-[9px] sm:text-[10px] text-gray-800">{term.title}</h5>
                  <p className="text-[9px] sm:text-[10px] text-gray-600 mt-0.5 leading-relaxed">{term.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Customer Signature - Only shown in View mode */}
        {pendingRentalAction === 'view' && selectedRental?.signature && (
          <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
            <p className="text-[10px] text-gray-600 font-medium mb-1">✍️ Customer Signature:</p>
            <img 
              src={selectedRental.signature} 
              alt="Customer Signature" 
              className="max-h-12 border rounded p-1 bg-white"
            />
          </div>
        )}

        {/* Signature Notice - Only for create/edit */}
        {pendingRentalAction !== 'view' && (
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-2">
            <p className="text-[9px] sm:text-[10px] text-yellow-800 text-center">
              ✍️ By signing, you agree to all 8 terms and conditions above.
            </p>
          </div>
        )}
      </div>

      {/* Footer - Compact Buttons */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-3 sm:px-4 py-2.5 sm:py-3 flex gap-2">
        {pendingRentalAction === 'view' ? (
          // View mode - only Close button
          <button
            onClick={() => {
              setShowTermsModal(false);
              setPendingRentalAction(null);
            }}
            className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-[10px] sm:text-xs font-medium transition"
          >
            Close
          </button>
        ) : (
          // Create/Edit mode - Decline & Accept buttons
          <>
            <button
              onClick={() => {
                setShowTermsModal(false);
                setPendingRentalAction(null);
              }}
              className="flex-1 py-2 text-[10px] sm:text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition font-medium"
            >
              Decline
            </button>
            <button
              onClick={() => {
                setShowTermsModal(false);
                if (pendingRentalAction === 'create') {
                  performCreateRental();
                } else if (pendingRentalAction === 'edit') {
                  performEditRental();
                }
                setPendingRentalAction(null);
              }}
              className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[10px] sm:text-xs font-medium transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <CheckCircle className="w-3 h-3" /> Accept
            </button>
          </>
        )}
      </div>
    </div>
  </div>
)}

      {/* ===== DETAIL MODAL ===== */}
{showDetailModal && selectedRental && (
  <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
    <div className="bg-white sm:rounded-2xl w-full sm:max-w-2xl max-h-[calc(100vh-5rem)] sm:max-h-[95vh] flex flex-col shadow-2xl">
      
      {/* HEADER - Fixed */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-3 sm:px-6 sm:py-4 sm:rounded-t-2xl flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 p-1.5 sm:p-2 rounded-lg">
            <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-gray-800">Rental Details</h3>
            <p className="text-[10px] sm:text-xs text-gray-400">{selectedRental.reference}</p>
          </div>
        </div>
        <button onClick={() => setShowDetailModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
          <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
        </button>
      </div>

      {/* ✅ ACTION BUTTONS - NOW AT THE TOP (right after header) */}
      <div className="flex-shrink-0 bg-gray-50 border-b border-gray-100 px-3 sm:px-6 py-2 sm:py-3 flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
        {/* Edit Button */}
        <button
          onClick={() => {
            setShowDetailModal(false);
            setEditingRental(selectedRental);
            
            const dailyRate = selectedRental.suitPricePerDay || selectedRental.rentalFee || 0;
            
            setEditFormData({
              customerName: selectedRental.customerName || '',
              customerPhone: selectedRental.customerPhone || '',
              customerEmail: selectedRental.customerEmail || '',
              customerIdNumber: selectedRental.customerIdNumber || '',
              customerIdImage: selectedRental.customerIdImage || null,
              suitName: selectedRental.suitName || '',
              suitCategory: selectedRental.suitCategory || '',
              suitColor: selectedRental.suitColor || '',
              rentalStartDate: selectedRental.rentalStartDate || '',
              rentalEndDate: selectedRental.rentalEndDate || '',
              rentalFee: dailyRate,
              deposit: selectedRental.deposit || 0,
              totalAmount: selectedRental.totalAmount || 0,
              days: selectedRental.days || 0,
              remainingBalance: selectedRental.remainingBalance || 0,
              paymentMethod: selectedRental.paymentMethod || 'CASH',
              paymentStatus: selectedRental.paymentStatus || 'PENDING',
              mpesaCode: selectedRental.mpesaCode || '',
              notes: selectedRental.notes || '',
              status: selectedRental.status || 'PENDING'
            });
            setShowEditModal(true);
          }}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-[10px] sm:text-sm font-medium transition flex items-center gap-1 whitespace-nowrap"
        >
          <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" /> Edit
        </button>

        {/* Pay Button - only if balance > 0 */}
        {selectedRental.remainingBalance > 0 && (
          <button
            onClick={() => {
              setShowDetailModal(false);
              setSelectedOrderForPayment(selectedRental);
              setShowPaymentModal(true);
            }}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[10px] sm:text-sm font-medium transition flex items-center gap-1 whitespace-nowrap"
          >
            <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" /> Pay
          </button>
        )}

        {/* Return Button - only if not already returned or cancelled */}
        {selectedRental.status !== 'RETURNED' && selectedRental.status !== 'CANCELLED' && (
          <button
            onClick={() => handleUpdateStatus(selectedRental.id, 'RETURNED')}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-[10px] sm:text-sm font-medium transition flex items-center gap-1 whitespace-nowrap"
          >
            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" /> Return
          </button>
        )}
      </div>

      {/* CONTENT - Scrollable */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 pb-12 sm:pb-16 space-y-2.5 sm:space-y-4">
        {/* Customer Info */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="font-semibold text-xs sm:text-sm text-gray-700 mb-1.5">Customer</h4>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs sm:text-sm">
            <div><span className="text-gray-500">Name:</span> <span className="font-medium">{selectedRental.customerName}</span></div>
            <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{selectedRental.customerPhone || 'N/A'}</span></div>
            <div><span className="text-gray-500">Email:</span> <span className="font-medium truncate block">{selectedRental.customerEmail || 'N/A'}</span></div>
            <div><span className="text-gray-500">ID:</span> <span className="font-medium">{selectedRental.customerIdNumber || 'N/A'}</span></div>
          </div>
          {selectedRental.customerIdImage && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-600 mb-1.5">ID Image</p>
              <div 
                className="relative inline-block cursor-pointer group"
                onClick={() => {
                  setFullScreenImage(selectedRental.customerIdImage);
                }}
              >
                <img 
                  src={selectedRental.customerIdImage} 
                  alt="Customer ID" 
                  className="max-h-32 rounded-lg border border-gray-200 hover:opacity-90 transition"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/30 rounded-lg">
                  <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">Click to expand</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suit Info */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="font-semibold text-xs sm:text-sm text-gray-700 mb-1.5">Suit</h4>
          <div className="flex items-center gap-2.5">
            <div
              className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-gray-200 flex-shrink-0"
              style={{ backgroundColor: selectedRental.suitColor || '' }}
            />
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{selectedRental.suitName}</p>
              <p className="text-[10px] sm:text-xs text-gray-400 truncate">{selectedRental.suitCategory} • KES {selectedRental.suitPricePerDay}/day</p>
            </div>
          </div>
        </div>

        {/* Rental Period */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="font-semibold text-xs sm:text-sm text-gray-700 mb-1.5">Rental Period</h4>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs sm:text-sm">
            <div><span className="text-gray-500">Start:</span> <span className="font-medium">{formatDate(selectedRental.rentalStartDate)}</span></div>
            <div><span className="text-gray-500">End:</span> <span className="font-medium">{formatDate(selectedRental.rentalEndDate)}</span></div>
            <div><span className="text-gray-500">Days:</span> <span className="font-medium">{selectedRental.days} days</span></div>
            <div><span className="text-gray-500">Status:</span> <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getStatusBadge(selectedRental.status).color}`}>{getStatusBadge(selectedRental.status).label}</span></div>
          </div>
        </div>

        {/* Financials */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="font-semibold text-xs sm:text-sm text-gray-700 mb-1.5">Financials</h4>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs sm:text-sm">
            <div><span className="text-gray-500">Daily Rate:</span> <span className="font-medium">{formatCurrency(selectedRental.rentalFee)}</span></div>
            <div><span className="text-gray-500">Deposit:</span> <span className="font-medium text-blue-600">{formatCurrency(selectedRental.deposit)}</span></div>
            <div><span className="text-gray-500">Total:</span> <span className="font-bold text-rose-600">{formatCurrency(selectedRental.totalAmount)}</span></div>
            <div><span className="text-gray-500">Balance:</span> <span className="font-bold text-orange-600">{formatCurrency(selectedRental.remainingBalance)}</span></div>
          </div>
        </div>

        {/* Signature */}
        {selectedRental.signature && (
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-semibold text-xs sm:text-sm text-gray-700 mb-1.5">Customer Signature</h4>
            <img src={selectedRental.signature} alt="Signature" className="max-h-12 border rounded p-1 bg-white" />
          </div>
        )}

        {/* Terms & Conditions */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="font-semibold text-xs sm:text-sm text-gray-700 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
              Terms & Conditions Agreement
            </h4>
            <button
              onClick={() => {
                setShowTermsModal(true);
                setPendingRentalAction('view');
                console.log('📋 Opening Terms with:', selectedRental);
              }}
              className="text-[10px] sm:text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
            >
              <FileText className="w-3 h-3" />
              View Terms
            </button>
          </div>
          <div className="space-y-1 text-xs text-gray-600">
            {selectedRental.termsAccepted ? (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-green-700">Terms Accepted</span>
                </div>
                {selectedRental.termsAcceptedAt && (
                  <p className="text-[10px] text-gray-400">
                    Accepted: {formatDate(selectedRental.termsAcceptedAt)}
                  </p>
                )}
                {selectedRental.termsVersion && (
                  <p className="text-[10px] text-gray-400">
                    Version: {selectedRental.termsVersion}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-yellow-600" />
                <span className="text-yellow-700">Terms not accepted</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {selectedRental.notes && (
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-semibold text-xs sm:text-sm text-gray-700 mb-1.5">Notes</h4>
            <p className="text-xs sm:text-sm text-gray-600">{selectedRental.notes}</p>
          </div>
        )}
      </div>
    </div>
  </div>
)}

      {/* ===== EDIT RENTAL MODAL ===== */}
{showEditModal && editingRental && (
  <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
    <div className="bg-white sm:rounded-2xl w-full sm:max-w-2xl max-h-[calc(100vh-5rem)] sm:max-h-[95vh] flex flex-col shadow-2xl">
      
      {/* HEADER - Fixed */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-3 sm:px-6 sm:py-4 sm:rounded-t-2xl flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Edit2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Edit Rental</h3>
            <p className="text-xs text-gray-400">Ref: {editingRental.reference}</p>
          </div>
        </div>
        <button onClick={() => setShowEditModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* ✅ ACTION BUTTONS - AT THE TOP (right after header) */}
      <div className="flex-shrink-0 bg-gray-50 border-b border-gray-100 px-3 sm:px-6 py-2 sm:py-3 flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
        {/* <button
          onClick={() => setShowEditModal(false)}
          className="px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition whitespace-nowrap"
        >
          Cancel
        </button> */}
        <button
          onClick={handleSaveEdit}
          disabled={isSubmitting}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-[10px] sm:text-sm font-medium transition flex items-center gap-0.5 whitespace-nowrap"
        >
          <Save className="w-3 h-3 sm:w-4 sm:h-4" /> {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* CONTENT - Scrollable */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 pb-12 sm:pb-16 space-y-2.5 sm:space-y-4">
        {/* Customer Info */}
        <div>
          <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-500" /> Customer Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Customer Name *</label>
              <input
                type="text"
                value={editFormData.customerName}
                onChange={(e) => setEditFormData({...editFormData, customerName: e.target.value})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input
                type="text"
                value={editFormData.customerPhone}
                onChange={(e) => setEditFormData({...editFormData, customerPhone: e.target.value})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={editFormData.customerEmail}
                onChange={(e) => setEditFormData({...editFormData, customerEmail: e.target.value})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ID Number</label>
              <input
                type="text"
                value={editFormData.customerIdNumber}
                onChange={(e) => setEditFormData({...editFormData, customerIdNumber: e.target.value})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">ID Image</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      try {
                        const compressedImage = await compressImage(file, 600, 600, 0.6);
                        setEditFormData({...editFormData, customerIdImage: compressedImage});
                        showNotification('Image compressed successfully', 'success');
                      } catch (error) {
                        console.error('Error compressing image:', error);
                        showNotification('Failed to compress image', 'error');
                      }
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {editFormData.customerIdImage && (
                  <button
                    onClick={() => setEditFormData({...editFormData, customerIdImage: null})}
                    className="p-1.5 hover:bg-red-100 rounded-lg text-red-500 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {editFormData.customerIdImage && (
                <div className="mt-2">
                  <img 
                    src={editFormData.customerIdImage} 
                    alt="ID Preview" 
                    className="max-h-20 rounded-lg border border-gray-200"
                  />
                </div>
              )}
              <p className="text-[10px] text-gray-400 mt-1">Upload a photo of the customer's ID (optional)</p>
            </div>
          </div>
        </div>

        {/* Suit Details */}
        <div>
          <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-blue-500" /> Suit Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Suit Name *</label>
              <input
                type="text"
                value={editFormData.suitName}
                onChange={(e) => setEditFormData({...editFormData, suitName: e.target.value})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select
                value={editFormData.suitCategory}
                onChange={(e) => setEditFormData({...editFormData, suitCategory: e.target.value})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="FORMAL">Formal</option>
                <option value="MODERN">Modern</option>
                <option value="BUSINESS">Business</option>
                <option value="CASUAL">Casual</option>
                <option value="PREMIUM">Premium</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
              <input
                type="text"
                value={editFormData.suitColor}
                onChange={(e) => setEditFormData({...editFormData, suitColor: e.target.value})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Daily Rate (KES)</label>
              <input
                type="number"
                value={editFormData.rentalFee}
                onChange={(e) => setEditFormData({...editFormData, rentalFee: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                min="0"
                step="100"
              />
            </div>
          </div>
        </div>

        {/* Rental Period */}
        <div>
          <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" /> Rental Period
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Date *</label>
              <input
                type="date"
                value={editFormData.rentalStartDate}
                onChange={(e) => setEditFormData({...editFormData, rentalStartDate: e.target.value})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Date *</label>
              <input
                type="date"
                value={editFormData.rentalEndDate}
                onChange={(e) => setEditFormData({...editFormData, rentalEndDate: e.target.value})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          {editFormData.rentalStartDate && editFormData.rentalEndDate && (
            <div className="mt-2 text-xs text-gray-500">
              Duration: {editFormData.days} days • Total: {formatCurrency(editFormData.totalAmount)}
            </div>
          )}
        </div>

        {/* Financials */}
        <div>
          <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-blue-500" /> Financials
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Total (KES)</label>
              <input
                type="number"
                value={editFormData.totalAmount}
                readOnly
                className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm font-bold text-blue-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Deposit (KES)</label>
              <input
                type="number"
                value={editFormData.deposit}
                onChange={(e) => setEditFormData({...editFormData, deposit: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                min="0"
                step="100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Balance (KES)</label>
              <input
                type="number"
                value={editFormData.remainingBalance}
                readOnly
                className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm font-bold text-orange-600 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <select
            value={editFormData.status}
            onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="PENDING">⏳ Pending</option>
            <option value="RENTED">📌 Rented</option>
            <option value="RETURNED">✅ Returned</option>
            <option value="CANCELLED">❌ Cancelled</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
          <textarea
            value={editFormData.notes}
            onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            rows="2"
          />
        </div>
      </div>
    </div>
  </div>
)}

      {/* ===== DELETE MODAL ===== */}
      {showDeleteModal && selectedRental && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Rental</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete rental #{selectedRental.reference} for {selectedRental.customerName}? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium">Cancel</button>
                <button onClick={handleDeleteRental} disabled={isSubmitting} className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition font-medium">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== PAYMENT MODAL ===== */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedOrderForPayment(null);
        }}
        order={selectedOrderForPayment}
        onPaymentComplete={handlePaymentComplete}
        user={user}
      />

      {/* ===== RECEIPT MODAL ===== */}
      {showReceiptModal && selectedOrderForReceipt && activeView === 'suitRentals' && (
        <ReceiptModal
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedOrderForReceipt(null);
          }}
          receipt={selectedOrderForReceipt}
          user={user}
          isSales={user?.role === 'SALES'}
        />
      )}

       {fullScreenImage && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4"
          onClick={() => setFullScreenImage(null)}
        >
          <button
            onClick={() => setFullScreenImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition z-10"
          >
            <X className="w-10 h-10" />
          </button>
          <img 
            src={fullScreenImage} 
            alt="Full screen view" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default SuitRentals;