// Workbench.jsx - API-Oriented with Orders & Measurements
import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Ruler, Eye, User, Plus, X, Edit2, Trash2,
  Phone, MapPin, ShoppingCart, Package, Briefcase,
  Filter, Download, CheckCircle, Clock, AlertCircle,
  RefreshCw, Layers, Grid, List, DollarSign, Users, ArrowRight
} from 'lucide-react';

import { PaymentModal } from '../components/PaymentModal';
import { ReceiptModal } from '../components/ReceiptModal'; 
import { useNotifications } from '../context/NotificationContext';
import { orderService, userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const Workbench = ({
  user: propUser,
  isAdminOwner: propIsAdminOwner,
  isTailor: propIsTailor,
  isSales: propIsSales,
  activeView,
  setActiveView,
  
  openEditReceipt,
  deleteReceipt: propDeleteReceipt,
  receiptForm,
  setReceiptForm,
  editingReceipt,
  saveReceipt,
  toggleStyle: propToggleStyle,
  calcBalance: propCalcBalance,
  updateOrderStatus: propUpdateOrderStatus
}) => {
  const { user: authUser } = useAuth();
  const user = propUser || authUser;

  // ===== STATE =====
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTailor, setFilterTailor] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [records, setRecords] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tailorsList, setTailorsList] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [toastMsg, setToastMsg] = useState({ show: false, message: '', type: 'success' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [selectedOrderForHistory, setSelectedOrderForHistory] = useState(null);

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const receiptFormRef = useRef(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const { addNotification } = useNotifications();

  // Role checks
  const isAdminOwner = propIsAdminOwner || user?.role === 'ADMIN' || user?.role === 'OWNER';
  const isTailor = propIsTailor || user?.role === 'TAILOR';
  const isSales = propIsSales || user?.role === 'SALES';

  // ===== SUIT TYPES =====
  const suitTypes = [
    'Single Breasted', 'Double Breasted', 'Notch Lapel', 'Peak Lapel',
    'Shawl Lapel', 'Three Piece', 'Two Piece', 'Tuxedo', 'Morning Suit',
    'Dinner Suit', 'Blazer', 'Sport Coat', 'Other'
  ];

  // ===== STATUS OPTIONS =====
  const statusOptions = ['all', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  const statusColors = {
    PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
    IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
    COMPLETED: 'bg-green-100 text-green-700 border-green-200',
    CANCELLED: 'bg-red-100 text-red-700 border-red-200'
  };
  const statusIcons = {
    PENDING: <Clock className="w-3 h-3" />,
    IN_PROGRESS: <AlertCircle className="w-3 h-3" />,
    COMPLETED: <CheckCircle className="w-3 h-3" />,
    CANCELLED: <AlertCircle className="w-3 h-3" />
  };

  // ============================================================
  // TOAST
  // ============================================================
  const showToast = (message, type = 'success') => {
    setToastMsg({ show: true, message, type });
    setTimeout(() => setToastMsg({ show: false, message: '', type: 'success' }), 3000);
  };

  // ============================================================
  // LOAD DATA FROM API
  // ============================================================
  const loadData = async () => {
    setLoading(true);
    try {
      // Load orders from API
          // Load orders from API
    let ordersData = await orderService.getAllOrders();
    setAllRecords(ordersData || []);

    // ✅ Load tailors ONLY for ADMIN or OWNER
    if (isAdminOwner || isSales) {
      try {
        const usersData = await userService.getAllUsers();
        const tailors = (usersData || []).filter(u =>
          u.role === 'TAILOR' && u.status === 'ACTIVE'
        );
        setTailorsList(tailors);
      } catch (e) {
        console.log('Users not available for this user');
        setTailorsList([]);
      }
    } else {
      console.log(`🚫 User role "${user?.role}" does not have permission to view users`);
      setTailorsList([]);
    }

    // Apply filters
    let filtered = ordersData || [];

      if (isTailor && user?.email) {
        filtered = filtered.filter(r => r.tailorEmail === user.email);
      }

      if (filterStatus !== 'all') {
        filtered = filtered.filter(r => (r.status || 'PENDING') === filterStatus);
      }

      if (filterTailor !== 'all') {
        filtered = filtered.filter(r => r.tailorEmail === filterTailor);
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(r =>
          r.recNo?.toLowerCase().includes(query) ||
          r.style?.toLowerCase().includes(query) ||
          r.customerName?.toLowerCase().includes(query) ||
          r.tailorEmail?.toLowerCase().includes(query) ||
          r.suitType?.toLowerCase().includes(query)
        );
      }

      setRecords(filtered);
      setCurrentPage(1); // Reset to first page when data changes
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('❌ Error loading data', 'error');
      setRecords([]);
      setAllRecords([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [filterStatus, filterTailor, isTailor, user]);

  // Debounced search - waits for user to stop typing
useEffect(() => {
  const timer = setTimeout(() => {
    loadData();
  }, 800); // Wait 800ms after user stops typing

  return () => clearTimeout(timer);
}, [searchQuery]);

  // ============================================================
  // PAGINATION CALCULATIONS
  // ============================================================
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = records.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(records.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // ============================================================
  // GENERATE NEXT RECEIPT NUMBER
  // ============================================================
  const generateNextReceiptNumber = async () => {
    const allRecords = await orderService.getAllOrders();
    if (!allRecords || allRecords.length === 0) return 'R001';

    const numbers = allRecords
      .map(r => {
        const match = r.recNo?.match(/R(\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(n => n > 0);

    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNumber = maxNumber + 1;
    return `R${String(nextNumber).padStart(3, '0')}`;
  };

  // ============================================================
  // ADD MEASUREMENT ITEM
  // ============================================================
  const addMeasurementItem = (type) => {
  const isCoat = type === 'coat';
  const newItem = {
    id: Date.now(),
    type: type,
    name: isCoat ? 'Coat' : 'Trouser',
    ...(isCoat ? {
      coatFL: 28.5,
      coatCh: 40,
      coatWa: 35,
      coatSh: 17.5,
      coatSl: 24,
    } : {
      tFL: 42,
      tWa: 40,
      tTh: 32,
      tKn: 33,
      tB1: 27,
      tB2: 18,
    })
  };
  setReceiptForm({
    ...receiptForm,
    items: [...(receiptForm.items || []), newItem]
  });
};

  // ============================================================
  // REMOVE MEASUREMENT ITEM
  // ============================================================
  const removeMeasurementItem = (itemId) => {
    setReceiptForm({
      ...receiptForm,
      items: (receiptForm.items || []).filter(item => item.id !== itemId)
    });
  };

  // ============================================================
  // UPDATE MEASUREMENT ITEM
  // ============================================================
  const updateMeasurementItem = (itemId, field, value) => {
    setReceiptForm({
      ...receiptForm,
      items: (receiptForm.items || []).map(item => {
        if (item.id === itemId) {
          return { ...item, [field]: parseFloat(value) || 0 };
        }
        return item;
      })
    });
  };

  // ============================================================
  // HANDLE FORM CHANGES
  // ============================================================
  const handleDepositChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    const total = parseFloat(receiptForm.total) || 0;
    const balance = Math.max(0, total - value);
    setReceiptForm({ ...receiptForm, deposit: value, balance });
  };

  const handleTotalChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    const deposit = parseFloat(receiptForm.deposit) || 0;
    const balance = Math.max(0, value - deposit);
    setReceiptForm({ ...receiptForm, total: value, balance });
  };

  const handleBalanceChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setReceiptForm({ ...receiptForm, balance: value });
  };

  // ============================================================
  // UPDATE ORDER STATUS (API)
  // ============================================================
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const result = await orderService.updateOrderStatus(orderId, newStatus);

      if (result.success) {
        // Send notification
        if (addNotification) {
          const order = allRecords.find(r => r.id === orderId);
          const statusEmoji = newStatus === 'COMPLETED' ? '✅' :
            newStatus === 'IN_PROGRESS' ? '🔄' :
            newStatus === 'CANCELLED' ? '❌' : '📋';

          addNotification(
            `${statusEmoji} Order ${order?.recNo} status changed to ${newStatus} - ${order?.customerName || 'Unknown'}`,
            'order',
            '/workbench',
            user?.email
          );
        }

        if (propUpdateOrderStatus) {
          propUpdateOrderStatus(orderId, newStatus);
        }

        loadData();
        showToast(`✅ Status updated to ${newStatus}!`);
      } else {
        showToast(`❌ Failed to update status: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('❌ Failed to update status', 'error');
    }
  };

  // ============================================================
  // DELETE ORDER (API)
  // ============================================================
  const handleDeleteOrder = (orderId) => {
    setDeleteConfirm(orderId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const order = allRecords.find(r => r.id === deleteConfirm);
      const result = await orderService.deleteOrder(deleteConfirm);

      if (result.success) {
        if (addNotification && order) {
          addNotification(
            `🗑️ Order ${order.recNo} deleted - ${order.customerName || 'Unknown'}`,
            'warning',
            '/workbench',
            user?.email
          );
        }

        if (propDeleteReceipt) {
          propDeleteReceipt(deleteConfirm);
        }

        loadData();
        showToast('🗑️ Order deleted successfully!');
      } else {
        showToast(`❌ Failed to delete order: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      showToast('❌ Failed to delete order', 'error');
    }
    setDeleteConfirm(null);
  };

  // ============================================================
// VIEW RECEIPT - Opens ReceiptModal
// ============================================================
const handleViewReceipt = (orderId) => {
  console.log('👁️ View receipt called for order:', orderId);
  
  const record = allRecords.find(r => r.id === orderId);
  
  if (!record) {
    showToast('❌ Order not found', 'error');
    return;
  }

  console.log('📋 Record found:', record);
  
  // ✅ Set the receipt data and show modal
  setSelectedReceipt(record);
  setShowReceiptModal(true);
};

  // ============================================================
  // RECORD PAYMENT
  // ============================================================
  const handleRecordPayment = (orderId) => {
    const order = allRecords.find(r => r.id === orderId);
    if (!order) {
      showToast('❌ Order not found', 'error');
      return;
    }
    setSelectedOrderForPayment(order);
    setShowPaymentModal(true);
  };

  // ============================================================
  // VIEW PAYMENT HISTORY
  // ============================================================
  const handleViewPaymentHistory = (orderId) => {
    const order = allRecords.find(r => r.id === orderId);
    if (!order) {
      showToast('❌ Order not found', 'error');
      return;
    }
    setSelectedOrderForHistory(order);
    setShowPaymentHistoryModal(true);
  };

  // ============================================================
// EDIT ORDER - Load all data including measurements (FIXED)
// ============================================================
const handleEditOrder = async (orderId) => {
  console.log('✏️ Edit order called with ID:', orderId);
  
  const record = allRecords.find(r => r.id === orderId);
  if (!record) {
    showToast('❌ Order not found', 'error');
    return;
  }

  try {
    const fullOrder = await orderService.getOrderById(orderId);
    const orderData = fullOrder || record;

    console.log('📋 Full order data:', orderData);

    // ✅ FIX: Map both camelCase AND lowercase fields
    const items = (orderData.measurementItems || orderData.items || []).map(item => {
      const itemType = item.itemType || item.type || '';
      const isCoat = itemType.toLowerCase() === 'coat';
      const isTrouser = itemType.toLowerCase() === 'trouser';
      
      return {
        id: item.id,  // ✅ Keep original ID from database
        type: itemType,
        name: item.itemName || item.name || (isCoat ? 'Coat' : 'Trouser'),
        // Coat measurements - camelCase (already working)
        coatFL: parseFloat(item.coatFL || item.coat_fl || 0),
        coatCh: parseFloat(item.coatCh || item.coat_ch || 0),
        coatWa: parseFloat(item.coatWa || item.coat_wa || 0),
        coatSh: parseFloat(item.coatSh || item.coat_sh || 0),
        coatSl: parseFloat(item.coatSl || item.coat_sl || 0),
        // ✅ Trouser measurements - FIXED: Check lowercase FIRST
        tFL: parseFloat(item.tfl || item.tFL || item.t_fl || 0),
        tWa: parseFloat(item.twa || item.tWa || item.t_wa || 0),
        tTh: parseFloat(item.tth || item.tTh || item.t_th || 0),
        tKn: parseFloat(item.tkn || item.tKn || item.t_kn || 0),
        tB1: parseFloat(item.tb1 || item.tB1 || item.t_b1 || 0),
        tB2: parseFloat(item.tb2 || item.tB2 || item.t_b2 || 0),
      };
    });

    console.log('✅ Items loaded for edit:', items);

    let styles = orderData.styles || [];
    if (typeof styles === 'string') {
      styles = styles.split(',').map(s => s.trim());
    }

    setReceiptForm({
      recNo: orderData.recNo || '',
      date: orderData.orderDate || orderData.date || new Date().toLocaleDateString(),
      customerName: orderData.customerName || '',
      customerPhone: orderData.customerPhone || '',
      customerAddress: orderData.customerAddress || '',
      suitType: orderData.suitType || 'Single Breasted',
      deposit: parseFloat(orderData.deposit) || 0,
      total: parseFloat(orderData.total) || 0,
      balance: parseFloat(orderData.balance) || 0,
      tailorEmail: orderData.tailorEmail || '',
      items: items,
      styles: styles
    });

    // Set the editing state
    setEditingOrderId(orderId);
    setIsEditing(true);
    setShowCreateModal(true);
    
    console.log('✅ Edit state set with items:', {
      editingOrderId: orderId,
      isEditing: true,
      itemCount: items.length,
    });

  } catch (error) {
    console.error('Error loading order for edit:', error);
    showToast('❌ Failed to load order for editing', 'error');
  }
};

  // ============================================================
// SAVE RECORD (API)
// ============================================================
const handleSaveReceipt = async (e) => {
  e.preventDefault();
  if (!(isAdminOwner || isSales)) {
    toast.error('Access denied');
    return;
  }

  if (!receiptForm.customerName?.trim()) {
    toast.error('❌ Customer name is required');
    return;
  }

  if (!receiptForm.items || receiptForm.items.length === 0) {
    toast.error('❌ Please add at least one measurement (Coat or Trouser)');
    return;
  }

  const { recNo, date, deposit, total, tailorEmail, styles, balance, customerName, customerPhone, customerAddress, suitType, items, ...other } = receiptForm;
  const styleStr = styles?.map(s => s.replace('-', ' ')).join(', ') || 'Standard';

  const formattedItems = items.map(item => {
  const { id, type, name, coatFL, coatCh, coatWa, coatSh, coatSl, tFL, tWa, tTh, tKn, tB1, tB2, ...rest } = item;
  
  return { 
    id, 
    itemType: type, 
    itemName: name,
    // Coat fields (backend accepts camelCase)
    coatFL, coatCh, coatWa, coatSh, coatSl,
    // Trouser fields — MUST be lowercase for your backend
    tfl: tFL, 
    twa: tWa, 
    tth: tTh, 
    tkn: tKn, 
    tb1: tB1, 
    tb2: tB2,
    ...rest
  };
});

  const orderData = {
    recNo,
    orderDate: new Date().toISOString().split('T')[0],
    customerName: customerName || 'Unknown',
    customerPhone: customerPhone || '',
    customerAddress: customerAddress || '',
    suitType: suitType || 'Not Specified',
    style: styleStr,
    deposit: deposit || 0,
    total: total || 0,
    balance: balance || Math.max(0, (total || 0) - (deposit || 0)),
    tailorEmail: tailorEmail || 'unassigned',
    status: 'PENDING',
    measurementItems: formattedItems,
    ...other
  };

  // CRITICAL: Log the editing state for debugging
  console.log('🔍 Editing State:', {
    isEditing,
    editingOrderId,
    isEditingFlag: isEditing,
    editingOrderIdValue: editingOrderId
  });

  try {
    let result;
    if (editingOrderId && isEditing) {
  console.log('📝 UPDATING order with ID:', editingOrderId);
  console.log('📦 Update Data:', orderData);
  
  // ✅ Add this - include ID in the request body
  const updateData = {
    ...orderData,
    id: editingOrderId
  };
  
  result = await orderService.updateOrder(editingOrderId, updateData);
      
      if (result.success) {
        console.log('✅ Update successful:', result);
        showToast('✅ Order updated successfully!');
      } else {
        console.error('❌ Update failed:', result);
        showToast(`❌ Update failed: ${result.error || 'Unknown error'}`, 'error');
        return;
      }
    } else {
      // CREATE new order
      console.log('🆕 CREATING new order');
      console.log('📦 Create Data:', orderData);
      
      result = await orderService.createOrder(orderData);
      
      if (result.success) {
        console.log('✅ Creation successful:', result);
        showToast('✅ Order created successfully!');
      } else {
        console.error('❌ Creation failed:', result);
        showToast(`❌ Creation failed: ${result.error || 'Unknown error'}`, 'error');
        return;
      }
    }

    if (result?.success) {
      if (saveReceipt) {
        saveReceipt(e);
      }
      setShowCreateModal(false);
      setIsEditing(false);
      setEditingOrderId(null);
      loadData();
    } else {
      showToast(`❌ ${result?.error || 'Operation failed'}`, 'error');
    }
  } catch (error) {
    console.error('❌ Error saving order:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    showToast(`❌ Failed to ${editingOrderId && isEditing ? 'update' : 'create'} order: ${error.message}`, 'error');
  }
};
  // ============================================================
  // CREATE CLICK
  // ============================================================
  const handleCreateClick = async () => {
    const nextRecNo = await generateNextReceiptNumber();
    setReceiptForm({
      recNo: nextRecNo,
      date: new Date().toLocaleDateString(),
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      suitType: 'Single Breasted',
      deposit: 0,
      total: 0,
      balance: 0,
      tailorEmail: '',
      items: [],
      styles: []
    });
    setIsEditing(false);
    setShowCreateModal(true);
  };

  // ============================================================
  // TOGGLE STYLE
  // ============================================================
  const toggleStyle = (style) => {
    if (propToggleStyle) {
      propToggleStyle(style);
      return;
    }
    const current = receiptForm.styles || [];
    if (current.includes(style)) {
      setReceiptForm({ ...receiptForm, styles: current.filter(s => s !== style) });
    } else {
      setReceiptForm({ ...receiptForm, styles: [...current, style] });
    }
  };

  // ============================================================
  // CALC BALANCE
  // ============================================================
  const calcBalance = () => {
    if (propCalcBalance) {
      propCalcBalance();
      return;
    }
    const dep = parseFloat(receiptForm.deposit) || 0;
    const tot = parseFloat(receiptForm.total) || 0;
    setReceiptForm({ ...receiptForm, balance: Math.max(0, tot - dep) });
  };

  // ============================================================
  // GET STATUS BADGE
  // ============================================================
  const getStatusBadge = (status) => {
    const normalizedStatus = status?.toUpperCase() || 'PENDING';
    const color = statusColors[normalizedStatus] || 'bg-gray-100 text-gray-700 border-gray-200';
    const icon = statusIcons[normalizedStatus] || null;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}>
        {icon} {normalizedStatus?.charAt(0).toUpperCase() + normalizedStatus?.slice(1).toLowerCase() || 'Pending'}
      </span>
    );
  };

  // ============================================================
// RENDER MEASUREMENT ITEM - FIXED for lowercase trouser fields
// ============================================================
const renderMeasurementItem = (item) => {
  // Determine if coat based on type - handle both 'coat' and 'COAT'
  const isCoat = item.itemType?.toLowerCase() === 'coat' || item.type?.toLowerCase() === 'coat';
  const isTrouser = item.itemType?.toLowerCase() === 'trouser' || item.type?.toLowerCase() === 'trouser';
  
  // Get the item name - handle both 'itemName' and 'item_name'
  const itemName = item.itemName || item.item_name || item.name || (isCoat ? 'Coat' : 'Trouser');
  
  return (
    <div key={item.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50 relative">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-rose-500" />
          <span className="font-semibold text-sm text-gray-700">{itemName}</span>
          <span className="text-[10px] text-gray-400">#{item.id.toString().slice(-4)}</span>
        </div>
        <button
          type="button"
          onClick={() => removeMeasurementItem(item.id)}
          className="p-1 hover:bg-red-100 rounded text-red-500 transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {isCoat && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 sm:gap-2">
          {['coatFL', 'coatCh', 'coatWa', 'coatSh', 'coatSl'].map((field, idx) => {
            const labels = ['FL', 'Ch', 'Wa', 'Sh', 'Sl'];
            const value = item[field] !== undefined ? item[field] : 
                         item[field.toLowerCase()] !== undefined ? item[field.toLowerCase()] : '';
            return (
              <div key={field}>
                <label className="text-[8px] sm:text-[10px] text-gray-500">{labels[idx]}</label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => updateMeasurementItem(item.id, field, e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded px-1 sm:px-2 py-1 text-[10px] sm:text-xs focus:ring-2 focus:ring-rose-500 outline-none"
                  step="0.1"
                />
              </div>
            );
          })}
        </div>
      )}

      {isTrouser && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 sm:gap-2">
          {['tFL', 'tWa', 'tTh', 'tKn', 'tB1', 'tB2'].map((field, idx) => {
            const labels = ['FL', 'Wa', 'Th', 'Kn', 'B1', 'B2'];
            // ✅ FIX: Check lowercase versions first
            const lowerField = field.toLowerCase();
            const value = item[lowerField] !== undefined ? item[lowerField] : 
                         item[field] !== undefined ? item[field] : '';
            return (
              <div key={field}>
                <label className="text-[8px] sm:text-[10px] text-gray-500">{labels[idx]}</label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => updateMeasurementItem(item.id, field, e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded px-1 sm:px-2 py-1 text-[10px] sm:text-xs focus:ring-2 focus:ring-rose-500 outline-none"
                  step="0.1"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

  // ============================================================
  // STATS
  // ============================================================
  const totalBalance = records.reduce((sum, r) => sum + (r.balance || 0), 0);
  const totalRevenue = records.reduce((sum, r) => sum + (r.total || 0), 0);
  const completedOrders = records.filter(r => r.status === 'COMPLETED').length;
  const pendingOrders = records.filter(r => r.status === 'PENDING' || !r.status).length;
  const inProgressOrders = records.filter(r => r.status === 'IN_PROGRESS').length;
  const uniqueTailors = new Set(records.map(r => r.tailorEmail).filter(Boolean)).size;

  const canEdit = isAdminOwner || isSales;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Toast Notification */}
      {toastMsg.show && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm ${toastMsg.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
          {toastMsg.message}
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-100 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Order</h3>
              <p className="text-gray-600 text-sm mb-6">
                Are you sure you want to delete this order? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition font-medium"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      {(isAdminOwner || isSales) && (
  <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-3">
    {/* Total - Hidden on mobile, visible on desktop */}
    <div className="hidden sm:block bg-white p-1 sm:p-3 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 text-center">
      <p className="text-[6px] sm:text-[10px] text-gray-400 uppercase tracking-wide">Total</p>
      <p className="text-[11px] sm:text-lg font-extrabold text-gray-800">{records.length}</p>
    </div>
    
    <div className="bg-white p-1.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 text-center">
      <p className="text-[6px] sm:text-[10px] text-gray-400 uppercase tracking-wide">Pending</p>
      <p className="text-[11px] sm:text-lg font-extrabold text-amber-600">{pendingOrders}</p>
    </div>
    
    <div className="bg-white p-1.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 text-center">
      <p className="text-[6px] sm:text-[10px] text-gray-400 uppercase tracking-wide">Progress</p>
      <p className="text-[11px] sm:text-lg font-extrabold text-blue-600">{inProgressOrders}</p>
    </div>
    
    <div className="bg-white p-1.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 text-center">
      <p className="text-[6px] sm:text-[10px] text-gray-400 uppercase tracking-wide">Done</p>
      <p className="text-[11px] sm:text-lg font-extrabold text-green-600">{completedOrders}</p>
    </div>
    
    <div className="bg-white p-1.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 text-center">
      <p className="text-[6px] sm:text-[10px] text-gray-400 uppercase tracking-wide">Tailors</p>
      <p className="text-[11px] sm:text-lg font-extrabold text-purple-600">{uniqueTailors}</p>
    </div>
  </div>
)}

      {/* ✅ Customers Quick Link - Admin/Owner only */}
      {isAdminOwner && (
        <button
          onClick={() => setActiveView('customers')}
          className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 hover:shadow-md hover:border-rose-200 transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-rose-50 p-2 rounded-xl group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-xs sm:text-sm text-gray-800">Customers</h3>
              <p className="text-[9px] sm:text-[10px] text-gray-400">
                View profiles, tags & measurement history
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
        </button>
      )}

      {/* Role-specific info */}
      {isTailor && (
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-blue-100 bg-blue-50/50">
          <p className="text-sm text-blue-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium">Your Orders:</span>
            {records.length} order{records.length !== 1 ? 's' : ''} assigned to you
          </p>
        </div>
      )}

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
  <h2 className="font-bold text-[10px] sm:text-base flex items-center gap-0.5 sm:gap-2 whitespace-nowrap">
    <Layers className="w-3 sm:w-4 h-3 sm:h-4 text-rose-500" />
    <span className="whitespace-nowrap">Orders & Measurements</span>
    <span className="text-[6px] sm:text-xs bg-gray-100 text-gray-600 px-1 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
      {records.length}
    </span>
  </h2>
  
  <div className="flex items-center gap-1.5 flex-wrap">
    {/* Toggle View */}
    <button
      onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
      className="p-1 hover:bg-gray-100 rounded-lg transition text-gray-500"
      title="Toggle View"
    >
      {viewMode === 'list' ? <Grid className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
    </button>

    {/* Refresh */}
    <button
      onClick={loadData}
      className="p-1 hover:bg-gray-100 rounded-lg transition text-gray-500"
      title="Refresh"
    >
      <RefreshCw className="w-3.5 h-3.5" />
    </button>

    {/* Search - moved here, visible on mobile */}
    <div className="relative flex-1 min-w-[80px] sm:flex-initial sm:w-auto">
      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search..."
        className="pl-7 pr-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-[10px] w-full sm:w-32 focus:ring-2 focus:ring-rose-500 outline-none"
      />
    </div>

    {/* New Order */}
    {canEdit && (
      <button
        onClick={handleCreateClick}
        className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-3 py-1 sm:py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[9px] sm:text-xs transition whitespace-nowrap"
      >
        <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        <span className="hidden sm:inline">New Order</span>
        <span className="sm:hidden">New Order</span>
      </button>
    )}

    {/* Filters - hidden on mobile, visible on desktop */}
    <div className="hidden sm:flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-[10px] focus:ring-2 focus:ring-rose-500 outline-none"
        >
          {statusOptions.map(s => (
            <option key={s} value={s}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      {isAdminOwner && (
        <select
          value={filterTailor}
          onChange={(e) => setFilterTailor(e.target.value)}
          className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-[10px] focus:ring-2 focus:ring-rose-500 outline-none"
        >
          <option value="all">All Tailors</option>
          {tailorsList.map(t => (
            <option key={t.email} value={t.email}>{t.name || t.email}</option>
          ))}
        </select>
      )}

      {isAdminOwner && (
        <button className="p-1 hover:bg-gray-100 rounded-lg transition text-gray-500 shrink-0">
          <Download className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  </div>
</div>

{/* Filters - visible only on mobile */}
<div className="flex sm:hidden items-center gap-1.5 mb-3">
  <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
  <select
    value={filterStatus}
    onChange={(e) => setFilterStatus(e.target.value)}
    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-[10px] focus:ring-2 focus:ring-rose-500 outline-none"
  >
    {statusOptions.map(s => (
      <option key={s} value={s}>
        {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()}
      </option>
    ))}
  </select>

  {isAdminOwner && (
    <select
      value={filterTailor}
      onChange={(e) => setFilterTailor(e.target.value)}
      className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-[10px] focus:ring-2 focus:ring-rose-500 outline-none"
    >
      <option value="all">All Tailors</option>
      {tailorsList.map(t => (
        <option key={t.email} value={t.email}>{t.name || t.email}</option>
      ))}
    </select>
  )}
</div>

        {/* Orders - Desktop Table / Mobile Cards */}
<div className="overflow-x-auto -mx-4 px-4">
  <div className="min-w-full inline-block align-middle">
    
    {/* ✅ MOBILE CARDS - visible only on mobile */}
<div className="sm:hidden space-y-2">
  {currentItems.length === 0 ? (
    <div className="text-center py-8 text-gray-400 text-sm">
      {searchQuery || filterStatus !== 'all' || filterTailor !== 'all'
        ? 'No matching orders found'
        : 'No orders in the system yet'}
    </div>
  ) : (
    currentItems.map((r, index) => (
      <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
        {/* Row 1: Receipt # + Items count + Status */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-gray-600">{r.recNo}</span>
            <span className="text-[8px] text-gray-400">#{indexOfFirstItem + index + 1}</span>
            <span className="text-[8px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
              {(r.items || r.measurementItems || []).length} items
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {(isAdminOwner || isSales || (isTailor && r.tailorEmail === user?.email)) && (
              <select
                value={r.status || 'PENDING'}
                onChange={(e) => handleUpdateStatus(r.id, e.target.value)}
                className="text-[8px] border border-gray-200 rounded px-1.5 py-0.5 bg-white focus:ring-1 focus:ring-rose-500 outline-none font-medium"
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            )}
            {!isAdminOwner && !isSales && !isTailor && (
              <span className={`text-[8px] px-2 py-0.5 rounded-full font-medium ${
                r.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                r.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                r.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {r.status || 'Pending'}
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Customer + Amount */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-sm font-semibold text-gray-800 truncate">
              {r.customerName || 'N/A'}
            </span>
          </div>
          {!isTailor ? (
  <span className="text-sm font-bold text-gray-700 flex-shrink-0">
    KES {r.total?.toLocaleString() || 0}
  </span>
) : (
  <span className="text-sm font-bold text-gray-700 flex-shrink-0">
    ••••
  </span>
)}
        </div>

        {/* Row 3: Suit Type + Style (no items count) + Actions (moved here) */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2 min-w-0">
            <Briefcase className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="truncate">{r.suitType || 'Not Specified'}</span>
            {r.style && (
              <span className="text-[10px] text-gray-400 hidden xs:inline">• {r.style}</span>
            )}
          </div>
          
          {/* ✅ Actions - moved here */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => handleViewReceipt(r.id)}
              className="p-1 hover:bg-rose-50 rounded-lg text-rose-600 transition"
              title="View Receipt"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            {(isAdminOwner || isSales) && (
              <button
                onClick={() => handleEditOrder(r.id)}
                className="p-1 hover:bg-blue-50 rounded-lg text-blue-600 transition"
                title="Edit Order"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}

            {(isAdminOwner || isSales) && (
              <button
                onClick={() => handleRecordPayment(r.id)}
                className="p-1 hover:bg-green-50 rounded-lg text-green-600 transition"
                title="Record Payment"
              >
                <DollarSign className="w-3.5 h-3.5" />
              </button>
            )}

            {isAdminOwner && (
              <button
                onClick={() => handleDeleteOrder(r.id)}
                className="p-1 hover:bg-red-50 rounded-lg text-red-500 transition"
                title="Delete Order"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    ))
  )}
</div>

    {/* ✅ DESKTOP TABLE - hidden on mobile */}
    <div className="hidden sm:block overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase border-b">
          <tr>
            <th className="px-2 py-2 text-left font-semibold">#</th>
            <th className="px-2 py-2 text-left font-semibold whitespace-nowrap">Receipt</th>
            <th className="px-2 py-2 text-left font-semibold whitespace-nowrap">Date</th>
            <th className="px-2 py-2 text-left font-semibold whitespace-nowrap">Customer</th>
            <th className="px-2 py-2 text-left font-semibold whitespace-nowrap">Style</th>
            <th className="px-2 py-2 text-left font-semibold whitespace-nowrap">Suit Type</th>
            <th className="px-2 py-2 text-left font-semibold whitespace-nowrap">Items</th>
            <th className="px-2 py-2 text-left font-semibold whitespace-nowrap">Status</th>
            {!isTailor && (
  <th className="px-2 py-2 text-left font-semibold whitespace-nowrap">Payment</th>
)}
            {!isTailor && (
  <th className="px-2 py-2 text-left font-semibold whitespace-nowrap">Balance</th>
)}
            <th className="px-2 py-2 text-left font-semibold whitespace-nowrap">Tailor</th>
            <th className="px-2 py-2 text-center font-semibold whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length === 0 ? (
            <tr>
              <td colSpan="12" className="text-center py-8 text-gray-400 text-sm">
                {searchQuery || filterStatus !== 'all' || filterTailor !== 'all'
                  ? 'No matching orders found'
                  : 'No orders in the system yet'}
              </td>
            </tr>
          ) : (
            currentItems.map((r, index) => (
              <tr key={r.id} className="border-b hover:bg-gray-50 transition">
                <td className="px-2 py-2 text-[10px] text-gray-400 text-center font-medium">{indexOfFirstItem + index + 1}</td>
                <td className="px-2 py-2 font-mono text-[10px] font-bold whitespace-nowrap">{r.recNo}</td>
                <td className="px-2 py-2 text-[10px] font-medium whitespace-nowrap">{r.orderDate || r.date}</td>
                <td className="px-2 py-2 text-[10px] font-semibold max-w-20 truncate">
                  {r.customerName || 'N/A'}
                </td>
                <td className="px-2 py-2 text-[10px] font-medium max-w-20 truncate">{r.style}</td>
                <td className="px-2 py-2 text-[10px] font-medium max-w-20 truncate">
                  {r.suitType || 'N/A'}
                </td>
                <td className="px-2 py-2 text-[10px] font-semibold text-center">
                  {(r.items || r.measurementItems || []).length}
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[8px] font-bold whitespace-nowrap ${
                      r.status === 'COMPLETED' ? 'text-green-600' :
                      r.status === 'IN_PROGRESS' ? 'text-blue-600' :
                      r.status === 'PENDING' ? 'text-amber-600' :
                      'text-gray-600'
                    }`}>
                      {r.status === 'COMPLETED' ? 'CMP' :
                       r.status === 'IN_PROGRESS' ? 'PRG' :
                       r.status === 'PENDING' ? 'PND' :
                       'PND'}
                    </span>

                    {(isAdminOwner || isSales || (isTailor && r.tailorEmail === user?.email)) && (
                      <select
                        value={r.status || 'PENDING'}
                        onChange={(e) => handleUpdateStatus(r.id, e.target.value)}
                        className="text-[8px] border border-gray-200 rounded px-1 py-0.5 bg-white focus:ring-1 focus:ring-rose-500 outline-none font-medium"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    )}
                  </div>
                </td>

                {!isTailor && (
  <td className="px-2 py-2">
    <button
      onClick={() => handleViewPaymentHistory(r.id)}
      className="flex items-center gap-1.5 hover:bg-gray-50 rounded-lg px-1.5 py-0.5 transition w-full"
    >
      {r.paymentStatus === 'PAID' ? (
        <span className="text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
          ✅ Paid
        </span>
      ) : r.paymentStatus === 'PARTIAL' ? (
        <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
          Partial
        </span>
      ) : (
        <span className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
          Unpaid
        </span>
      )}
      {r.payments && r.payments.length > 0 && (
        <span className="text-[10px] font-bold text-gray-700 whitespace-nowrap">
          KES {r.payments.reduce((s, p) => s + p.amount, 0).toLocaleString()}
        </span>
      )}
    </button>
  </td>
)}
                {!isTailor && (
  <td className="px-2 py-2 font-bold text-[10px] whitespace-nowrap">
    KES {(r.balance || 0).toLocaleString()}
  </td>
)}
                <td className="px-2 py-2 text-[10px] text-gray-500 font-medium max-w-20 truncate">
                  {r.tailorEmail || 'unassigned'}
                </td>
                <td className="px-2 py-2 text-center">
                  <div className="flex items-center justify-center gap-1 flex-nowrap">
                    <button
                      onClick={() => handleViewReceipt(r.id)}
                      className="p-1 hover:bg-rose-50 rounded text-rose-600 transition"
                      title="View Receipt"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {(isAdminOwner || isSales) && (
                      <button
                        onClick={() => handleEditOrder(r.id)}
                        className="p-1 hover:bg-blue-50 rounded text-blue-600 transition"
                        title="Edit Order"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}

                    {!isTailor && (isAdminOwner || isSales) && (
  <button
    onClick={() => handleRecordPayment(r.id)}
    className="p-1 hover:bg-green-50 rounded-lg text-green-600 transition"
    title="Record Payment"
  >
    <DollarSign className="w-3.5 h-3.5" />
  </button>
)}

                    {isAdminOwner && (
                      <button
                        onClick={() => handleDeleteOrder(r.id)}
                        className="p-1 hover:bg-red-50 rounded text-red-500 transition"
                        title="Delete Order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
</div>

        {/* Pagination */}
        {records.length > itemsPerPage && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 mt-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${currentPage === 1 ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                Previous
              </button>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${currentPage === totalPages ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                  <span className="font-medium">
                    {indexOfLastItem > records.length ? records.length : indexOfLastItem}
                  </span>{' '}
                  of <span className="font-medium">{records.length}</span> results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-xs" aria-label="Pagination">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                      }`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === number
                        ? 'z-10 bg-rose-600 text-white focus:z-20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600'
                        : 'text-gray-900 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                        }`}
                    >
                      {number}
                    </button>
                  ))}
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                      }`}
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] flex flex-col my-2 sm:my-4">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-20">
              <h3 className="text-base sm:text-lg font-bold">{isEditing ? 'Edit Order' : 'New Order'}</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setIsEditing(false);
                  setEditingOrderId(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ✅ Action bar - Create/Update button at the top */}
            <div className="sticky top-[52px] sm:top-[65px] bg-gray-50 border-b border-gray-100 px-4 sm:px-6 py-2 sm:py-3 flex items-center justify-end gap-2 z-20">
              <button
                type="button"
                onClick={() => receiptFormRef.current?.requestSubmit()}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[10px] sm:text-sm font-medium transition whitespace-nowrap"
              >
                {isEditing ? 'Update Order' : 'Create Order'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-6 pb-32 sm:pb-36">
  <form ref={receiptFormRef} onSubmit={handleSaveReceipt} className="space-y-3 sm:space-y-4">
              {/* Receipt Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600">Receipt #</label>
                  <input
                    type="text"
                    value={receiptForm.recNo || ''}
                    onChange={(e) => setReceiptForm({ ...receiptForm, recNo: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Date</label>
                  <input
                    type="text"
                    value={receiptForm.date || ''}
                    onChange={(e) => setReceiptForm({ ...receiptForm, date: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <h4 className="font-semibold text-sm text-blue-700 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" /> Customer Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Customer Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={receiptForm.customerName || ''}
                        onChange={(e) => setReceiptForm({ ...receiptForm, customerName: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                        placeholder="Full name"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={receiptForm.customerPhone || ''}
                        onChange={(e) => setReceiptForm({ ...receiptForm, customerPhone: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                        placeholder="Phone number"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="text-xs font-medium text-gray-600">Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={receiptForm.customerAddress || ''}
                        onChange={(e) => setReceiptForm({ ...receiptForm, customerAddress: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                        placeholder="Address"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Suit Type */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4">
                <h4 className="font-semibold text-sm text-purple-700 mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> Suit Type
                </h4>
                <select
                  value={receiptForm.suitType || 'Single Breasted'}
                  onChange={(e) => setReceiptForm({ ...receiptForm, suitType: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                >
                  {suitTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Measurement Items */}
              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                  <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-rose-500" />
                    Measurement Items
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {(receiptForm.items || []).length}
                    </span>
                  </h4>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => addMeasurementItem('coat')}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs transition"
                    >
                      <Plus className="w-3 h-3" /> Add Coat
                    </button>
                    <button
                      type="button"
                      onClick={() => addMeasurementItem('trouser')}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs transition"
                    >
                      <Plus className="w-3 h-3" /> Add Trouser
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-62.5 sm:max-h-75 overflow-y-auto">
                  {(receiptForm.items || []).length === 0 ? (
                    <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <Package className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No items added yet</p>
                      <p className="text-xs text-gray-400">Click "Add Coat" or "Add Trouser" to start</p>
                    </div>
                  ) : (
                    (receiptForm.items || []).map(renderMeasurementItem)
                  )}
                </div>
              </div>

              {/* Financials */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600">Deposit (KES)</label>
                  <input
                    type="number"
                    value={receiptForm.deposit || 0}
                    onChange={handleDepositChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                    placeholder="Enter deposit"
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Total (KES)</label>
                  <input
                    type="number"
                    value={receiptForm.total || 0}
                    onChange={handleTotalChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                    placeholder="Enter total"
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Balance (KES)</label>
                  <input
                    type="number"
                    value={receiptForm.balance || 0}
                    onChange={handleBalanceChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                    placeholder="Auto or manual"
                    min="0"
                  />
                </div>
              </div>
              <p className="text-[10px] text-gray-400 -mt-2">
                ℹ️ Balance auto-calculates when Deposit or Total changes, or enter manually to override
              </p>

              {/* Tailor Selection */}
              <div>
                <label className="text-xs font-medium text-gray-600">Tailor</label>
                {tailorsList.length > 0 ? (
                  <select
                    value={receiptForm.tailorEmail || ''}
                    onChange={(e) => setReceiptForm({ ...receiptForm, tailorEmail: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                  >
                    <option value="">Select a tailor...</option>
                    {tailorsList.map((tailor) => (
                      <option key={tailor.email || tailor.id} value={tailor.email}>
                        {tailor.name || tailor.email} {tailor.email ? `(${tailor.email})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div>
                    <input
                      type="email"
                      value={receiptForm.tailorEmail || ''}
                      onChange={(e) => setReceiptForm({ ...receiptForm, tailorEmail: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                      placeholder="No tailors found. Enter email manually."
                    />
                    <p className="text-[10px] text-amber-500 mt-1">
                      ⚠️ No active tailors in the system. Add tailors in the Users section.
                    </p>
                  </div>
                )}
              </div>

              {/* Style Selection */}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-2">Styles</label>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {['modern-slim', 'classic-fit', 'casual', 'formal', 'slim-fit', 'relaxed'].map(style => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => toggleStyle(style)}
                      className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs rounded-lg border transition ${receiptForm.styles?.includes(style) ? 'bg-rose-500 text-white border-rose-500' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-rose-300'}`}
                    >
                      {style.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Buttons */}
            </form>
          </div>
        </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedOrderForPayment(null);
        }}
        order={selectedOrderForPayment}
        onPaymentComplete={() => {
          showToast('✅ Payment recorded successfully!');
          loadData();
        }}
        user={user}
      />

      {/* Payment History Modal */}
      {showPaymentHistoryModal && selectedOrderForHistory && (
        <div
          className="fixed inset-0 z-150 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowPaymentHistoryModal(false)}
        >
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 rounded-t-2xl flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 p-1.5 sm:p-2 rounded-lg">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-gray-800">Payment History</h3>
                  <p className="text-[10px] sm:text-xs text-gray-400">Receipt #{selectedOrderForHistory.recNo}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentHistoryModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 pb-24 sm:pb-6">
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-xl p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-500">Customer</span>
                  <span className="font-medium truncate ml-2">{selectedOrderForHistory.customerName || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-500">Total Amount</span>
                  <span className="font-bold">KES {selectedOrderForHistory.total?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-500">Total Paid</span>
                  <span className="font-bold text-green-600">
                    KES {selectedOrderForHistory.payments?.reduce((s, p) => s + (p.amount || 0), 0)?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm border-t border-gray-200 pt-1.5 sm:pt-2">
                  <span className="text-gray-500 font-medium">Remaining</span>
                  <span className={`font-bold text-sm sm:text-base ${(selectedOrderForHistory.balance || 0) > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                    KES {selectedOrderForHistory.balance?.toLocaleString() || 0}
                  </span>
                </div>
              </div>

              {/* Payment List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-xs sm:text-sm text-gray-700 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                    Payment Records
                  </h4>
                  <span className="text-[10px] sm:text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                    {selectedOrderForHistory.payments?.length || 0}
                  </span>
                </div>

                {selectedOrderForHistory.payments && selectedOrderForHistory.payments.length > 0 ? (
                  <div className="space-y-2 max-h-48 sm:max-h-56 overflow-y-auto pr-1">
                    {selectedOrderForHistory.payments.map((payment, idx) => (
                      <div key={payment.id || idx} className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:border-blue-200 transition">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span className={`text-[8px] sm:text-[10px] font-medium px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap ${payment.method === 'cash' ? 'bg-green-100 text-green-700' :
                              payment.method === 'm-pesa' ? 'bg-purple-100 text-purple-700' :
                                payment.method === 'bank' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-700'
                              }`}>
                              {payment.method === 'm-pesa' ? '📱 M-Pesa' :
                                payment.method === 'cash' ? '💵 Cash' :
                                  payment.method === 'bank' ? '🏦 Bank' :
                                    payment.method || 'Cash'}
                            </span>
                            <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">
                              {payment.date ? new Date(payment.date).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                          <span className="font-bold text-xs sm:text-sm text-gray-800 whitespace-nowrap">
                            KES {payment.amount?.toLocaleString() || 0}
                          </span>
                        </div>
                        {payment.note && (
                          <p className="text-[9px] sm:text-[10px] text-gray-400 mt-1 truncate">📝 {payment.note}</p>
                        )}
                        {payment.receivedBy && (
                          <p className="text-[8px] sm:text-[9px] text-gray-400 mt-0.5">
                            Received By: {payment.receivedBy}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <DollarSign className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm text-gray-400">No payments recorded yet</p>
                    <p className="text-[10px] sm:text-xs text-gray-300">Click "Record Payment" to add one</p>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="space-y-2 pt-2">
                {(selectedOrderForHistory.balance || 0) > 0 && (isAdminOwner || isSales) && (
                  <button
                    onClick={() => {
                      setShowPaymentHistoryModal(false);
                      handleRecordPayment(selectedOrderForHistory.id);
                    }}
                    className="w-full py-2.5 sm:py-3 bg-linear-to-r from-green-500 to-green-600 text-white rounded-xl text-sm font-medium hover:from-green-600 hover:to-green-700 transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <DollarSign className="w-4 h-4" /> Record Payment
                  </button>
                )}

                <button
                  onClick={() => setShowPaymentHistoryModal(false)}
                  className="w-full py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ✅ RECEIPT MODAL */}
{showReceiptModal && selectedReceipt && activeView === 'workbench' && (
  <ReceiptModal
    isOpen={showReceiptModal}
    onClose={() => {
      setShowReceiptModal(false);
      setSelectedReceipt(null);
    }}
    receipt={selectedReceipt}
    user={user}
    // onRecordPayment={(orderId) => {
    //   setShowReceiptModal(false);
    //   handleRecordPayment(orderId);
    // }}
    // isAdminOwner={isAdminOwner}
    // onEdit={(orderId) => {
    //   setShowReceiptModal(false);
    //   handleEditOrder(orderId);
    // }}
    // onDelete={(orderId) => {
    //   setShowReceiptModal(false);
    //   handleDeleteOrder(orderId);
    // }}
  />
)}
    </div>
  );
};