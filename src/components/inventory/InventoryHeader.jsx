import React from 'react';
import { ScanBarcode, Plus } from 'lucide-react';
import SearchInput from '../common/SearchInput';
import FloatingActionButton from '../common/FloatingActionButton';

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
            <button
              onClick={onShowScanner}
              className="bg-amber-100 text-amber-700 w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform duration-200"
            >
              <ScanBarcode size={20} />
            </button>
          </div>
        </div>
        {/* Ô tìm kiếm dùng chung để giữ UI đồng nhất giữa các màn hình */}
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          onClear={onClearSearch}
          placeholder="Tìm tên hoặc quét mã..."
          inputClassName="w-full bg-amber-100/70 pl-9 pr-9 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
        />
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
              className={`px-2 py-1 text-[10px] font-semibold rounded border transition-colors duration-200 ${
                warehouseFilter === warehouse.key
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-transparent text-amber-700 border-amber-200'
              }`}
            >
              {warehouse.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onToggleCategory('Tất cả')}
            className={`px-2 py-1 text-[10px] font-semibold rounded border transition-colors duration-200 ${
              activeCategories.length === 0
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-transparent text-amber-700 border-amber-200'
            }`}
          >
            Tất cả
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => onToggleCategory(cat)}
              className={`px-2 py-1 text-[10px] font-semibold rounded border transition-colors duration-200 ${
                activeCategories.includes(cat)
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-transparent text-amber-700 border-amber-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      {/* Nút thêm hàng nổi để đồng bộ vị trí với màn tạo đơn và tránh lặp code. */}
      <FloatingActionButton onClick={onOpenModal} ariaLabel="Thêm hàng mới">
        <Plus size={22} />
      </FloatingActionButton>
    </div>
  );
};

export default InventoryHeader;
