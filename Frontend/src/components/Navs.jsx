// Navs.jsx
import React from 'react';
import { 
  LayoutDashboard, 
  Layers,
  Image as ImageIcon,
  Users,
  UserCircle,
  ShoppingBag,
  Calendar  // ✅ Add Calendar icon for Rentals
} from 'lucide-react';

export const Navs = ({ activeView, setActiveView, user }) => {
  // ✅ FIXED: Use uppercase for role comparison (backend returns uppercase)
  const isTailor = user?.role === 'TAILOR';
  const isSales = user?.role === 'SALES';
  const isAdmin = user?.role === 'ADMIN';
  const isOwner = user?.role === 'OWNER';
  const isClient = user?.role === 'CLIENT';

  // Get navigation items based on user role
  const getNavItems = () => {
    // For Admin and Owner - Home, Workbench, Store, Rentals, Users
    if (isAdmin || isOwner) {
      return [
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
        { 
          id: 'suitRentals',   // ✅ ADD RENTALS
          icon: Calendar, 
          label: 'Rentals',
        },
        { 
          id: 'userManagement', 
          icon: Users, 
          label: 'Users',
        },
      ];
    }

    // For Sales - Home, Workbench, Store, Rentals (NO Users)
    if (isSales) {
      return [
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
        { 
          id: 'suitRentals',   // ✅ ADD RENTALS for Sales
          icon: Calendar, 
          label: 'Rentals',
        },

        { id: 'profile', 
          icon: UserCircle, 
          label: 'Profile' },
      ];
    }

    // For Tailor - Home, Workbench, Store (NO Rentals, NO Users)
    if (isTailor) {
      return [
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

        { id: 'profile', 
          icon: UserCircle, 
          label: 'Profile' }, 
      ];
    }

    // For Clients - Home, Store, Profile (no workbench)
    if (isClient) {
      return [
        { 
          id: 'dashboard', 
          icon: LayoutDashboard, 
          label: 'Home',
        },
        { 
          id: 'gallery', 
          icon: ShoppingBag, 
          label: 'Store',
        },
        { 
          id: 'profile', 
          icon: UserCircle, 
          label: 'Profile',
        },
      ];
    }

    // Default fallback
    return [
      { 
        id: 'dashboard', 
        icon: LayoutDashboard, 
        label: 'Home',
      },
      { 
        id: 'profile', 
        icon: UserCircle, 
        label: 'Profile',
      },
    ];
  };

  const navItems = getNavItems();

  // Mobile Bottom Navigation - Fixed at bottom with high z-index
  const MobileNav = () => (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white flex justify-around items-center shadow-lg"
      style={{
        paddingTop: '8px',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
        minHeight: '70px',  // ✅ Made taller like Facebook
        zIndex: 9999,
        backgroundColor: 'white',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        borderTop: '1px solid rgba(0, 0, 0, 0.08)'
      }}
    >
      {navItems.map((item) => {
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`relative flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-2xl transition-all duration-300 min-w-0 flex-1 ${
              isActive 
                ? 'text-rose-600' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
            style={{
              paddingTop: '6px',
              paddingBottom: '6px',
            }}
          >
            {isActive && (
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-linear-to-r from-rose-500 to-rose-600 rounded-full"></div>
            )}
            
            <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}>
              <item.icon className="w-[24px] h-[24px]" strokeWidth={2.5} />  {/* ✅ Bigger icon */}
            </div>
            
            <span className={`text-[10px] font-medium transition-colors duration-300 truncate max-w-full ${
              isActive ? 'text-rose-600' : 'text-slate-400'
            }`}>  {/* ✅ Bigger text */}
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );

  return <MobileNav />;
};