import React from "react";
import { ScanBarcode } from "lucide-react";
import SearchInput from "../../components/common/SearchInput";
import AnimatedFilterTabs from "../../components/common/AnimatedFilterTabs";
import { motion, AnimatePresence } from "framer-motion";

const InventoryHeader = ({
  searchTerm,
  onSearchChange,
  onClearSearch,
  onShowScanner,
  activeCategories,
  onToggleCategory,
  warehouseFilter,
  onWarehouseChange,
  categories,
  isExpanded = true,
}) => {
  // Chuẩn bị dữ liệu cho AnimatedFilterTabs
  const warehouseTabs = [
    { key: "all", label: "Tất cả" },
    { key: "daLat", label: "Lâm Đồng" },
    { key: "vinhPhuc", label: "Vĩnh Phúc" },
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
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden border-b border-amber-100"
          >
            <div className="px-3 py-3 space-y-3">
              {/* Filter Kho - Dùng AnimatedFilterTabs cho hiệu ứng slide mượt */}
              <AnimatedFilterTabs
                tabs={warehouseTabs}
                activeTab={warehouseFilter}
                onChange={onWarehouseChange}
                layoutIdPrefix="inventory-warehouse"
              />

              {/* Filter Danh mục - Vẫn giữ logic chọn nhiều nhưng thêm animation nhẹ */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onToggleCategory("Tất cả")}
                  className={`relative px-3 py-1.5 text-[11px] font-semibold rounded-full border transition-colors z-0 ${
                    activeCategories.length === 0
                      ? "text-white border-transparent"
                      : "text-amber-700 border-amber-200 bg-transparent"
                  }`}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <AnimatePresence>
                    {activeCategories.length === 0 && (
                      <motion.div
                        layoutId="inventory-cat-active"
                        className="absolute inset-0 bg-amber-500 rounded-full -z-10"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </AnimatePresence>
                  <span className="relative z-10">Tất cả</span>
                </button>
                {categories.map((cat) => {
                  const isActive = activeCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => onToggleCategory(cat)}
                      className={`relative px-3 py-1.5 text-[11px] font-semibold rounded-full border transition-colors z-0 ${
                        isActive
                          ? "text-white border-transparent"
                          : "text-amber-700 border-amber-200 bg-transparent"
                      }`}
                      style={{ WebkitTapHighlightColor: "transparent" }}
                    >
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            layoutId={`inventory-cat-${cat}`}
                            className="absolute inset-0 bg-amber-500 rounded-full -z-10"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                      </AnimatePresence>
                      <span className="relative z-10">{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InventoryHeader;
