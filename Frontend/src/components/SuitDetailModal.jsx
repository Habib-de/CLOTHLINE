import React from 'react';
import { X, Edit2, Trash2 } from 'lucide-react';

export const SuitDetailModal = ({ 
  isOpen, 
  onClose, 
  suit, 
  isAdminOwner, 
  onEdit, 
  onDelete,
  setFullScreenImage
}) => {
  if (!isOpen || !suit) return null;

  const images = suit.imageUrls?.length ? suit.imageUrls : ['https://placehold.co/300x300/eee/ccc?text=No+Image'];

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 pb-28 sm:pb-4 bg-black/50 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-3 pb-4 shadow-2xl mb-6 sm:mb-0 animate-in fade-in zoom-in duration-300">
        
        {/* Header - Compact */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1.5">
            <div 
              className="w-3.5 h-3.5 rounded-full border border-gray-200 flex-shrink-0"
              style={{ backgroundColor: suit.color || '#1a1a2e' }}
            />
            <span className="font-bold text-sm truncate max-w-[150px]">{suit.name}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Images - Compact */}
        <div className="flex gap-1.5 overflow-x-auto pb-1.5">
          {images.map((img, i) => (
            <img 
              key={i} 
              src={img} 
              alt={`${suit.name} ${i+1}`} 
              className="w-16 h-16 object-cover rounded-lg flex-shrink-0 cursor-pointer hover:opacity-80 transition" 
              onClick={() => {
                if (setFullScreenImage) {
                  setFullScreenImage(img);
                }
              }}
            />
          ))}
        </div>
        
        {/* Info - Compact */}
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2 text-gray-500">
            <span>Color:</span>
            <div 
              className="w-3 h-3 rounded-full border border-gray-200"
              style={{ backgroundColor: suit.color || '#1a1a2e' }}
            />
            <span className="font-mono text-[10px]">{suit.color || 'Navy Blue'}</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">Category: {suit.category || 'Formal'}</span>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-1">
            <span className="text-gray-500">Price:</span>
            <span className="font-bold text-xs">KES {(suit.price || 8500).toLocaleString()}</span>
          </div>
          
          {suit.detail && (
            <p className="text-[10px] text-gray-600 pt-0.5 border-t border-gray-100">{suit.detail}</p>
          )}
        </div>
        
        {/* Buttons - Compact */}
        {isAdminOwner && (
          <div className="flex gap-1.5 mt-2 pt-1.5 border-t border-gray-100">
            <button
              onClick={() => { onClose(); onEdit(suit.id); }}
              className="flex-1 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-[10px] font-medium transition flex items-center justify-center gap-1"
            >
              <Edit2 className="w-3 h-3" /> Edit
            </button>
            <button
              onClick={() => { onClose(); onDelete(suit.id); }}
              className="flex-1 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[10px] font-medium transition flex items-center justify-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};