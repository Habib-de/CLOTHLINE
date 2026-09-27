import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, Edit2, Trash2, Search, 
  Grid, List, Filter, X, ZoomIn, PlusCircle, XCircle
} from 'lucide-react';
import { suitService } from '../services/api';
import toast from 'react-hot-toast';

export const Gallery = ({ openSuitDetail, openEditSuit, deleteSuit: propDeleteSuit, user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [suits, setSuits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredSuit, setHoveredSuit] = useState(null);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  
  // ✅ Role check - uppercase to match backend
  const isAdminOwner = user?.role === 'ADMIN' || user?.role === 'OWNER';

  // ============================================================
  // ✅ LOAD SUITS FROM API
  // ============================================================
  const loadSuits = async () => {
    setLoading(true);
    try {
      const data = await suitService.getAllSuits();
      setSuits(data || []);
    } catch (error) {
      console.error('Error loading suits:', error);
      toast.error('Failed to load suits');
      setSuits([]);
    }
    setLoading(false);
  };

  // Load suits on mount
  useEffect(() => {
    loadSuits();
  }, []);

  // ============================================================
  // ✅ GET UNIQUE CATEGORIES
  // ============================================================
  const categories = ['all', ...new Set(suits.map(s => s.category || 'Uncategorized'))];

  // ============================================================
  // ✅ FILTER SUITS
  // ============================================================
  const filteredSuits = suits.filter(s => {
    const matchesSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.detail?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // ============================================================
  // ✅ DELETE SUIT (API)
  // ============================================================
  const handleDeleteSuit = async (id) => {
    if (!window.confirm('Are you sure you want to delete this suit?')) return;
    
    try {
      const result = await suitService.deleteSuit(id);
      if (result.success) {
        toast.success('Suit deleted successfully! 🗑️');
        loadSuits(); // Reload list
        if (propDeleteSuit) {
          propDeleteSuit(id);
        }
      } else {
        toast.error(result.error || 'Failed to delete suit');
      }
    } catch (error) {
      console.error('Error deleting suit:', error);
      toast.error('Failed to delete suit');
    }
  };

  // ============================================================
  // ✅ EDIT SUIT
  // ============================================================
  const handleEditSuit = (id) => {
    if (openEditSuit) {
      openEditSuit(id);
    }
  };

  // ============================================================
  // ✅ ADD SUIT
  // ============================================================
  const handleAddSuit = () => {
    if (typeof openEditSuit === 'function') {
      openEditSuit(null);
    } else {
      toast.error('Add Suit feature is not available');
    }
  };

  // ============================================================
  // ✅ LOADING STATE
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // ============================================================
  // ✅ RENDER
  // ============================================================
  return (
    <div className="space-y-4 pb-28 sm:pb-6">
      {/* Header */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
              <span className="text-sm sm:text-xl">Suit Gallery</span>
            </h2>
            <p className="text-[10px] sm:text-xs text-gray-400">{filteredSuits.length} suits available</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-400'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-400'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            {isAdminOwner && (
              <button
                onClick={handleAddSuit}
                className="bg-rose-600 text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm hover:bg-rose-700 transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap"
              >
                <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                <span className="hidden xs:inline">Add Suit</span>
                <span className="xs:hidden">Add Suit</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search suits..."
            className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-xs sm:text-sm"
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
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 outline-none"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Gallery Grid or List */}
      {filteredSuits.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-12 text-center">
          <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-600">No suits found</h3>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">Try adjusting your search or filter</p>
          {isAdminOwner && (
            <button
              onClick={handleAddSuit}
              className="mt-3 sm:mt-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-rose-600 text-white rounded-xl text-xs sm:text-sm hover:bg-rose-700 transition flex items-center gap-2 mx-auto"
            >
              <PlusCircle className="w-4 h-4" /> Add Your First Suit
            </button>
          )}
        </div>
      ) : (
        <div className={`grid ${
  viewMode === 'grid' 
    ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5 sm:gap-3' 
    : 'grid-cols-1 gap-2 sm:gap-3'
}`}>
          {filteredSuits.map(s => (
            <div 
              key={s.id} 
              className={`group bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 ${
                viewMode === 'list' ? 'flex' : ''
              }`}
              onMouseEnter={() => setHoveredSuit(s.id)}
              onMouseLeave={() => setHoveredSuit(null)}
            >
              <div 
  onClick={() => openSuitDetail(s.id)}
  className={`${
    viewMode === 'list' 
      ? 'w-16 sm:w-24 h-16 sm:h-24 shrink-0' 
      : 'w-full aspect-[4/3] sm:aspect-[4/3]'
  } relative group cursor-pointer overflow-hidden`}
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
                    className={`w-full transition-transform duration-700 ${
                      viewMode === 'list' ? 'h-full object-cover' : 'h-auto object-contain'
                    } ${
                      hoveredSuit === s.id ? 'scale-125' : 'scale-100'
                    }`}
                    style={{
                      transformOrigin: 'center center'
                    }}
                  />
                ) : (
                  <div className={`w-full ${viewMode === 'list' ? 'h-full' : 'aspect-[4/3]'} flex items-center justify-center bg-gray-50`}>
                    <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300" />
                  </div>
                )}
                
                {/* Image count badge */}
                {s.imageUrls?.filter(img => img).length > 1 && (
                  <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm text-white text-[7px] sm:text-[8px] px-1 py-0.5 rounded-full flex items-center gap-0.5 z-10">
                    <ImageIcon className="w-1.5 h-1.5 sm:w-2 sm:h-2" />
                    {s.imageUrls.filter(img => img).length}
                  </div>
                )}
              </div>
              
                            <div className={`p-1.5 sm:p-2.5 flex-1 ${viewMode === 'list' ? 'flex flex-col justify-center' : ''}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-800 text-[9px] sm:text-sm group-hover:text-rose-600 transition-colors line-clamp-1">
                        {s.name}
                      </h3>
                    </div>
                    <span className="text-[8px] sm:text-[10px] text-gray-500 font-medium shrink-0">
                      KES {(s.price || 8500).toLocaleString()}
                    </span>
                  </div>

                  {s.detail && (
                    <p className="text-[7px] sm:text-[10px] text-blue-600 mt-0.5 wrap-break-word -ml-1.5 sm:-ml-2.5 -mr-1.5 sm:-mr-2.5 px-1.5 sm:px-2.5 py-1">
                      {s.detail}
                    </p>
                  )}
                </div>
                
                <div className="mt-1 hidden sm:flex flex-wrap items-center gap-0.5 sm:gap-1">
                  <span className="text-[7px] sm:text-[8px] bg-rose-50 text-rose-600 px-1 sm:px-1.5 py-0.5 rounded-full">
                    {s.category || 'Premium'}
                  </span>
                  <span className="text-[7px] sm:text-[8px] bg-blue-50 text-blue-600 px-1 sm:px-1.5 py-0.5 rounded-full">
                    {s.suitType || 'Full Suit'}
                  </span>
                </div>
                
                {isAdminOwner && (
                  <div className="flex gap-0.5 sm:gap-1 mt-0.5 sm:mt-1.5 pt-0.5 sm:pt-1.5 border-t border-gray-100">
                    <button
                      onClick={() => handleEditSuit(s.id)}
                      className="flex-1 text-[7px] sm:text-[10px] text-blue-600 hover:bg-blue-50 py-0.5 sm:py-1 rounded-lg flex items-center justify-center gap-0.5 sm:gap-1 transition"
                    >
                      <Edit2 className="w-2 h-2 sm:w-3 sm:h-3" /> <span className="hidden xs:inline">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteSuit(s.id)}
                      className="flex-1 text-[7px] sm:text-[10px] text-red-500 hover:bg-red-50 py-0.5 sm:py-1 rounded-lg flex items-center justify-center gap-0.5 sm:gap-1 transition"
                    >
                      <Trash2 className="w-2 h-2 sm:w-3 sm:h-3" /> <span className="hidden xs:inline">Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Full Screen Image Modal */}
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