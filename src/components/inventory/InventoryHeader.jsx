import React from 'react';
import { Search, ScanBarcode, Plus } from 'lucide-react';

const InventoryHeader = ({
  searchTerm,
  onSearchChange,
  onOpenModal,
  onShowScanner,
  activeCategory,
  onCategoryChange,
  categories
}) => {
  return (
    <div className="bg-amber-50/90 sticky top-0 z-10 shadow-sm backdrop-blur">
      {/* Header & Search */}
      <div className="p-3 border-b border-amber-100">
        <div className="flex justify-between items-center mb-3">
          <img
            src="/tiny-shop-transparent.png"
            alt="Tiny Shop"
            className="h-12 w-auto object-contain"
          />
          <div className="flex gap-2">
            <button onClick={onShowScanner} className="bg-amber-100 text-amber-700 w-9 h-9 rounded-full flex items-center justify-center hover:bg-amber-200">
              <ScanBarcode size={20} />
            </button>
            <button onClick={onOpenModal} className="bg-rose-500 text-white w-9 h-9 rounded-full flex items-center justify-center shadow-md shadow-rose-200 active:scale-95">
              <Plus size={20} />
            </button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-amber-400" size={16} />
          <input
            type="text"
            placeholder="Tìm tên hoặc quét mã..."
            className="w-full bg-amber-100/70 pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            value={searchTerm}
            onChange={onSearchChange}
          />
        </div>
      </div>

      {/* Thanh Tab Danh mục */}
      <div className="px-3 pb-0 overflow-x-auto flex gap-2 no-scrollbar border-b border-amber-100">
        <button
          onClick={() => onCategoryChange('Tất cả')}
          className={`whitespace-nowrap py-3 px-2 border-b-2 text-sm font-medium transition-colors ${activeCategory === 'Tất cả' ? 'border-rose-500 text-rose-600' : 'border-transparent text-amber-500'}`}
        >
          Tất cả
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`whitespace-nowrap py-3 px-2 border-b-2 text-sm font-medium transition-colors ${activeCategory === cat ? 'border-rose-500 text-rose-600' : 'border-transparent text-amber-500'}`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
};

export default InventoryHeader;