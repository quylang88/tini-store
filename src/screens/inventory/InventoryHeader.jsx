import React from "react";
import SearchBarWithScanner from "../../components/common/SearchBarWithScanner";
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
    <div className="bg-amber-50/90 backdrop-blur">
      {/* Search & Scanner Row */}
      <div className="p-3 border-b border-amber-100">
        <SearchBarWithScanner
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          onClearSearch={onClearSearch}
          onShowScanner={onShowScanner}
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

              {/* Filter Danh mục - Dùng ScrollableTabs*/}
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
