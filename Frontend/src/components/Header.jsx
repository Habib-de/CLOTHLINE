// Header.jsx
import React, { useState } from 'react';
import { 
  Scissors, LogOut, User, Settings, 
  Bell, Search, ChevronDown,
  LayoutDashboard, Image as ImageIcon,
  Users, Shield, Layers, UserCircle, ShoppingBag, Calendar    
} from 'lucide-react';

import { NotificationBell } from './NotificationBell';
import { useAuth } from '../context/AuthContext';

export const Header = ({ user, setActiveView, activeView }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { logout } = useAuth();
  
  // ✅ FIXED: Use uppercase for role comparison (backend returns uppercase)
  const isTailor = user?.role === 'TAILOR';
  const isClient = user?.role === 'CLIENT';
  const isSales = user?.role === 'SALES';
  const isAdmin = user?.role === 'ADMIN';
  const isOwner = user?.role === 'OWNER';

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem('kiin_activeView');
    window.location.reload();
};

  // Navigation items - Profile removed from nav, User Management added for Admin/Owner
  const getNavItems = () => {
    const items = [
      { 
        id: 'dashboard', 
        icon: LayoutDashboard, 
        label: 'Home',
      },
      { 
        id: 'workbench', 
        icon: Layers, 
        label: 'Workbench',
      },
      { 
        id: 'gallery', 
        icon: ShoppingBag, 
        label: 'Store',
      },
    ];

    // Add Rentals for Admin, Owner, and Sales
    if (isAdmin || isOwner || isSales) {
      items.push({ 
        id: 'suitRentals', 
        icon: Calendar, 
        label: 'Rentals',
      });
    }
    
    // Add User Management for Admin/Owner
    if (isAdmin || isOwner) {
      items.push({ 
        id: 'userManagement', 
        icon: Users, 
        label: 'Users',
      });
    }

     if (isTailor || isSales) {
    items.push({ 
      id: 'profile', 
      icon: UserCircle, 
      label: 'Profile',
    });
  }
    
    return items;
  };

  const navItems = getNavItems();

  // Desktop Navigation
  const DesktopNav = () => (
    <nav className="hidden lg:flex items-center gap-0.5">
      {navItems.map((item) => {
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 ${
              isActive 
                ? 'text-rose-600 bg-rose-50' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {isActive && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-rose-500 to-rose-600 rounded-full"></div>
            )}
            
            <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}>
              <item.icon className="w-4 h-4" />
            </div>
            
            <span className={`text-sm font-medium transition-colors duration-300`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );

  // User Menu Dropdown Items - Profile back in dropdown
  const UserMenuItems = () => (
    <>
      {/* User Info - Clickable to Profile */}
      <button 
        className="w-full px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition text-left"
        onClick={() => {
          setShowUserMenu(false);
          setActiveView('profile');
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-rose-500 to-rose-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
              <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                {user?.role}
              </span>
              {user?.role === 'OWNER' && user?.tenantName && (
                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {user?.tenantName}
                </span>
              )}
              {user?.country && (
                <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {user?.country}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>
      
      {/* Profile - Direct link - HIDE for TAILOR and SALES */}
{!isTailor && !isSales && (
  <button 
    className="w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-3 transition border-b border-gray-100"
    onClick={() => {
      setShowUserMenu(false);
      setActiveView('profile');
    }}
  >
    <UserCircle className="w-4 h-4 text-rose-500" /> 
    <span>My Profile</span>
    <span className="ml-auto text-[10px] text-gray-400">View & Edit</span>
  </button>
)}
      
      {/* Settings */}
      <button 
        className="w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-3 transition border-b border-gray-100"
        onClick={() => {
          setShowUserMenu(false);
          setActiveView('settings');
        }}
      >
        <Settings className="w-4 h-4 text-gray-500" /> 
        <span>Settings</span>
        <span className="ml-auto text-[10px] text-gray-400">Preferences</span>
      </button>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition"
      >
        <LogOut className="w-4 h-4" /> 
        <span>Logout</span>
        <span className="ml-auto text-[10px] text-gray-400">⌘Q</span>
      </button>
    </>
  );

  // Simplified header for clients
  if (isClient) {
    return (
      <header 
        className="bg-white shadow-sm sticky top-0 z-50 mx-2 mt-2 rounded-2xl"
        style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}
      >
        <div className="max-w-7xl mx-auto px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-linear-to-br from-rose-500 to-rose-600 p-1.5 rounded-lg shadow-lg shadow-rose-500/30">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <div>
              <img 
                src="/logo.png" 
                alt="KIIN CLOTHELIN" 
                className="h-6 w-auto object-contain"
              />
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap">
                  <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs transition whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </header>
    );
  }

  // Full header for Admin/Owner/Tailor/Sales
  return (
    <header 
       className="sticky top-0 z-50 backdrop-blur-xl"
  style={{ 
    background: 'linear-gradient(135deg, rgba(250, 247, 255, 0.85) 0%, rgba(245, 237, 255, 0.85) 50%, rgba(250, 247, 255, 0.85) 100%)',
    borderBottom: '1px solid rgba(139, 92, 246, 0.12)',
    boxShadow: '0 4px 30px rgba(139, 92, 246, 0.08), inset 0 1px 0 rgba(255,255,255,0.6)'
  }}
    >
       <div className="h-0.5 w-1/2 mx-auto bg-gradient-to-r from-transparent via-rose-400/60 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 lg:px-4">
        {/* MOBILE VIEW - COMPACT with Brand Name & Tagline */}
        <div className="lg:hidden flex items-center justify-between py-3 gap-2">
          {/* Brand - Logo + Business Name + Tagline */}
          <div className="flex items-center gap-1.5 cursor-pointer min-w-0 flex-1 overflow-hidden" onClick={() => setActiveView('dashboard')}>
            <img 
              src="/logo.png" 
              alt="KIIN CLOTHELIN" 
              className="h-9 w-auto object-contain shrink-0"
            />
            <div className="border-l border-gray-300 pl-1.5 min-w-0 overflow-hidden">
              <div 
  className="font-extrabold tracking-wide leading-tight whitespace-nowrap"
  style={{ 
    fontSize: 'clamp(8px, 2.5vw, 11px)',  // ← CHANGED THIS
    color: '#1a1a2e',
    letterSpacing: '0.5px',
  }}
>
  <span style={{ 
    fontWeight: '800',
    textShadow: '0 1px 2px rgba(0,0,0,0.05)',
    position: 'relative',
  }}>
    KIIN-CLOTHLINE
    {/* Superscript KE */}
    <sup 
      style={{
        fontSize: 'clamp(4px, 1.5vw, 7px)',
        fontWeight: '700',
        color: '#e11d48',
        position: 'relative',
        top: '-0.8em',
        marginLeft: '1px',
        letterSpacing: '0.2px',
      }}
    >
      KE
    </sup>
  </span>
</div>
              <div 
                className="font-bold text-blue-500 leading-tight whitespace-nowrap"
                style={{ fontSize: 'clamp(8px, 2.4vw, 9px)' }}
              >
                Your Complete Suit Destination
              </div>
            </div>
          </div>

          {/* Mobile Actions - COMPACT */}
          <div className="flex items-center gap-1.5 h-9 sm:h-10 shrink-0">
            {/* Notification Bell */}
            <NotificationBell user={user} setActiveView={setActiveView} />
            
            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1 hover:bg-slate-100 rounded-lg px-2 py-1 sm:py-1.5 transition text-slate-600 h-9 sm:h-10"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-linear-to-br from-rose-500 to-rose-600 flex items-center justify-center text-[11px] sm:text-[13px] font-bold text-white">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 overflow-hidden z-50">
                  <UserMenuItems />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DESKTOP VIEW - UNCHANGED */}
        <div className="hidden lg:flex items-center justify-between py-2 gap-8">
          {/* Brand - Logo + Business Name + Tagline */}
          <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => setActiveView('dashboard')}>
            <img 
              src="/logo.png" 
              alt="KIIN CLOTHELIN" 
              className="h-12 w-auto object-contain"
            />
            <div className="border-l border-gray-300 pl-3">
              <div className="text-base font-extrabold tracking-wide leading-tight">
    KIIN-CLOTHLINE{' '}
    <span
      style={{
        background: 'linear-gradient(180deg, #000000 0%, #000000 25%, #BB0000 25%, #BB0000 50%, #006600 50%, #006600 75%, #FFFFFF 75%, #FFFFFF 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      KENYA
    </span>
  </div>
              <div className="text-[10px] font-semibold text-gray-500 leading-tight">
                Your Complete Suit Destination
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <DesktopNav />

          {/* Search - Desktop only */}
          {/* <div className="flex items-center bg-slate-100 rounded-xl px-3 py-1.5 border border-slate-200 flex-1 max-w-xs mx-4">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-none outline-none text-sm text-slate-700 placeholder-slate-400 w-full px-2"
            />
            <kbd className="text-[10px] text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded whitespace-nowrap">⌘K</kbd>
          </div> */}

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Notifications */}
            <NotificationBell user={user} setActiveView={setActiveView} />

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 hover:bg-slate-100 rounded-xl px-3 py-1.5 transition text-slate-600"
              >
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-rose-500 to-rose-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="hidden xl:block text-left min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{user?.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.role}</p>
                </div>
                <ChevronDown className="w-4 h-4 shrink-0" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-1 overflow-hidden z-50">
                  <UserMenuItems />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};