import React, { memo, useMemo } from "react";
import SearchBar from "./SearchBar";
import AnimatedFilterTabs from "./AnimatedFilterTabs";
import ScrollableTabs from "./ScrollableTabs";
import { motion, AnimatePresence } from "framer-motion";
import { getWarehouses } from "../../utils/inventory/warehouseUtils";

const ProductFilterHeader = memo(
  ({
    // Tìm kiếm
    searchTerm,
    onSearchChange,
    onClearSearch,

    // Bộ lọc kho
    warehouseFilter,
    onWarehouseChange,
    warehouseTabs, // Prop tùy chọn
    warehouseLabel, // Prop tùy chọn cho nhãn văn bản

    // Bộ lọc danh mục
    activeCategory,
    setActiveCategory,
    categories = [], // Mảng chuỗi (tên)

    // Cấu hình
    isExpanded = true,
    enableFilters = true, // Prop mới để bật tắt hiển thị phần bộ lọc
    className = "",
    namespace = "common", // để đảm bảo tính duy nhất của layoutId
    placeholder = "Nhập tên hoặc mã sản phẩm...",

    // Chế độ chọn (Mới)
    onToggleSelect,
    isSelectionMode,
  }) => {
    // Cấu hình kho mặc định (nếu không được cung cấp)
    const finalWarehouseTabs = useMemo(() => {
      if (warehouseTabs) return warehouseTabs;
      return [
        { key: "all", label: "Tất cả" },
        ...getWarehouses().map((w) => ({ key: w.key, label: w.label })),
      ];
    }, [warehouseTabs]);

    // Cấu hình danh mục (Thống nhất)
    const categoryTabs = useMemo(
      () => [
        { key: "Tất cả", label: "Tất cả" },
        ...categories.map((cat) => ({ key: cat, label: cat })),
      ],
      [categories],
    );

    return (
      <div className={`bg-rose-50/90 backdrop-blur ${className}`}>
        {/* Hàng thanh tìm kiếm */}
        <div className="px-3 pt-3 pb-1">
          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            onClearSearch={onClearSearch}
            placeholder={placeholder}
            onToggleSelect={onToggleSelect}
            isSelectionMode={isSelectionMode}
          />
        </div>

        {/* Khu vực bộ lọc mở rộng (Kho + Danh mục) */}
        {enableFilters && (
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 pt-3 space-y-3">
                  {/* Tab kho */}
                  <div className="flex items-center gap-2">
                    {warehouseLabel && (
                      <span className="text-xs font-semibold text-rose-700 shrink-0">
                        {warehouseLabel}
                      </span>
                    )}
                    <AnimatedFilterTabs
                      tabs={finalWarehouseTabs}
                      activeTab={warehouseFilter}
                      onChange={onWarehouseChange}
                      layoutIdPrefix={`${namespace}-warehouse`}
                      className="flex-1"
                    />
                  </div>

                  {/* Tab danh mục (Cuộn được) */}
                  <ScrollableTabs
                    tabs={categoryTabs}
                    activeTab={activeCategory}
                    onTabChange={setActiveCategory}
                    layoutIdPrefix={`${namespace}-category`}
                    className="-mx-3" // Margin âm để căn chỉnh với padding của cha
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    );
  },
);

ProductFilterHeader.displayName = "ProductFilterHeader";

export default ProductFilterHeader;
