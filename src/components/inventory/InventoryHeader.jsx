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
    <div className="bg-white sticky top-0 z-10 shadow-sm">
      {/* Header & Search */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold text-gray-800">Kho Hàng</h2>
          <div className="flex gap-2">
            <button onClick={onShowScanner} className="bg-gray-100 text-gray-700 w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-200">
              <ScanBarcode size={20} />
            </button>
            <button onClick={onOpenModal} className="bg-indigo-600 text-white w-9 h-9 rounded-full flex items-center justify-center shadow-md active:scale-95">
              <Plus size={20} />
            </button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Tìm tên hoặc quét mã..."
            className="w-full bg-gray-100 pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={onSearchChange}
          />
        </div>
      </div>

      {/* Thanh Tab Danh mục */}
      <div className="px-3 pb-0 overflow-x-auto flex gap-2 no-scrollbar border-b border-gray-100">
        <button
          onClick={() => onCategoryChange('Tất cả')}
          className={`whitespace-nowrap py-3 px-2 border-b-2 text-sm font-medium transition-colors ${activeCategory === 'Tất cả' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}
        >
          Tất cả
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`whitespace-nowrap py-3 px-2 border-b-2 text-sm font-medium transition-colors ${activeCategory === cat ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
};

export default InventoryHeader;
