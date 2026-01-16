import React from "react";
import SearchBarWithScanner from "./SearchBarWithScanner";
import AnimatedFilterTabs from "./AnimatedFilterTabs";
import ScrollableTabs from "./ScrollableTabs";
import { motion, AnimatePresence } from "framer-motion";

const ProductFilterHeader = ({
  // Search
  searchTerm,
  onSearchChange,
  onClearSearch,
  onShowScanner,

  // Warehouse Filter
  warehouseFilter,
  onWarehouseChange,

  // Category Filter
  activeCategory,
  setActiveCategory,
  categories = [], // Array of strings (names)

  // Configuration
  isExpanded = true,
  className = "",
  namespace = "common", // for layoutId uniqueness
  placeholder = "Nhập tên hoặc quét mã sản phẩm...",
}) => {
  // Warehouse Configuration (Unified)
  const warehouseTabs = [
    { key: "all", label: "Tất cả" },
    { key: "vinhPhuc", label: "Vĩnh Phúc" },
    { key: "daLat", label: "Lâm Đồng" },
  ];

  // Category Configuration (Unified)
  const categoryTabs = [
    { key: "Tất cả", label: "Tất cả" },
    ...categories.map((cat) => ({ key: cat, label: cat })),
  ];

  return (
    <div className={`bg-amber-50/90 backdrop-blur ${className}`}>
      {/* Search Bar Row */}
      <div className="p-3 border-b border-amber-100">
        <SearchBarWithScanner
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          onClearSearch={onClearSearch}
          onShowScanner={onShowScanner}
          placeholder={placeholder}
        />
      </div>

      {/* Expandable Filter Area (Warehouse + Categories) */}
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
              {/* Warehouse Tabs */}
              <AnimatedFilterTabs
                tabs={warehouseTabs}
                activeTab={warehouseFilter}
                onChange={onWarehouseChange}
                layoutIdPrefix={`${namespace}-warehouse`}
              />

              {/* Category Tabs (Scrollable) */}
              <ScrollableTabs
                tabs={categoryTabs}
                activeTab={activeCategory}
                onTabChange={setActiveCategory}
                layoutIdPrefix={`${namespace}-category`}
                className="-mx-3" // Negative margin to align with padding of parent
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductFilterHeader;
