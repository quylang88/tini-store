/* eslint-disable no-unused-vars */
import React from 'react';
import { ScanBarcode } from 'lucide-react';
import SearchInput from '../common/SearchInput';
import AnimatedFilterTabs from '../common/AnimatedFilterTabs';
import { motion } from 'framer-motion';

const InventoryHeader = ({
  searchTerm,
  onSearchChange,
  onClearSearch,
  onShowScanner,
  activeCategories,
  onToggleCategory,
  warehouseFilter,
  onWarehouseChange,
  categories
}) => {

  // Chuẩn bị dữ liệu cho AnimatedFilterTabs
  const warehouseTabs = [
    { key: 'all', label: 'Tất cả' },
    { key: 'daLat', label: 'Lâm Đồng' },
    { key: 'vinhPhuc', label: 'Vĩnh Phúc' },
  ];

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
              className="bg-amber-100 text-amber-700 w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition"
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

      {/* Bộ lọc kho + danh mục */}
      <div className="px-3 py-3 border-b border-amber-100 space-y-3">
        {/* Filter Kho - Dùng AnimatedFilterTabs cho hiệu ứng slide mượt */}
        <AnimatedFilterTabs
          tabs={warehouseTabs}
          activeTab={warehouseFilter}
          onChange={onWarehouseChange}
          layoutIdPrefix="inventory-warehouse"
        />

        {/* Filter Danh mục - Vẫn giữ logic chọn nhiều nhưng thêm animation nhẹ */}
        <div className="flex flex-wrap gap-2">
          <motion.button
            layout
            onClick={() => onToggleCategory('Tất cả')}
            className={`px-3 py-1.5 text-[11px] font-semibold rounded-full border transition-colors ${
              activeCategories.length === 0
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-transparent text-amber-700 border-amber-200'
            }`}
          >
            Tất cả
          </motion.button>
          {categories.map(cat => (
            <motion.button
              layout
              key={cat}
              onClick={() => onToggleCategory(cat)}
              className={`px-3 py-1.5 text-[11px] font-semibold rounded-full border transition-colors ${
                activeCategories.includes(cat)
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-transparent text-amber-700 border-amber-200'
              }`}
            >
              {cat}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InventoryHeader;
