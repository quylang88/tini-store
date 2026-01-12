import React from 'react';
import { Search, X } from 'lucide-react';
import { WAREHOUSES } from '../../utils/warehouseUtils';

const WarehouseHeader = ({
  searchTerm,
  onSearchChange,
  onClearSearch,
  activeCategory,
  onCategoryChange,
  categories,
  activeWarehouse,
  onWarehouseChange,
}) => {
  return (
    <div className="bg-amber-50/90 sticky top-0 z-10 shadow-sm backdrop-blur">
      <div className="p-3 border-b border-amber-100">
        <div className="flex justify-between items-center mb-3">
          <img
            src="/tiny-shop-transparent.png"
            alt="Tiny Shop"
            className="h-12 w-auto object-contain"
          />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-amber-400" size={16} />
          <input
            type="text"
            placeholder="Tìm tên hoặc mã sản phẩm..."
            className="w-full bg-amber-100/70 pl-9 pr-9 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            value={searchTerm}
            onChange={onSearchChange}
          />
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
        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-amber-700">
          <span>Kho:</span>
          <div className="flex gap-2">
            {WAREHOUSES.map((warehouse) => (
              <button
                key={warehouse.key}
                type="button"
                onClick={() => onWarehouseChange(warehouse.key)}
                className={`px-2 py-1 rounded-full border transition ${
                  activeWarehouse === warehouse.key
                    ? 'bg-rose-500 text-white border-rose-500'
                    : 'bg-white text-amber-700 border-amber-200 hover:border-rose-300'
                }`}
              >
                {warehouse.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-3 pb-0 overflow-x-auto flex gap-2 no-scrollbar border-b border-amber-100">
        <button
          onClick={() => onCategoryChange('Tất cả')}
          className={`whitespace-nowrap py-3 px-2 border-b-2 text-sm font-medium transition-colors ${
            activeCategory === 'Tất cả' ? 'border-rose-500 text-rose-600' : 'border-transparent text-amber-500'
          }`}
        >
          Tất cả
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`whitespace-nowrap py-3 px-2 border-b-2 text-sm font-medium transition-colors ${
              activeCategory === cat ? 'border-rose-500 text-rose-600' : 'border-transparent text-amber-500'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
};

export default WarehouseHeader;
