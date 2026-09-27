import React from 'react';
import { X, Image as ImageIcon, Save, Shirt } from 'lucide-react';

// ============================================================
// ✅ IMAGE COMPRESSION FUNCTION
// ============================================================
const compressImage = (file, maxWidth = 600, maxHeight = 600, quality = 0.7) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    };
  });
};

export const SuitModal = ({ 
  isOpen, 
  onClose, 
  suitForm, 
  setSuitForm, 
  editSuitId, 
  onSave,
  onImageUpload,
  onRemoveImage
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 pb-28 sm:pb-4 bg-black/50 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-3 pb-4 shadow-2xl mb-6 sm:mb-0 animate-in fade-in zoom-in duration-300">
        
        {/* Header - Compact */}
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-sm flex items-center gap-1.5">
            <Shirt className="w-4 h-4 text-rose-500" />
            {editSuitId ? 'Edit Suit' : 'Add New Suit'}
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form - Compact */}
        <div className="space-y-2">
          {/* Suit Name */}
          <div>
            <label className="text-[10px] font-medium text-gray-600">Suit Name *</label>
            <input
              type="text"
              value={suitForm.name || ''}
              onChange={(e) => setSuitForm({ ...suitForm, name: e.target.value })}
              placeholder="e.g. Classic Tuxedo"
              className="w-full px-2.5 py-1.5 bg-gray-50 border rounded-lg text-xs focus:ring-2 focus:ring-rose-500 outline-none"
            />
          </div>

          {/* Suit Type */}
          <div>
            <label className="text-[10px] font-medium text-gray-600">Suit Type</label>
            <select
              value={suitForm.suitType || 'Full Suit'}
              onChange={(e) => setSuitForm({ ...suitForm, suitType: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-gray-50 border rounded-lg text-xs focus:ring-2 focus:ring-rose-500 outline-none"
            >
              <option value="Full Suit">Full Suit</option>
              <option value="Trouser Only">Trouser Only</option>
              <option value="Blazer Only">Blazer Only</option>
              <option value="Waistcoat Only">Waistcoat Only</option>
              <option value="Shirt Only">Shirt Only</option>
            </select>
          </div>

          {/* Category + Color - Row */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-medium text-gray-600">Category</label>
              <select
                value={suitForm.category || 'Formal'}
                onChange={(e) => setSuitForm({ ...suitForm, category: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-gray-50 border rounded-lg text-xs focus:ring-2 focus:ring-rose-500 outline-none"
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
              <label className="text-[10px] font-medium text-gray-600">Color</label>
              <select
                value={suitForm.color || 'Navy Blue'}
                onChange={(e) => setSuitForm({ ...suitForm, color: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-gray-50 border rounded-lg text-xs focus:ring-2 focus:ring-rose-500 outline-none"
              >
                <option value="Navy Blue">Navy Blue</option>
                <option value="Black">Black</option>
                <option value="Charcoal">Charcoal</option>
                <option value="Burgundy">Burgundy</option>
                <option value="Forest Green">Forest Green</option>
                <option value="Royal Blue">Royal Blue</option>
                <option value="Sky Blue">Sky Blue</option>
                <option value="Emerald Green">Emerald Green</option>
                <option value="Maroon">Maroon</option>
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
                <option value="White">White</option>
                <option value="Cream">Cream</option>
                <option value="Beige">Beige</option>
                <option value="Brown">Brown</option>
                <option value="Grey">Grey</option>
                <option value="Pink">Pink</option>
                <option value="Purple">Purple</option>
                <option value="Teal">Teal</option>
                <option value="Olive">Olive</option>
                <option value="Mustard">Mustard</option>
                <option value="Orange">Orange</option>
                <option value="Red">Red</option>
              </select>
            </div>
          </div>

          {/* Price + Details - Row */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-medium text-gray-600">Price (KES)</label>
              <input
                type="number"
                value={suitForm.price || 8500}
                onChange={(e) => setSuitForm({ ...suitForm, price: parseFloat(e.target.value) || 0 })}
                placeholder="8500"
                className="w-full px-2.5 py-1.5 bg-gray-50 border rounded-lg text-xs focus:ring-2 focus:ring-rose-500 outline-none"
                min="0"
                step="100"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-gray-600">Details</label>
              <input
                type="text"
                value={suitForm.detail || ''}
                onChange={(e) => setSuitForm({ ...suitForm, detail: e.target.value })}
                placeholder="Description..."
                className="w-full px-2.5 py-1.5 bg-gray-50 border rounded-lg text-xs focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
          </div>

          {/* Images - Compact Grid with Compression */}
          <div>
            <label className="text-[10px] font-medium text-gray-600 block mb-1">Images (up to 3)</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[0, 1, 2].map(idx => (
                <div
                  key={idx}
                  className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-rose-500 transition relative overflow-hidden bg-gray-50"
                  onClick={() => document.getElementById(`suitImg${idx}`).click()}
                >
                  <input
                    type="file"
                    id={`suitImg${idx}`}
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        // ✅ Compress the image before uploading
                        const compressed = await compressImage(file, 600, 600, 0.7);
                        onImageUpload(idx, compressed);
                      }
                    }}
                  />
                  {suitForm.images && suitForm.images[idx] ? (
                    <>
                      <img src={suitForm.images[idx]} alt="suit" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onRemoveImage(idx); }}
                        className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] hover:bg-black/80"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-[7px] text-gray-400">Upload</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Buttons - Compact */}
          <div className="flex justify-end gap-1.5 pt-1.5 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-3 py-1 text-[10px] text-gray-600 hover:bg-gray-100 rounded-lg transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="px-3 py-1 text-[10px] bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-medium transition flex items-center gap-1 shadow-sm"
            >
              <Save className="w-3 h-3" /> 
              <span>{editSuitId ? 'Save' : 'Add'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};