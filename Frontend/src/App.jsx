import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { Header } from './components/Header';
import { Navs } from './components/Navs';
import { Toast } from './components/Toast';
import { Dashboard } from './pages/Dashboard';
import { Gallery } from './pages/Gallery';
import { Workbench } from './pages/Workbench';
import { SuitModal } from './components/SuitModal';
import { SuitDetailModal } from './components/SuitDetailModal';
import { ReceiptModal } from './components/ReceiptModal';
import { PaymentModal } from './components/PaymentModal';
import { ClientCatalog } from './pages/ClientCatalog';
import { Profile } from './pages/Profile';
import { SettingsPage } from './pages/SettingsPage';
import { UserManagement } from './pages/UserManagement';
import { NotificationsPage } from './pages/NotificationsPage';
import { SuitRentals } from './pages/SuitRentals'; 
import { Customers } from './pages/Customers';
import { Toaster } from 'react-hot-toast';
import { XCircle } from 'lucide-react';
import { SettingsProvider } from './context/SettingsContext';
import { NotificationProvider } from './context/NotificationContext';
import { orderService, suitService, rentalService } from './services/api';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [toast, setToast] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  // ===== PERSIST ACTIVE VIEW IN LOCALSTORAGE =====
  const getStoredView = () => {
    const stored = localStorage.getItem('kiin_activeView');
    if (stored && user) {
      const validViews = ['dashboard', 'workbench', 'gallery', 'profile', 'settings', 'userManagement', 'notifications', 'suitRentals', 'customers'];
      if (validViews.includes(stored)) {
        return stored;
      }
    }
    return 'dashboard';
  };

  const [activeView, setActiveView] = useState(getStoredView);
  const [authPage, setAuthPage] = useState('login');
  
  // ===== DATA STATE =====
  const [records, setRecords] = useState([]);
  const [suits, setSuits] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // ===== UI STATE =====
  const [selectedSuit, setSelectedSuit] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showSuitModal, setShowSuitModal] = useState(false);
  const [showSuitDetail, setShowSuitDetail] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState(null); 
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  const [editSuitId, setEditSuitId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // ===== SUIT FORM =====
  const [suitForm, setSuitForm] = useState({ 
    name: '', 
    detail: '', 
    category: 'FORMAL',
    suitType: 'Full Suit',
    color: '#1a1a2e',
    price: 8500,
    images: ['', '', ''] 
  });

  // ===== RECEIPT FORM =====
  const [receiptForm, setReceiptForm] = useState({
    recNo: '',
    date: new Date().toISOString().split('T')[0],
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

  // ============================================================
  // LOAD DATA FROM BACKEND
  // ============================================================
  const loadData = async () => {
  if (!user) return;
  
  setLoadingData(true);
  try {
    // ✅ Check if user is CLIENT or Guest
    const isClientRole = user?.role === 'CLIENT' || user?.id === 'guest-client' || user?.id?.startsWith('guest-client');
    
    // ✅ For CLIENT/Guest - ONLY load suits (they can view catalog)
    if (isClientRole) {
      try {
        const suitList = await suitService.getAllSuits();
        setSuits(suitList || []);
        console.log(`✅ Loaded ${suitList.length} suits for ${user?.role}`);
      } catch (error) {
        console.error('Error loading suits:', error);
        setSuits([]);
      }
      setRecords([]);
      setRentals([]);
      setLoadingData(false);
      return;
    }
    
    // ✅ For STAFF (ADMIN, OWNER, SALES, TAILOR) - Load all data
    // Load orders
    const orders = await orderService.getAllOrders();
    setRecords(orders || []);
    
    // Load suits
    const suitList = await suitService.getAllSuits();
    setSuits(suitList || []);
    
    // Load rentals (if user has permission)
    const canAccessRentals = user?.role === 'ADMIN' || user?.role === 'OWNER' || user?.role === 'SALES';
    
    if (canAccessRentals) {
      try {
        const rentalList = await rentalService.getAllRentals();
        setRentals(rentalList || []);
      } catch (e) {
        console.error('Error loading rentals:', e);
        setRentals([]);
      }
    } else {
      console.log(`🚫 User role "${user?.role}" does not have access to rentals`);
      setRentals([]);
    }
    
  } catch (error) {
    console.error('Error loading data:', error);
    showToast('Failed to load data', 'error');
  } finally {
    setLoadingData(false);
  }
};

  // ============================================================
  // RELOAD DATA (for after CRUD operations)
  // ============================================================
  const reloadData = () => {
    loadData();
  };

  // Load data when user logs in
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // ============================================================
  // SAVE ACTIVE VIEW TO LOCALSTORAGE
  // ============================================================
  const handleSetActiveView = (view) => {
    setActiveView(view);
    localStorage.setItem('kiin_activeView', view);
  };

  // ============================================================
  // TOAST
  // ============================================================
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const hideToast = () => setToast(null);

  // ============================================================
  // ROLE CHECKS
  // ============================================================
  const isAdminOwner = user?.role === 'ADMIN' || user?.role === 'OWNER';
  const isTailor = user?.role === 'TAILOR';
  const isSales = user?.role === 'SALES';
  const isClient = user?.role === 'CLIENT';

  // ============================================================
  // SUIT FUNCTIONS
  // ============================================================
  const openSuitDetail = (id) => {
    const suit = suits.find(s => s.id === id);
    if (suit) { 
      setSelectedSuit(suit); 
      setShowSuitDetail(true); 
    }
  };

  const openAddSuit = () => {
    if (!isAdminOwner) { showToast('Access denied', 'error'); return; }
    setEditSuitId(null);
    setSuitForm({ 
      name: '', 
      detail: '', 
      category: 'FORMAL',
      suitType: 'Full Suit',
      color: '#1a1a2e',
      price: 8500,
      images: ['', '', ''] 
    });
    setShowSuitModal(true);
  };

  const openEditSuit = (id) => {
    if (!isAdminOwner) { 
      showToast('Access denied', 'error'); 
      return; 
    }
    
    if (id === null || id === undefined) {
      setEditSuitId(null);
      setSuitForm({ 
        name: '', 
        detail: '', 
        category: 'FORMAL',
        suitType: 'Full Suit',
        color: '#1a1a2e',
        price: 8500,
        images: ['', '', ''] 
      });
      setShowSuitModal(true);
      return;
    }
    
    const suit = suits.find(s => s.id === id);
    if (!suit) {
      showToast('Suit not found', 'error');
      return;
    }
    setEditSuitId(id);
    const images = [...(suit.imageUrls || []), '', '', ''].slice(0, 3);
    setSuitForm({ 
      name: suit.name, 
      detail: suit.detail || '', 
      category: suit.category || 'FORMAL',
      suitType: suit.suitType || 'Full Suit',
      color: suit.color || '#1a1a2e',
      price: suit.price || 8500,
      images 
    });
    setShowSuitModal(true);
  };

  const handleSuitImageUpload = (index, fileOrBase64) => {
  if (!fileOrBase64) return;
  
  // If it's already a base64 string (compressed), use it directly
  if (typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('data:image')) {
    const newImages = [...suitForm.images];
    newImages[index] = fileOrBase64;
    setSuitForm({ ...suitForm, images: newImages });
    return;
  }
  
  // If it's a File object, convert to base64
  const reader = new FileReader();
  reader.onload = (e) => {
    const newImages = [...suitForm.images];
    newImages[index] = e.target.result;
    setSuitForm({ ...suitForm, images: newImages });
  };
  reader.readAsDataURL(fileOrBase64);
};

  const removeSuitImage = (index) => {
    const newImages = [...suitForm.images];
    newImages[index] = '';
    setSuitForm({ ...suitForm, images: newImages });
  };

  const saveSuit = async () => {
    if (!isAdminOwner) { showToast('Access denied', 'error'); return; }
    
    const { name, detail, category, suitType, color, price, images } = suitForm;
    if (!name.trim()) { showToast('Please enter a suit name', 'error'); return; }
    
    const filteredImages = images.filter(img => img && img.length > 0);
    
    const suitData = {
      name: name.trim(),
      detail: detail.trim() || '',
      category: category || 'FORMAL',
      suitType: suitType || 'Full Suit',
      color: color || '#1a1a2e',
      price: price || 8500,
      imageUrls: filteredImages
    };

    try {
      let result;
      if (editSuitId) {
        result = await suitService.updateSuit(editSuitId, suitData);
        if (result.success) {
          showToast('Suit updated successfully! ✅');
          reloadData();
        } else {
          showToast(result.error || 'Update failed', 'error');
        }
      } else {
        result = await suitService.createSuit(suitData);
        if (result.success) {
          showToast('Suit added successfully! ✅');
          reloadData();
        } else {
          showToast(result.error || 'Creation failed', 'error');
        }
      }
    } catch (error) {
      showToast(error.message || 'Operation failed', 'error');
    }
    
    setShowSuitModal(false);
  };

  const deleteSuit = async (id) => {
    if (!isAdminOwner) { showToast('Access denied', 'error'); return; }
    if (!window.confirm('Are you sure you want to delete this suit?')) return;
    
    try {
      const result = await suitService.deleteSuit(id);
      if (result.success) {
        showToast('Suit deleted successfully! 🗑️');
        reloadData();
      } else {
        showToast(result.error || 'Delete failed', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Delete failed', 'error');
    }
  };

  // ============================================================
  // ORDER FUNCTIONS
  // ============================================================
  const deleteReceipt = async (id) => {
  if (!isAdminOwner) { showToast('Only admin/owner can delete', 'error'); return; }
  // window.confirm removed - Workbench handles the confirmation
  
  try {
    const result = await orderService.deleteOrder(id);
    if (result.success) {
      showToast('Order deleted successfully! 🗑️');
      reloadData();
    } else {
      showToast(result.error || 'Delete failed', 'error');
    }
  } catch (error) {
    showToast(error.message || 'Delete failed', 'error');
  }
};

  const viewReceipt = (id) => {
    const r = records.find(x => x.id === id);
    if (r) { 
      setSelectedReceipt(r); 
      setShowReceiptModal(true); 
    }
  };

  const updateOrderStatus = async (id, newStatus) => {
    if (!isTailor && !isAdminOwner) return;
    
    try {
      const result = await orderService.updateOrderStatus(id, newStatus);
      if (result.success) {
        showToast(`Order status updated to ${newStatus}! ✅`);
        reloadData();
      } else {
        showToast(result.error || 'Status update failed', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Status update failed', 'error');
    }
  };

  // ============================================================
  // PAYMENT FUNCTIONS
  // ============================================================
  const handleRecordPaymentFromReceipt = (orderId) => {
    const order = records.find(r => r.id === orderId);
    if (order) {
      setSelectedOrderForPayment(order);
      setShowPaymentModal(true);
      setShowReceiptModal(false);
    }
  };

  // ============================================================
  // STYLE TOGGLE
  // ============================================================
  const toggleStyle = (style) => {
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
    const dep = parseFloat(receiptForm.deposit) || 0;
    const tot = parseFloat(receiptForm.total) || 0;
    setReceiptForm({ ...receiptForm, balance: Math.max(0, tot - dep) });
  };

  // ============================================================
  // GET FILTERED RECORDS
  // ============================================================
  const getFilteredRecords = () => {
    let filtered = records;
    if (isTailor && user?.email) {
      filtered = filtered.filter(r => r.tailorEmail === user.email);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.recNo?.toLowerCase().includes(query) ||
        r.style?.toLowerCase().includes(query) ||
        r.customerName?.toLowerCase().includes(query) ||
        r.tailorEmail?.toLowerCase().includes(query) ||
        r.suitType?.toLowerCase().includes(query)
      );
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => (r.status || 'PENDING') === filterStatus);
    }
    return filtered;
  };

  // ============================================================
  // UPDATE ACTIVE VIEW WHEN USER LOGS IN
  // ============================================================
  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem('kiin_activeView');
      if (stored) {
        const validViews = ['dashboard', 'workbench', 'gallery', 'profile', 'settings', 'userManagement', 'notifications', 'suitRentals', 'customers'];
        if (validViews.includes(stored)) {
          setActiveView(stored);
        }
      }
    }
  }, [user]);

  // ============================================================
  // SET WINDOW HANDLER FOR PAYMENT
  // ============================================================
  useEffect(() => {
    window.onRecordPayment = handleRecordPaymentFromReceipt;
    return () => {
      delete window.onRecordPayment;
    };
  }, [records]);

  // ============================================================
// CHECK FOR RESET TOKEN IN URL
// ============================================================
useEffect(() => {
  // Check if we're on the reset password path with a token
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  
  if (path === '/reset-password' && token) {
    setAuthPage('reset-password');
  }
}, []);

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (loading || (user && loadingData)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <img src="/logo.png" alt="KIIN CLOTHELIN" className="h-20 w-auto object-contain animate-pulse" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // AUTH PAGES (Not logged in)
  // ============================================================
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Toaster position="top-right" />
        
        {/* ✅ Show different content based on authPage */}
        {authPage === 'login' && (
          <LoginPage 
            onSwitchToRegister={() => setAuthPage('register')}
            onForgotPassword={() => setAuthPage('forgot-password')}
            onGuestLogin={() => {
              // ✅ Auto-login as guest client
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
          />
        )}
        {authPage === 'register' && (
          <RegisterPage 
            onSwitchToLogin={() => setAuthPage('login')}
          />
        )}
        {authPage === 'forgot-password' && (
          <ForgotPasswordPage 
            onBackToLogin={() => setAuthPage('login')}
          />
        )}
         {authPage === 'reset-password' && (
        <ResetPasswordPage 
          onBackToLogin={() => setAuthPage('login')}
        />
      )}
      </div>
    );
  }

  // ============================================================
  // CLIENT VIEW
  // ============================================================
  if (isClient) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Toaster position="top-right" />
        <ClientCatalog suits={suits} openSuitDetail={openSuitDetail} user={user} />
      </div>
    );
  }

  const filteredRecords = getFilteredRecords();

  // ============================================================
  // MAIN APP
  // ============================================================
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Toaster position="top-right" />
      {toast && <Toast {...toast} onClose={hideToast} />}
      
      <Header user={user} setActiveView={handleSetActiveView} activeView={activeView} />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 py-5 pb-24 md:pb-5 w-full">
        {activeView === 'dashboard' && (
          <Dashboard 
            suits={suits} 
            records={records}
            filteredRecords={filteredRecords}
            openAddSuit={openAddSuit} 
            openSuitDetail={openSuitDetail} 
            setActiveView={handleSetActiveView} 
            user={user}
            isAdminOwner={isAdminOwner}
            isTailor={isTailor}
            isSales={isSales}
          />
        )}
        
        {activeView === 'gallery' && (
          <Gallery 
            suits={suits} 
            openSuitDetail={openSuitDetail} 
            openEditSuit={openEditSuit} 
            deleteSuit={deleteSuit} 
            user={user}
            isAdminOwner={isAdminOwner}
          />
        )}
        
        {activeView === 'workbench' && (
          <Workbench 
            user={user}
            isAdminOwner={isAdminOwner}
            isTailor={isTailor}
            isSales={isSales}
            activeView={activeView}
            setActiveView={handleSetActiveView}
            openEditReceipt={null}
            deleteReceipt={deleteReceipt}
            receiptForm={receiptForm}
            setReceiptForm={setReceiptForm}
            editingReceipt={null}
            toggleStyle={toggleStyle}
            calcBalance={calcBalance}
            updateOrderStatus={updateOrderStatus}
            records={records}
            setRecords={setRecords}
          />
        )}

        {/* Profile */}
        {activeView === 'profile' && (
          <Profile user={user} setActiveView={handleSetActiveView} />
        )}

        {/* Settings */}
        {activeView === 'settings' && (
          <SettingsPage user={user} setActiveView={handleSetActiveView} />
        )}

        {/* User Management */}
        {activeView === 'userManagement' && (
          <UserManagement user={user} setActiveView={handleSetActiveView} />
        )}

        {/* Notifications */}
        {activeView === 'notifications' && (
          <NotificationsPage setActiveView={handleSetActiveView} />
        )}

        {/* Suit Rentals */}
        {activeView === 'suitRentals' && (
          <SuitRentals 
    setActiveView={handleSetActiveView}
    activeView={activeView}  // ← ADD THIS
  />
          
        )}

                {activeView === 'customers' && (
          <Customers setActiveView={handleSetActiveView}
          records={records}
          rentals={rentals}
             />
        )}
      </main>

      {/* Navs at the bottom */}
      {!isClient && (
        <Navs 
          activeView={activeView} 
          setActiveView={handleSetActiveView} 
          user={user}
          isAdminOwner={isAdminOwner}
          isTailor={isTailor}
          isSales={isSales}
        />
      )}

      {/* Modals */}
      <SuitModal 
        isOpen={showSuitModal}
        onClose={() => setShowSuitModal(false)}
        suitForm={suitForm}
        setSuitForm={setSuitForm}
        editSuitId={editSuitId}
        onSave={saveSuit}
        onImageUpload={handleSuitImageUpload}
        onRemoveImage={removeSuitImage}
        isAdminOwner={isAdminOwner}
      />

      <SuitDetailModal 
        isOpen={showSuitDetail}
        onClose={() => setShowSuitDetail(false)}
        suit={selectedSuit}
        isAdminOwner={isAdminOwner}
        onEdit={openEditSuit}
        onDelete={deleteSuit}
        user={user}
        setFullScreenImage={setFullScreenImage}
      />

      {/* <ReceiptModal 
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        receipt={selectedReceipt}
        user={user}
        isSales={isSales}
      /> */}

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedOrderForPayment(null);
          reloadData();
        }}
        order={selectedOrderForPayment}
        onPaymentComplete={(updatedOrder) => {
          reloadData();
          showToast('Payment recorded successfully!');
        }}
        user={user}
      />

      {fullScreenImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4"
          onClick={() => setFullScreenImage(null)}
        >
          <button
            onClick={() => setFullScreenImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition z-10"
          >
            <XCircle className="w-10 h-10" />
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

const App = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;