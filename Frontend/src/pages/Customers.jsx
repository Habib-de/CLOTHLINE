// src/pages/Customers.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, Search, X, ArrowLeft, Phone, MapPin,
  Package, ChevronRight, Ruler, ShoppingBag,
  Crown, Building2, UserCircle2, Footprints,
  Sparkles, TrendingUp, AlertCircle, Calendar, MessageCircle
} from 'lucide-react';
import { orderService, rentalService } from '../services/api';

// ============================================================
// WHATSAPP ICON (inline SVG)
// ============================================================
const WhatsAppIcon = ({ className = 'w-3 h-3' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

// ============================================================
// TAGS
// ============================================================
const TAGS = {
  VIP:       { label: 'VIP',       icon: Crown,        bg: 'bg-amber-100',  text: 'text-amber-700',  ring: 'ring-amber-200' },
  Corporate: { label: 'Corporate', icon: Building2,    bg: 'bg-blue-100',   text: 'text-blue-700',   ring: 'ring-blue-200' },
  Regular:   { label: 'Regular',   icon: UserCircle2,  bg: 'bg-emerald-100',text: 'text-emerald-700',ring: 'ring-emerald-200' },
  'Walk-in': { label: 'Walk-in',   icon: Footprints,   bg: 'bg-slate-100',  text: 'text-slate-600',  ring: 'ring-slate-200' },
};

const getTag = (totalOrders, totalSpent) => {
  if (totalSpent >= 100000 || totalOrders >= 10) return 'VIP';
  if (totalOrders >= 5) return 'Corporate';
  if (totalOrders >= 2) return 'Regular';
  return 'Walk-in';
};

// Deterministic avatar gradient by name
const AVATAR_GRADIENTS = [
  'from-rose-400 to-rose-600',
  'from-blue-400 to-blue-600',
  'from-emerald-400 to-emerald-600',
  'from-amber-400 to-amber-600',
  'from-purple-400 to-purple-600',
  'from-pink-400 to-pink-600',
  'from-indigo-400 to-indigo-600',
  'from-teal-400 to-teal-600',
];
const getAvatarGradient = (name) => {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = (name.charCodeAt(i) + ((hash << 5) - hash)) | 0;
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
};

const TagChip = ({ tag, small = false }) => {
  const t = TAGS[tag] || TAGS['Walk-in'];
  const Icon = t.icon;
  return (
    <span className={`inline-flex items-center gap-1 ${small ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-0.5 text-[9px] sm:text-[10px]'} rounded-full font-semibold ${t.bg} ${t.text} ring-1 ${t.ring}`}>
      <Icon className={small ? 'w-2 h-2' : 'w-2.5 h-2.5'} />
      {t.label}
    </span>
  );
};

// ============================================================
// HELPERS
// ============================================================
const fmtKES = (n) => `KES ${(n || 0).toLocaleString()}`;

const timeAgo = (d) => {
  if (!d) return 'never';
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

const fmtDate = (d) => {
  if (!d) return 'N/A';
  try {
    return new Date(d).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return d; }
};

// ============================================================
// MAIN
// ============================================================
export const Customers = ({ setActiveView, records: propOrders = [], rentals: propRentals = [] }) => {
  // ✅ Normalize: accept array OR Spring Page {content: []}
  const normalize = (v) => {
    if (Array.isArray(v)) return v;
    if (v && Array.isArray(v.content)) return v.content;
    return [];
  };

  const [orders, setOrders] = useState(normalize(propOrders));
  const [rentals, setRentals] = useState(normalize(propRentals));
  const [loading, setLoading] = useState(normalize(propOrders).length === 0 && normalize(propRentals).length === 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'rentals'

  // ✅ Sync when parent props change (e.g., after payment)
    // ✅ Sync when parent props change (e.g., after payment)
  useEffect(() => {
    const list = normalize(propOrders);
    if (list.length > 0) setOrders(list);
  }, [propOrders]);

  useEffect(() => {
    const list = normalize(propRentals);
    if (list.length > 0) setRentals(list);
  }, [propRentals]);

  // ---------- Fallback fetch ONLY if props are empty ----------
    // ---------- Fallback fetch ONLY if props are empty ----------
  useEffect(() => {
    const hasProps = normalize(propOrders).length > 0 || normalize(propRentals).length > 0;
    if (hasProps) {
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const [ordersRes, rentalsRes] = await Promise.all([
          orderService.getAllOrders().catch(() => []),
          rentalService.getAllRentals().catch(() => []),
        ]);
        setOrders(Array.isArray(ordersRes) ? ordersRes : []);
        const rentalList = Array.isArray(rentalsRes)
          ? rentalsRes
          : (rentalsRes?.content || []);
        setRentals(rentalList);
      } catch (e) {
        console.error('Error loading customers:', e);
      }
      setLoading(false);
    })();
  }, []); // ← only run once on mount

  // ---------- Merge orders + rentals into customers ----------
  const customers = useMemo(() => {
    const map = new Map();

    const upsert = (key, seed) => {
      if (!map.has(key)) {
        map.set(key, {
          key,
          name: seed.name || 'Unknown',
          phone: seed.phone || '',
          address: seed.address || '',
          orders: [],
          rentals: [],
          totalSpent: 0,
          totalPaid: 0,
          totalBalance: 0,
        });
      }
      const c = map.get(key);
      if ((seed.name || '').length > c.name.length) c.name = seed.name;
      if ((seed.address || '').length > c.address.length) c.address = seed.address;
      return c;
    };

    // Orders
    orders.forEach(o => {
      const key = (o.customerPhone || '').trim() || (o.customerName || '').trim().toLowerCase();
      if (!key) return;
      const c = upsert(key, {
        name: o.customerName || 'Unknown',
        phone: o.customerPhone || '',
        address: o.customerAddress || '',
      });
      c.orders.push(o);
      const total = parseFloat(o.total || 0);
      const paid = (o.payments || []).reduce((s, p) => s + parseFloat(p.amount || 0), 0);
      const bal = parseFloat(o.balance ?? Math.max(0, total - paid));
      c.totalSpent += total;
      c.totalPaid += paid;
      c.totalBalance += bal;
    });

    // Rentals
    rentals.forEach(r => {
      const key = (r.customerPhone || '').trim() || (r.customerName || '').trim().toLowerCase();
      if (!key) return;
      const c = upsert(key, {
        name: r.customerName || 'Unknown',
        phone: r.customerPhone || '',
        address: '',
      });
      c.rentals.push(r);
      const total = parseFloat(r.totalAmount || 0);
      const paid = (r.payments || []).reduce((s, p) => s + parseFloat(p.amount || 0), 0);
      const bal = parseFloat(r.remainingBalance ?? Math.max(0, total - paid));
      c.totalSpent += total;
      c.totalPaid += paid;
      c.totalBalance += bal;
    });

    return Array.from(map.values()).map(c => {
      const allDates = [
        ...c.orders.map(o => o.orderDate || o.date),
        ...c.rentals.map(r => r.rentalStartDate || r.createdAt),
      ].filter(Boolean).map(d => new Date(d).getTime());

      const lastDate = allDates.length ? new Date(Math.max(...allDates)) : null;
      const totalCount = c.orders.length + c.rentals.length;

      return {
        ...c,
        totalCount,
        lastOrderDate: lastDate,
        tag: getTag(totalCount, c.totalSpent),
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders, rentals]);

  // ---------- Filter ----------
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return customers.filter(c => {
      const okSearch = !q ||
        c.name.toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.address || '').toLowerCase().includes(q);
      const okTag = filterTag === 'all' || c.tag === filterTag;
      return okSearch && okTag;
    });
  }, [customers, searchQuery, filterTag]);

  // ---------- Stats ----------
  const stats = useMemo(() => ({
    total: customers.length,
    vip: customers.filter(c => c.tag === 'VIP').length,
    debt: customers.filter(c => c.totalBalance > 0).length,
    revenue: customers.reduce((s, c) => s + c.totalSpent, 0),
  }), [customers]);

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ============================================================
  // DETAIL VIEW
  // ============================================================
  if (selectedCustomer) {
    const c = selectedCustomer;
    const gradient = getAvatarGradient(c.name);
    const hasOrders = c.orders.length > 0;
    const hasRentals = c.rentals.length > 0;
    const showRentals = activeTab === 'rentals' && hasRentals;

    return (
      <div className="space-y-3 pb-24 max-w-3xl mx-auto">
        {/* Back */}
        <button
          onClick={() => setSelectedCustomer(null)}
          className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 hover:text-rose-600 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to customers
        </button>

        {/* Profile Card */}
        <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-sm">
          {/* Gradient top strip */}
          <div className="h-16 bg-gradient-to-br from-rose-50 to-white" />

          <div className="px-4 pb-4 -mt-10">
            <div className="flex items-end gap-3">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} ring-4 ring-white shadow-lg flex items-center justify-center`}>
                <span className="text-white font-bold text-2xl">
                  {(c.name || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 pb-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-slate-800 truncate">{c.name}</h2>
                  <TagChip tag={c.tag} />
                </div>
                <p className="text-[10px] sm:text-xs text-slate-400">
                  Customer since {timeAgo(c.lastOrderDate)}
                </p>
              </div>
            </div>

                                    {/* Contact */}
            {(c.phone || c.address) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {c.phone && (
                  <a
                    href={`tel:${c.phone}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-rose-50 rounded-lg text-[11px] sm:text-xs text-slate-700 hover:text-rose-700 transition border border-slate-100"
                  >
                    <Phone className="w-3 h-3" /> {c.phone}
                  </a>
                )}

                {/* ✅ WhatsApp — green text, transparent bg, real logo */}
                {c.phone && (
                  <a
                    href={`https://wa.me/${c.phone.replace(/\D/g, '').replace(/^0/, '254')}?text=${encodeURIComponent(`Hello ${c.name}, this is KIIN Clothline. How can we help you today?`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-transparent hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 rounded-lg text-[11px] sm:text-xs font-semibold transition border border-emerald-200"
                  >
                    <WhatsAppIcon className="w-3 h-3" /> WhatsApp
                  </a>
                )}

                {c.address && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 rounded-lg text-[11px] sm:text-xs text-slate-700 border border-slate-100">
                    <MapPin className="w-3 h-3" /> {c.address}
                  </span>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="mt-4 grid grid-cols-4 gap-2">
              <div className="bg-slate-50 rounded-xl p-2 text-center">
                <p className="text-[8px] text-slate-400 uppercase font-semibold">Orders</p>
                <p className="text-sm font-bold text-slate-800">{c.orders.length}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-2 text-center">
                <p className="text-[8px] text-slate-400 uppercase font-semibold">Rentals</p>
                <p className="text-sm font-bold text-slate-800">{c.rentals.length}</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-2 text-center">
                <p className="text-[8px] text-emerald-600 uppercase font-semibold">Spent</p>
                <p className="text-[11px] font-bold text-emerald-700 truncate">{fmtKES(c.totalSpent)}</p>
              </div>
              <div className={`${c.totalBalance > 0 ? 'bg-amber-50' : 'bg-emerald-50'} rounded-xl p-2 text-center`}>
                <p className={`text-[8px] uppercase font-semibold ${c.totalBalance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>Balance</p>
                <p className={`text-[11px] font-bold truncate ${c.totalBalance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {fmtKES(c.totalBalance)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        {(hasOrders || hasRentals) && (
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto sm:inline-flex">
            {hasOrders && (
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'orders' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Package className="w-3 h-3" />
                Orders ({c.orders.length})
              </button>
            )}
            {hasRentals && (
              <button
                onClick={() => setActiveTab('rentals')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'rentals' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Calendar className="w-3 h-3" />
                Rentals ({c.rentals.length})
              </button>
            )}
          </div>
        )}

        {/* History */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Orders */}
          {activeTab === 'orders' && hasOrders && (
            <div className="divide-y divide-slate-50">
              {c.orders.map(order => (
                <OrderRow key={order.id} order={order} />
              ))}
            </div>
          )}

          {/* Rentals */}
          {activeTab === 'rentals' && showRentals && (
            <div className="divide-y divide-slate-50">
              {c.rentals.map(rental => (
                <RentalRow key={rental.id} rental={rental} />
              ))}
            </div>
          )}

          {/* Empty for active tab */}
          {activeTab === 'orders' && !hasOrders && (
            <div className="py-8 text-center text-slate-400 text-xs">No orders</div>
          )}
          {activeTab === 'rentals' && !hasRentals && (
            <div className="py-8 text-center text-slate-400 text-xs">No rentals</div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  // LIST VIEW
  // ============================================================
  return (
    <div className="space-y-3 pb-24">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveView('workbench')}
          className="p-1.5 hover:bg-slate-100 rounded-xl transition flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-rose-500" />
            Customers
          </h2>
          <p className="text-[10px] sm:text-xs text-slate-400">
            {filtered.length} of {customers.length} · {orders.length} orders + {rentals.length} rentals
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2">
        <StatCard label="Total" value={stats.total} color="slate" />
        <StatCard label="VIP" value={stats.vip} color="amber" />
        <StatCard label="Debt" value={stats.debt} color="red" />
        <StatCard label="Revenue" value={fmtKES(stats.revenue)} color="emerald" compact />
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2.5">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search name, phone or address..."
            className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tag chips */}
        <div className="flex gap-1 mt-2 overflow-x-auto pb-0.5 scrollbar-hide">
          {['all', 'VIP', 'Corporate', 'Regular', 'Walk-in'].map(t => {
            const active = filterTag === t;
            const tagDef = t !== 'all' ? TAGS[t] : null;
            const Icon = tagDef?.icon;
            return (
              <button
                key={t}
                onClick={() => setFilterTag(t)}
                className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition ${
                  active
                    ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {Icon && <Icon className="w-2.5 h-2.5" />}
                {t === 'all' ? 'All' : t}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-500">No customers found</p>
          <p className="text-xs text-slate-400 mt-1">
            {customers.length === 0
              ? 'Create an order or rental to see customers here'
              : 'Try adjusting your search or filters'}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(c => (
            <CustomerRow
              key={c.key}
              customer={c}
              onClick={() => {
                setSelectedCustomer(c);
                setActiveTab(c.orders.length > 0 ? 'orders' : 'rentals');
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

const StatCard = ({ label, value, color, compact }) => {
  const colors = {
    slate:   'text-slate-800',
    amber:   'text-amber-600',
    red:     'text-red-600',
    emerald: 'text-emerald-600',
  };
  return (
    <div className="bg-white p-2 rounded-xl border border-slate-100 text-center">
      <p className="text-[8px] text-slate-400 uppercase font-semibold tracking-wide">{label}</p>
      <p className={`${compact ? 'text-[10px]' : 'text-sm'} font-bold truncate ${colors[color]}`}>
        {value}
      </p>
    </div>
  );
};

const CustomerRow = ({ customer, onClick }) => {
  const c = customer;
  const gradient = getAvatarGradient(c.name);
  const initials = (c.name || 'U')
    .split(' ')
    .slice(0, 2)
    .map(s => s.charAt(0).toUpperCase())
    .join('');

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl border border-slate-100 hover:border-rose-200 hover:shadow-md hover:shadow-rose-100/40 transition-all group p-2.5 sm:p-3 text-left"
    >
      <div className="flex items-center gap-2.5">
        {/* Avatar */}
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
          <span className="text-white font-bold text-xs sm:text-sm">{initials}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-semibold text-xs sm:text-sm text-slate-800 truncate">
              {c.name}
            </h3>
            <TagChip tag={c.tag} small />
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
            {c.phone && (
              <span className="flex items-center gap-0.5 truncate">
                <Phone className="w-2.5 h-2.5" /> {c.phone}
              </span>
            )}
            {c.address && (
              <>
                <span className="text-slate-200">•</span>
                <span className="truncate">{c.address}</span>
              </>
            )}
          </div>
        </div>

        {/* Right side: money + chevron */}
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] sm:text-xs font-bold text-slate-800 whitespace-nowrap">
            {fmtKES(c.totalSpent)}
          </p>
          <p className="text-[9px] text-slate-400 whitespace-nowrap">
            {timeAgo(c.lastOrderDate)}
          </p>
        </div>

        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      </div>

      {/* Mini stats strip */}
      <div className="mt-2 pt-2 border-t border-slate-50 flex items-center gap-3 text-[10px] text-slate-500">
        {c.orders.length > 0 && (
          <span className="flex items-center gap-1">
            <Package className="w-2.5 h-2.5 text-rose-500" />
            <b className="text-slate-700">{c.orders.length}</b> order{c.orders.length !== 1 ? 's' : ''}
          </span>
        )}
        {c.rentals.length > 0 && (
          <span className="flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5 text-blue-500" />
            <b className="text-slate-700">{c.rentals.length}</b> rental{c.rentals.length !== 1 ? 's' : ''}
          </span>
        )}
        {c.totalBalance > 0 && (
          <span className="ml-auto flex items-center gap-1 text-amber-600 font-semibold">
            <AlertCircle className="w-2.5 h-2.5" />
            {fmtKES(c.totalBalance)} due
          </span>
        )}
      </div>
    </button>
  );
};

const OrderRow = ({ order }) => {
  const items = order.measurementItems || order.items || [];
  const status = order.status || 'PENDING';
  const statusStyles = {
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    CANCELLED: 'bg-red-100 text-red-700',
    PENDING: 'bg-amber-100 text-amber-700',
  };
  const balance = parseFloat(order.balance || 0);

  return (
    <div className="p-3 sm:p-4 hover:bg-slate-50/50 transition">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-[10px] sm:text-xs font-bold text-slate-700">
            {order.recNo}
          </span>
          <span className={`text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${statusStyles[status]}`}>
            {status}
          </span>
        </div>
        <span className="text-[9px] sm:text-[10px] text-slate-400 whitespace-nowrap">
          {fmtDate(order.orderDate || order.date)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] sm:text-xs text-slate-600 truncate">
          {order.suitType || 'Suit'} • {order.style || 'Standard'}
        </p>
        <div className="text-right flex-shrink-0">
          <p className="text-[11px] sm:text-xs font-bold text-slate-800">{fmtKES(order.total)}</p>
          <p className={`text-[9px] font-semibold ${balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {balance > 0 ? `Bal: ${fmtKES(balance)}` : '✓ Paid'}
          </p>
        </div>
      </div>

      {/* Measurements */}
      {items.length > 0 && (
        <details className="mt-1.5 group">
          <summary className="text-[10px] text-rose-600 hover:text-rose-700 cursor-pointer flex items-center gap-1 list-none [&::-webkit-details-marker]:hidden">
            <Ruler className="w-2.5 h-2.5" />
            Measurements ({items.length})
            <ChevronRight className="w-2.5 h-2.5 transition-transform group-open:rotate-90" />
          </summary>
          <div className="mt-1.5 space-y-1.5">
            {items.map((item, i) => (
              <MeasurementBlock key={item.id || i} item={item} index={i} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

const RentalRow = ({ rental }) => {
  const status = rental.status || 'PENDING';
  const statusStyles = {
    RETURNED: 'bg-emerald-100 text-emerald-700',
    RENTED: 'bg-blue-100 text-blue-700',
    CANCELLED: 'bg-red-100 text-red-700',
    PENDING: 'bg-amber-100 text-amber-700',
  };
  const balance = parseFloat(rental.remainingBalance || 0);
  const color = rental.suitColor || '';

  return (
    <div className="p-3 sm:p-4 hover:bg-slate-50/50 transition">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-[10px] sm:text-xs font-bold text-slate-700">
            {rental.reference}
          </span>
          <span className={`text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${statusStyles[status]}`}>
            {status}
          </span>
        </div>
        <span className="text-[9px] sm:text-[10px] text-slate-400 whitespace-nowrap">
          {fmtDate(rental.rentalStartDate)}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-1.5">
        {color && (
          <span
            className="w-2.5 h-2.5 rounded-full ring-1 ring-slate-200 flex-shrink-0"
            style={{ backgroundColor: color }}
          />
        )}
        <p className="text-[11px] sm:text-xs text-slate-600 truncate">
          {rental.suitName} • {rental.days || 0} day{rental.days !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] sm:text-[10px] text-slate-400">
          {fmtDate(rental.rentalStartDate)} → {fmtDate(rental.rentalEndDate)}
        </p>
        <div className="text-right flex-shrink-0">
          <p className="text-[11px] sm:text-xs font-bold text-slate-800">{fmtKES(rental.totalAmount)}</p>
          <p className={`text-[9px] font-semibold ${balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {balance > 0 ? `Bal: ${fmtKES(balance)}` : '✓ Paid'}
          </p>
        </div>
      </div>
    </div>
  );
};

const MeasurementBlock = ({ item, index }) => {
  const type = (item.itemType || item.type || '').toLowerCase();
  const isCoat = type === 'coat';
  const name = item.itemName || item.name || (isCoat ? 'Coat' : 'Trouser');

  const coatFields = [
    ['FL', item.coatFL || item.coat_fl],
    ['Ch', item.coatCh || item.coat_ch],
    ['Wa', item.coatWa || item.coat_wa],
    ['Sh', item.coatSh || item.coat_sh],
    ['Sl', item.coatSl || item.coat_sl],
  ];
  const trouserFields = [
    ['FL', item.tfl || item.tFL],
    ['Wa', item.twa || item.tWa],
    ['Th', item.tth || item.tTh],
    ['Kn', item.tkn || item.tKn],
    ['B1', item.tb1 || item.tB1],
    ['B2', item.tb2 || item.tB2],
  ];
  const fields = isCoat ? coatFields : trouserFields;

  return (
    <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
      <p className="text-[10px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
        <Sparkles className="w-2.5 h-2.5 text-rose-400" />
        {name} #{index + 1}
      </p>
      <div className="grid grid-cols-3 gap-1 text-[9px] text-slate-500">
        {fields.map(([label, val]) => (
          <span key={label}>
            {label}: <b className="text-slate-700">{parseFloat(val || 0)}"</b>
          </span>
        ))}
      </div>
    </div>
  );
};

export default Customers;