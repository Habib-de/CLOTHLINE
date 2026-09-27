import React, { useState, useEffect } from 'react';
import { 
  Search, X, Image as ImageIcon, 
  ZoomIn, Phone, Mail, MapPin,
  Grid, List, Filter, Clock,
  Sparkles, ShoppingBag, Crown, Gem,
  LogOut, Heart, ArrowRight, MessageCircle,
  ChevronDown, Star, Shield, Award
} from 'lucide-react';

export const ClientCatalog = ({ suits, openSuitDetail, user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSuit, setSelectedSuit] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [scrolled, setScrolled] = useState(false);
  const [showInquireModal, setShowInquireModal] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get current time and date
  const now = new Date();
  const currentHour = now.getHours();
  const currentTime = now.toLocaleTimeString('en-KE', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  const currentDate = now.toLocaleDateString('en-KE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Dynamic greeting based on time
  let greeting = '';
  if (currentHour < 12) {
    greeting = 'Good Morning';
  } else if (currentHour < 17) {
    greeting = 'Good Afternoon';
  } else {
    greeting = 'Good Evening';
  }

  // ✅ Get categories from suits (API data)
  const categories = ['all', ...new Set(suits.map(s => s.category || 'Classic'))];

  // ✅ Filter suits using correct field names
  const filteredSuits = suits.filter(s => {
    const matchesSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.detail?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleLogout = () => {
    localStorage.removeItem('kiin_user');
    localStorage.removeItem('kiin_token');
    window.location.reload();
  };

  const handleCall = () => {
    window.location.href = 'tel:+254790132055';
  };

  const handleEmail = (suitName, suitCategory, suitPrice, suitDetail) => {
    const subject = `Inquiry about ${suitName || 'Suit'}`;
    const body = `Hello KIIN-CLOTHLINE KENYA,

I'm interested in the following suit:
Name: ${suitName || 'Suit'}
Category: ${suitCategory || 'N/A'}
Price: KES ${(suitPrice || 8500).toLocaleString()}
Description: ${suitDetail || 'N/A'}

Could you please provide more information? I would like to inquire about availability, customization options, and delivery.

Thank you.

Best regards,
[Your Name]`;
    
    window.location.href = `mailto:info@kiinclotheline.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleWhatsApp = (suitName, suitCategory, suitPrice, suitDetail) => {
    const message = `Hello KIIN-CLOTHLINE KENYA!

I'm interested in the following suit:

👔 Suit: ${suitName || 'Suit'}
📂 Category: ${suitCategory || 'N/A'}
💰 Price: KES ${(suitPrice || 8500).toLocaleString()}
📝 Description: ${suitDetail || 'N/A'}

Could you please provide more information about availability, customization, and delivery?

Thank you!`;
    
    window.open(`https://wa.me/254790132055?text=${encodeURIComponent(message)}`, '_blank');
  };

  const openDetail = (suit) => {
    setSelectedSuit(suit);
    setShowDetailModal(true);
  };

  const closeDetail = () => {
    setShowDetailModal(false);
    setSelectedSuit(null);
  };

  // Stats
  const totalSuits = suits.length;
  const formalSuits = suits.filter(s => s.category === 'FORMAL' || s.category === 'Formal').length;
  const modernSuits = suits.filter(s => s.category === 'MODERN' || s.category === 'Modern').length;
  const premiumSuits = suits.filter(s => s.detail?.toLowerCase().includes('premium')).length;

  const userName = user?.name || user?.email?.split('@')[0] || 'Guest';
  const isGuest = user?.id === 'guest-client' || user?.id?.startsWith('guest-client');

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5] overflow-x-hidden pb-16 sm:pb-14">
      {/* Header - Premium */}
      <header className={`bg-white/95 backdrop-blur-md border-b transition-all duration-300 fixed top-0 left-0 right-0 z-50 ${scrolled ? 'shadow-lg border-gray-200/50' : 'border-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between">
            {/* Brand */}
            <div className="flex items-center gap-2 sm:gap-3">
              <img 
                src="/logo.png" 
                alt="KIIN CLOTHELIN" 
                className="h-8 sm:h-11 w-auto object-contain"
              />
              <div className="border-l border-gray-200 pl-2 sm:pl-3">
                <div className="text-[10px] sm:text-base font-bold text-gray-800 tracking-wide whitespace-nowrap">
                  KIIN-CLOTHLINE <span className="text-rose-600">KENYA</span>
                </div>
                <div className="text-[8px] sm:text-xs text-gray-400 tracking-wide hidden sm:block">
                  For All Your Requirements for Suits and Suit Accessories
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleCall()} 
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                <Phone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Call</span>
              </button>
              {/* ✅ Show Staff Login for guests */}
              {isGuest && (
                <button 
                  onClick={() => {
                    localStorage.removeItem('kiin_user');
                    localStorage.removeItem('kiin_token');
                    window.location.reload();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Staff Login</span>
                </button>
              )}
              {!isGuest && (
                <button 
                  onClick={handleLogout} 
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Spacer */}
      <div className="h-[64px] sm:h-[72px]"></div>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-rose-50 via-white to-amber-50/30 px-4 pt-8 pb-3 md:pt-12 md:pb-5 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-rose-600 bg-rose-100 px-3 py-0.5 rounded-full">Premium Collection</span>
                {isGuest && (
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Guest</span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-light text-gray-800">
                {greeting} <span className="font-semibold text-gray-900"></span>
                {isGuest && <span className="text-sm font-normal text-gray-400 ml-2"></span>}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {isGuest ? '' : 'Discover timeless elegance and craftsmanship'}
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 bg-white/80 px-4 py-2 rounded-xl shadow-sm border border-gray-100">
              <Clock className="w-4 h-4 text-rose-500" />
              <span className="font-medium text-gray-700">{currentTime}</span>
              <span className="text-gray-300">|</span>
              <span className="text-xs text-gray-400">{currentDate}</span>
            </div>
          </div>
        </div>
      </div>

     

      {/* Search & Filter - Premium */}
      <div className="max-w-7xl mx-auto w-full px-4 pt-1 pb-4">
  <div className="flex items-center gap-2 sm:gap-3">
    <div className="relative flex-1 min-w-0">
      <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search suits..."
        className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition text-xs sm:text-sm"
      />
      {searchTerm && (
        <button 
          onClick={() => setSearchTerm('')} 
          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      )}
    </div>
    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
      <Filter className="hidden sm:block w-3.5 h-3.5 text-gray-400" />
      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        className="border border-gray-200 rounded-lg px-1.5 sm:px-2.5 py-2 sm:py-1.5 text-[10px] sm:text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none bg-white max-w-[90px] sm:max-w-none"
      >
        {categories.map(cat => (
          <option key={cat} value={cat}>
            {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </option>
        ))}
      </select>
    </div>
    <div className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg p-0.5 shrink-0">
      <button
        onClick={() => setViewMode('grid')}
        className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-rose-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
      >
        <Grid className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => setViewMode('list')}
        className={`p-1.5 rounded-md transition ${viewMode === 'list' ? 'bg-rose-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
      >
        <List className="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
</div>
      {/* Suit Grid - Premium */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 pb-8">
        {filteredSuits.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-600">No suits found</h3>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>
          </div>
        ) : (
          <div className={`grid ${
            viewMode === 'grid' 
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4' 
              : 'grid-cols-1 gap-3'
          }`}>
            {filteredSuits.map(s => (
              <div
                key={s.id}
                onClick={() => openDetail(s)}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-rose-200 hover:shadow-xl transition-all duration-500 cursor-pointer hover:-translate-y-1"
              >
                <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
                  {/* ✅ FIX: imageUrls instead of images */}
                  {s.imageUrls?.[0] ? (
                    <img
                      src={s.imageUrls[0]}
                      alt={s.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  {/* ✅ FIX: imageUrls instead of images */}
                  {s.imageUrls?.filter(img => img).length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ImageIcon className="w-2.5 h-2.5" />
                      {s.imageUrls.filter(img => img).length}
                    </div>
                  )}
                </div>

                <div className="p-3.5">
                  <h3 className="font-semibold text-gray-800 text-sm group-hover:text-rose-600 transition-colors line-clamp-1">
                    {s.name}
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1 hidden sm:block">
                    {s.detail || 'Classic suit'}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[8px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-medium">
                      {s.category || 'Premium'}
                    </span>
                    <span className="text-[8px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                      {s.suitType || 'Full Suit'}
                    </span>
                    <span className="text-xs font-bold text-gray-800 ml-auto">
                      KES {(s.price || 8500).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal - Image Left, Details Right */}
      {showDetailModal && selectedSuit && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          onClick={closeDetail}
        >
          <div 
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-4 border-b border-gray-100 rounded-t-3xl">
              <h3 className="font-semibold text-gray-800 truncate flex-1">{selectedSuit.name}</h3>
              <button 
                onClick={closeDetail}
                className="p-1.5 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex flex-col md:flex-row p-4 gap-4">
              {/* Left - Images */}
              <div className="md:w-1/2">
                <div className="grid grid-cols-2 gap-2">
                  {/* ✅ FIX: imageUrls instead of images */}
                  {(selectedSuit.imageUrls?.length ? selectedSuit.imageUrls : ['https://placehold.co/400x400/eee/ccc?text=No+Image']).map((img, i) => (
                    <div 
                      key={i} 
                      className={`${i === 0 ? 'col-span-2' : 'col-span-1'} aspect-square bg-gray-50 rounded-xl overflow-hidden`}
                    >
                      <img 
                        src={img} 
                        alt={`${selectedSuit.name} ${i+1}`} 
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Right - Details */}
              <div className="md:w-1/2 flex flex-col">
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  {selectedSuit.category && (
                    <span className="text-[10px] bg-rose-50 text-rose-600 px-2.5 py-0.5 rounded-full font-medium">
                      {selectedSuit.category}
                    </span>
                  )}
                  {selectedSuit.suitType && (
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full font-medium">
                      {selectedSuit.suitType}
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-bold text-gray-800 mb-1">{selectedSuit.name}</h2>
                
                <p className="text-sm text-gray-600 leading-relaxed flex-1">
                  {selectedSuit.detail || 'No details available.'}
                </p>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Price</p>
                      <p className="text-2xl font-bold text-gray-800">KES {(selectedSuit.price || 8500).toLocaleString()}</p>
                    </div>
                    
                    <button 
                      onClick={() => setShowInquireModal(true)}
                      className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl text-sm font-medium transition shadow-md hover:shadow-rose-500/30"
                    >
                      Inquire Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inquire Options Popup Modal */}
      {showInquireModal && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowInquireModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Contact Us</h3>
              <p className="text-sm text-gray-500 mt-0.5">Choose how you'd like to inquire</p>
            </div>

            <div className="space-y-2.5">
              {/* Call Option */}
              <button 
                onClick={() => { handleCall(); setShowInquireModal(false); }}
                className="w-full flex items-center gap-4 px-4 py-3.5 bg-green-50 hover:bg-green-100 rounded-xl transition border border-green-100"
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-800">Call Us</p>
                  <p className="text-xs text-gray-400">Speak directly with our team</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </button>

              {/* Email Option */}
              <button 
                onClick={() => { 
                  handleEmail(
                    selectedSuit?.name,
                    selectedSuit?.category,
                    selectedSuit?.price,
                    selectedSuit?.detail
                  );
                  setShowInquireModal(false);
                }}
                className="w-full flex items-center gap-4 px-4 py-3.5 bg-blue-50 hover:bg-blue-100 rounded-xl transition border border-blue-100"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-800">Email Us</p>
                  <p className="text-xs text-gray-400">Send us your inquiry</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </button>

              {/* WhatsApp Option */}
              <button 
                onClick={() => { 
                  handleWhatsApp(
                    selectedSuit?.name,
                    selectedSuit?.category,
                    selectedSuit?.price,
                    selectedSuit?.detail
                  );
                  setShowInquireModal(false);
                }}
                className="w-full flex items-center gap-4 px-4 py-3.5 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition border border-emerald-100"
              >
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-800">WhatsApp</p>
                  <p className="text-xs text-gray-400">Chat with us instantly</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <button 
              onClick={() => setShowInquireModal(false)}
              className="w-full mt-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#E8D8B8] border-t border-[#D6C39E] py-3.5 sm:py-4 px-3 sm:px-4 w-full z-40">
  <div className="max-w-7xl mx-auto">
    <div className="flex items-center justify-between gap-2 sm:gap-3">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <img 
          src="/logo.png" 
          alt="KIIN CLOTHELIN" 
          className="h-7 sm:h-7 w-auto object-contain shrink-0"
        />
        <span className="text-xs sm:text-xs font-medium text-gray-800 whitespace-nowrap truncate">
  KIIN-CLOTHLINE<sup className="text-rose-600 text-[8px] sm:text-[9px] font-bold ml-0.5">KE</sup>
</span>
      </div>
      <div className="hidden sm:flex items-center gap-4 text-xs text-gray-700">
        <span>Eastleigh 10 St, F12</span>
        <span>|</span>
        <span>Mon-Fri 8AM-6PM</span>
      </div>
      <div className="flex items-center gap-3 sm:gap-3 text-xs sm:text-xs shrink-0">
        <button 
          onClick={() => handleCall()} 
          className="text-gray-800 hover:text-black"
        >
          Call
        </button>
        <button 
          onClick={() => handleEmail(
            selectedSuit?.name,
            selectedSuit?.category,
            selectedSuit?.price,
            selectedSuit?.detail
          )} 
          className="text-gray-800 hover:text-black"
        >
          Email
        </button>
        <button 
          onClick={() => handleWhatsApp(
            selectedSuit?.name,
            selectedSuit?.category,
            selectedSuit?.price,
            selectedSuit?.detail
          )} 
          className="text-gray-800 hover:text-black"
        >
          WhatsApp
        </button>
      </div>
    </div>
  </div>
</footer>
    </div>
  );
};