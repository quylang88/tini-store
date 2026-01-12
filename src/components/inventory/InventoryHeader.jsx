import React from 'react';
import { Search, ScanBarcode, Plus, X } from 'lucide-react';

const InventoryHeader = ({
  searchTerm,
  onSearchChange,
  onClearSearch,
  onOpenModal,
  onShowScanner,
  activeCategories,
  onToggleCategory,
  warehouseFilter,
  onWarehouseChange,
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
            className="w-full bg-amber-100/70 pl-9 pr-9 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            value={searchTerm}
            onChange={onSearchChange}
          />
          {/* Nút xoá nhanh chỉ hiện khi có nội dung tìm kiếm */}
          {searchTerm && (
            <button
              type="button"
              onClick={onClearSearch}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              aria-label="Xoá nội dung tìm kiếm"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Bộ lọc kho + danh mục (cho phép chọn nhiều) để lọc nhanh danh sách. */}
      <div className="px-3 py-3 border-b border-amber-100 space-y-3">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'daLat', label: 'Lâm Đồng' },
            { key: 'vinhPhuc', label: 'Vĩnh Phúc' },
          ].map((warehouse) => (
            <button
              key={warehouse.key}
              onClick={() => onWarehouseChange(warehouse.key)}
              className={`px-2 py-1 text-[10px] font-semibold rounded border transition ${
                warehouseFilter === warehouse.key
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-transparent text-amber-700 border-amber-200 hover:border-rose-400'
              }`}
            >
              {warehouse.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onToggleCategory('Tất cả')}
            className={`px-2 py-1 text-[10px] font-semibold rounded border transition ${
              activeCategories.length === 0
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-transparent text-amber-700 border-amber-200 hover:border-rose-400'
            }`}
          >
            Tất cả
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => onToggleCategory(cat)}
              className={`px-2 py-1 text-[10px] font-semibold rounded border transition ${
                activeCategories.includes(cat)
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-transparent text-amber-700 border-amber-200 hover:border-rose-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InventoryHeader;
