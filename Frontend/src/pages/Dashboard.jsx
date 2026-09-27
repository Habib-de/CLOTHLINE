import React, { useState, useEffect } from 'react';
import { 
  Calendar, CreditCard, Clock, Star, Image as ImageIcon, 
  Upload, PlusCircle, TrendingUp, Users, ShoppingBag,
  ArrowRight, Activity, Zap, Layers, Scissors, User,
  CheckCircle, XCircle, UserCheck, UserPlus, Shield
} from 'lucide-react';
import { orderService, suitService, userService, rentalService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Small Stat Card Component
const StatCard = ({ value, label, icon, color, bgColor, subtitle, subtitleColor = 'text-gray-400' }) => (
  <div className="bg-white p-2 sm:p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group">
    <div className="flex items-center justify-between gap-1">
      <div className="min-w-0 flex-1">
        <p className="text-[7px] sm:text-[10px] font-medium text-gray-400 uppercase tracking-wider leading-tight">{label}</p>
        <p className="text-xs sm:text-xl font-bold text-gray-800 mt-0.5">{value.toLocaleString()}</p>
        {subtitle && (
          <p className={`text-[7px] sm:text-[10px] font-medium ${subtitleColor} leading-tight mt-0.5 truncate`}>
            {subtitle}
          </p>
        )}
      </div>
      <div className={`${bgColor} p-1 sm:p-2 rounded-lg group-hover:scale-110 transition-transform duration-300 shrink-0`}>
        {icon}
      </div>
    </div>
  </div>
);

// Small Quick Action Card
const QuickAction = ({ icon, label, onClick, color }) => (
  <button
    onClick={onClick}
    className={`${color} p-2.5 sm:p-3 rounded-xl text-white hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2 sm:gap-3 group w-full text-left`}
  >
    <div className="p-1 sm:p-1.5 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <div className="flex-1 text-left min-w-0">
      <p className="font-semibold text-[11px] sm:text-xs truncate">{label}</p>
      <p className="text-[9px] sm:text-[10px] opacity-80">Click to start</p>
    </div>
    <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
  </button>
);

// Pending Users Card - Single unified component
const PendingUsersCard = ({ pendingUsers, onActivate, onReject, userRole }) => {
  if (pendingUsers.length === 0) return null;

  const isAdmin = userRole === 'ADMIN';
  const title = isAdmin ? '📋 Pending User Approvals' : '👥 Staff Activation Requests';

  return (
    <div className="bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-2 sm:p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-1.5 sm:gap-3">
          <div className="bg-amber-100 p-1 sm:p-2 rounded-lg shrink-0">
            {isAdmin ? <Shield className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-amber-600" /> : <Users className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-amber-600" />}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-800 text-[11px] sm:text-sm">{title}</h3>
          </div>
        </div>
      </div>
      <div className="mt-2 sm:mt-3 space-y-1">
        {pendingUsers.slice(0, 3).map((user, index) => (
          <div key={user.id || index} className="bg-white/80 backdrop-blur-sm rounded-lg p-1 sm:p-2 flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              <div className="w-5 h-5 sm:w-8 sm:h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <User className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-800 text-[10px] sm:text-xs truncate">{user.name}</p>
                <p className="text-[8px] sm:text-[10px] text-gray-500 truncate">{user.email}</p>
                <div className="flex items-center gap-0.5 mt-0.5 flex-wrap">
                  <span className={`text-[7px] sm:text-[9px] px-1 sm:px-1.5 py-0.5 rounded-full ${
                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                    user.role === 'OWNER' ? 'bg-blue-100 text-blue-700' :
                    user.role === 'SALES' ? 'bg-green-100 text-green-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {user.role}
                  </span>
                  {user.tenantName && (
                    <span className="text-[7px] sm:text-[9px] bg-blue-100 text-blue-700 px-1 sm:px-1.5 py-0.5 rounded-full">
                      {user.tenantName}
                    </span>
                  )}
                  <span className="text-[7px] sm:text-[9px] bg-amber-100 text-amber-700 px-1 sm:px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <Clock className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5" /> Pending
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
              <button
  onClick={() => onActivate(user)}
  className="p-1 sm:px-2.5 sm:py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-[9px] sm:text-[10px] font-medium transition flex items-center gap-0.5 sm:gap-1"
>
  <CheckCircle className="w-3 h-3 sm:w-3 sm:h-3" /> <span className="text-[8px] sm:text-[10px]">Activate</span>
</button>
<button
  onClick={() => onReject(user)}
  className="p-1 sm:px-2.5 sm:py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[9px] sm:text-[10px] font-medium transition flex items-center gap-0.5 sm:gap-1"
>
  <XCircle className="w-3 h-3 sm:w-3 sm:h-3" /> <span className="text-[8px] sm:text-[10px]">Reject</span>
</button>
            </div>
          </div>
        ))}
        {pendingUsers.length > 3 && (
          <p className="text-[8px] sm:text-[10px] text-gray-400 text-center">
            +{pendingUsers.length - 3} more pending requests
          </p>
        )}
      </div>
    </div>
  );
};

// Featured Suits Component - Reusable for all roles
// Featured Suits Component - Reusable for all roles
const FeaturedSuitsSection = ({ allSuits, openSuitDetail, setActiveView }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 shadow-sm">
    <div className="flex justify-between items-center mb-2 sm:mb-3">
      <div>
        <h3 className="font-semibold text-gray-800 text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2">
          <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
          Featured Suits
        </h3>
      </div>
      <button onClick={() => setActiveView('gallery')} className="text-[10px] sm:text-xs text-gray-600 hover:text-gray-800 font-medium flex items-center gap-0.5">
        See all <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
      </button>
    </div>
    
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-3">
      {allSuits.slice(0, 4).map(s => (
        <div 
          key={s.id} 
          onClick={() => openSuitDetail(s.id)} 
          className="group bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer"
        >
          <div 
            className="w-full aspect-[4/3] relative overflow-hidden"
            style={{
              background: s.imageUrls?.[0] 
                ? `linear-gradient(135deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.05) 100%)`
                : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'
            }}
          >
            {s.imageUrls?.[0] ? (
              <img 
                src={s.imageUrls[0]} 
                alt={s.name} 
                className="w-full h-auto object-contain scale-100 group-hover:scale-125 transition-transform duration-700"
                style={{ transformOrigin: 'center center' }}
              />
            ) : (
              <div className="w-full aspect-[4/3] flex items-center justify-center bg-gray-50">
                <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300" />
              </div>
            )}

            {s.imageUrls?.filter(img => img).length > 1 && (
              <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm text-white text-[7px] sm:text-[8px] px-1 py-0.5 rounded-full flex items-center gap-0.5 z-10">
                <ImageIcon className="w-1.5 h-1.5 sm:w-2 sm:h-2" />
                {s.imageUrls.filter(img => img).length}
              </div>
            )}
          </div>

          <div className="p-1.5 sm:p-2.5">
            <p className="font-semibold text-gray-800 text-[9px] sm:text-sm group-hover:text-rose-600 transition-colors line-clamp-1">
              {s.name}
            </p>
            <p className="text-[7px] sm:text-[10px] text-gray-400 truncate mt-0.5">
              {s.detail || 'Classic suit'}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const Dashboard = ({ 
  suits: propSuits, 
  records: propRecords,
  filteredRecords,
  openAddSuit, 
  openSuitDetail, 
  setActiveView, 
  user,
  isAdminOwner,
  isTailor,
  isSales
}) => {
  const { user: authUser } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [allSuits, setAllSuits] = useState([]);
  const [allRentals, setAllRentals] = useState([]);  
  const [loading, setLoading] = useState(true);
  const [pendingUsers, setPendingUsers] = useState([]);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 18 ? 'Good Afternoon' : 'Good Evening';

  // ============================================================
  // LOAD DATA FROM API
  // ============================================================
  const loadData = async () => {
    setLoading(true);
    try {
      // Load suits
      let suitsData = propSuits;
      if (!suitsData || suitsData.length === 0) {
        suitsData = await suitService.getAllSuits();
      }
      setAllSuits(suitsData || []);

      // Load orders
      let ordersData = propRecords;
      if (!ordersData || ordersData.length === 0) {
        ordersData = await orderService.getAllOrders();
      }
      setAllRecords(ordersData || []);

       // ✅ Load rentals (Admin/Owner/Sales only)
      if (isAdminOwner || isSales) {
        try {
          const rentalsData = await rentalService.getAllRentals();
          const rentalList = Array.isArray(rentalsData)
            ? rentalsData
            : (rentalsData?.content || []);
          setAllRentals(rentalList);
        } catch (e) {
          console.error('Error loading rentals:', e);
          setAllRentals([]);
        }
      }

      // Load users (if Admin/Owner)
      if (isAdminOwner) {
        const usersData = await userService.getAllUsers();
        setAllUsers(usersData || []);
        
        // Filter pending users
        const pending = usersData.filter(u => 
          u.status === 'PENDING' && 
          (isAdminOwner ? u.role !== 'ADMIN' : (u.role === 'SALES' || u.role === 'TAILOR'))
        );
        setPendingUsers(pending || []);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Fallback to props or empty arrays
      setAllSuits(propSuits || []);
      setAllRecords(propRecords || []);
      setPendingUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ============================================================
  // ACTIVATION HANDLERS (Uses API) - WITH TOAST
  // ============================================================
  const handleActivateUser = async (userToActivate) => {
    try {
      const result = await userService.activateUser(userToActivate.id);
      if (result.success) {
        toast.success(`✅ ${userToActivate.name} activated successfully!`);
        loadData();
      } else {
        toast.error(`❌ Failed to activate ${userToActivate.name}: ${result.error}`);
      }
    } catch (error) {
      toast.error(`❌ Error activating user: ${error.message}`);
    }
  };

  const handleRejectUser = async (userToReject) => {
    if (!window.confirm(`Reject ${userToReject.name}?`)) return;
    try {
      const result = await userService.deleteUser(userToReject.id);
      if (result.success) {
        toast.success(`🗑️ ${userToReject.name} rejected and removed`);
        loadData();
      } else {
        toast.error(`❌ Failed to reject user: ${result.error}`);
      }
    } catch (error) {
      toast.error(`❌ Error rejecting user: ${error.message}`);
    }
  };

  // ============================================================
  // TAILOR VIEW
  // ============================================================
  if (isTailor) {
    const tailorOrders = allRecords.filter(r => r.tailorEmail === authUser?.email);
    const totalAssigned = tailorOrders.length;
    const completedOrders = tailorOrders.filter(r => r.status === 'COMPLETED').length;
    const inProgressOrders = tailorOrders.filter(r => r.status === 'IN_PROGRESS').length;
    const pendingOrders = tailorOrders.filter(r => r.status === 'PENDING').length;

    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="text-xs sm:text-lg font-bold text-gray-800 leading-tight truncate">
                {greeting}, {authUser?.name || 'Tailor'}!
              </h2>
              <p className="text-[9px] sm:text-xs text-gray-500 leading-tight truncate">
                Your assigned orders are ready
              </p>
            </div>
            <div className="bg-gray-50 p-1.5 sm:p-2 rounded-xl shrink-0">
              <Scissors className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard value={totalAssigned} label="Assigned" icon={<ShoppingBag className="w-4 h-4 text-blue-600" />} bgColor="bg-blue-50" />
          <StatCard value={pendingOrders} label="Pending" icon={<Clock className="w-4 h-4 text-amber-600" />} bgColor="bg-amber-50" />
          <StatCard value={inProgressOrders} label="In Progress" icon={<Activity className="w-4 h-4 text-purple-600" />} bgColor="bg-purple-50" />
          <StatCard value={completedOrders} label="Completed" icon={<Star className="w-4 h-4 text-emerald-600" />} bgColor="bg-emerald-50" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <QuickAction 
            icon={<Layers className="w-4 h-4" />} 
            label="View My Orders" 
            onClick={() => setActiveView('workbench')}
            color="bg-linear-to-r from-gray-700 to-gray-800" 
          />
          <QuickAction 
            icon={<ImageIcon className="w-4 h-4" />} 
            label="View Gallery" 
            onClick={() => setActiveView('gallery')} 
            color="bg-linear-to-r from-gray-600 to-gray-700" 
          />
        </div>

        <FeaturedSuitsSection 
          allSuits={allSuits} 
          openSuitDetail={openSuitDetail} 
          setActiveView={setActiveView} 
        />
      </div>
    );
  }

  // ============================================================
  // SALES VIEW
  // ============================================================
  if (isSales) {
    const totalOrders = allRecords.length;
    const completedOrders = allRecords.filter(r => r.status === 'COMPLETED').length;
    const totalRevenue = allRecords.reduce((sum, r) => sum + (r.total || 0), 0);

    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="text-xs sm:text-lg font-bold text-gray-800 leading-tight truncate">
                {greeting}, {authUser?.name || 'Sales'}!
              </h2>
              <p className="text-[9px] sm:text-xs text-gray-500 leading-tight truncate">
                Track sales performance
              </p>
            </div>
            <div className="bg-gray-50 p-1.5 sm:p-2 rounded-xl shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <StatCard value={totalOrders} label="Total Orders" icon={<ShoppingBag className="w-4 h-4 text-blue-600" />} bgColor="bg-blue-50" />
          <StatCard value={completedOrders} label="Completed" icon={<Star className="w-4 h-4 text-emerald-600" />} bgColor="bg-emerald-50" />
          {/* <StatCard value={totalRevenue} label="Revenue (KES)" icon={<CreditCard className="w-4 h-4 text-purple-600" />} bgColor="bg-purple-50" /> */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <QuickAction 
            icon={<Layers className="w-4 h-4" />} 
            label="View All Orders" 
            onClick={() => setActiveView('workbench')}
            color="bg-linear-to-r from-gray-700 to-gray-800" 
          />
          <QuickAction 
            icon={<ImageIcon className="w-4 h-4" />} 
            label="View Gallery" 
            onClick={() => setActiveView('gallery')} 
            color="bg-linear-to-r from-gray-600 to-gray-700" 
          />
        </div>

        <FeaturedSuitsSection 
          allSuits={allSuits} 
          openSuitDetail={openSuitDetail} 
          setActiveView={setActiveView} 
        />
      </div>
    );
  }

  // ============================================================
  // ADMIN / OWNER VIEW
  // ============================================================
  const totalSuits = allSuits.length;

  // ✅ COMBINED: orders + rentals
  const totalOrdersCombined = allRecords.length + allRentals.length;

  const orderRevenue = allRecords.reduce((s, r) => s + (r.total || 0), 0);
  const rentalRevenue = allRentals.reduce((s, r) => s + (r.totalAmount || 0), 0);
  const totalRevenue = orderRevenue + rentalRevenue;

  const orderPending = allRecords.filter(r => (r.balance || 0) > 0).length;
  const rentalPending = allRentals.filter(r => (r.remainingBalance || 0) > 0).length;
  const pendingOrdersCount = orderPending + rentalPending;

  const isAdmin = authUser?.role === 'ADMIN';
  const isOwner = authUser?.role === 'OWNER';
  const pendingUsersToShow = isAdmin ? pendingUsers : (isOwner ? pendingUsers : []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-xs sm:text-lg font-bold text-gray-800 leading-tight truncate">
              {greeting}, {authUser?.name || 'Admin'}!
            </h2>
            <p className="text-[9px] sm:text-xs text-gray-500 leading-tight truncate">
              Welcome back to KIIN·CLOTHELINE
            </p>
          </div>
          <div className="bg-gray-50 p-1.5 sm:p-2 rounded-xl shrink-0">
            <Activity className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" />
          </div>
        </div>
      </div>

      {/* ✅ PENDING USERS CARD - MOVED HERE (BEFORE Stats) */}
      {pendingUsersToShow.length > 0 && (
        <PendingUsersCard
          pendingUsers={pendingUsersToShow}
          onActivate={handleActivateUser}
          onReject={handleRejectUser}
          userRole={authUser?.role}
        />
      )}

            {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard 
          value={totalOrdersCombined} 
          label="Orders & Rentals" 
          subtitle={`${allRecords.length} order${allRecords.length !== 1 ? 's' : ''} · ${allRentals.length} rental${allRentals.length !== 1 ? 's' : ''}`}
          subtitleColor="text-blue-500"
          icon={<ShoppingBag className="w-4 h-4 text-blue-600" />} 
          bgColor="bg-blue-50" 
        />
        <StatCard 
          value={totalSuits} 
          label="Suits" 
          subtitle="In catalog"
          subtitleColor="text-purple-400"
          icon={<Layers className="w-4 h-4 text-purple-600" />} 
          bgColor="bg-purple-50" 
        />
        <StatCard 
          value={pendingOrdersCount} 
          label="Pending" 
          subtitle={`${orderPending} order${orderPending !== 1 ? 's' : ''} · ${rentalPending} rental${rentalPending !== 1 ? 's' : ''}`}
          subtitleColor="text-amber-500"
          icon={<Clock className="w-4 h-4 text-amber-600" />} 
          bgColor="bg-amber-50" 
        />
        <StatCard 
          value={totalRevenue} 
          label="Total Revenue" 
          subtitle={`KES ${orderRevenue.toLocaleString()} + ${rentalRevenue.toLocaleString()}`}
          subtitleColor="text-emerald-500"
          icon={<CreditCard className="w-4 h-4 text-emerald-600" />} 
          bgColor="bg-emerald-50" 
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <QuickAction icon={<PlusCircle className="w-4 h-4" />} label="New Order" onClick={() => setActiveView('workbench')} color="bg-linear-to-r from-gray-700 to-gray-800" />
        <QuickAction icon={<Upload className="w-4 h-4" />} label="Add Suit" onClick={openAddSuit} color="bg-linear-to-r from-gray-600 to-gray-700" />
        <QuickAction icon={<ImageIcon className="w-4 h-4" />} label="View Gallery" onClick={() => setActiveView('gallery')} color="bg-linear-to-r from-gray-700 to-gray-800" />
      </div>

      {/* Featured Suits */}
      <FeaturedSuitsSection 
        allSuits={allSuits} 
        openSuitDetail={openSuitDetail} 
        setActiveView={setActiveView} 
      />
    </div>
  );
};