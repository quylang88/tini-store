import React from "react";
import { ScanBarcode } from "lucide-react";
import SearchInput from "../../components/common/SearchInput";
import AnimatedFilterTabs from "../../components/common/AnimatedFilterTabs";
import ScrollableTabs from "../../components/common/ScrollableTabs";
import { motion, AnimatePresence } from "framer-motion";

const InventoryHeader = ({
  searchTerm,
  onSearchChange,
  onClearSearch,
  onShowScanner,
  activeCategory,
  setActiveCategory,
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

  // Chuẩn bị dữ liệu cho ScrollableTabs (danh mục)
  const categoryTabs = [
    { key: "Tất cả", label: "Tất cả" },
    ...categories.map((cat) => ({ key: cat, label: cat })),
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

              {/* Filter Danh mục - Dùng ScrollableTabs cho giống CreateOrder */}
              <ScrollableTabs
                tabs={categoryTabs}
                activeTab={activeCategory}
                onTabChange={setActiveCategory}
                layoutIdPrefix="inventory-category"
                className="-mx-3" // Negative margin to align with padding of parent
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InventoryHeader;
