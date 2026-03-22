import React, { memo, useMemo } from "react";
import SearchBar from "./SearchBar";
import AnimatedFilterTabs from "./AnimatedFilterTabs";
import ScrollableTabs from "./ScrollableTabs";
import { motion, AnimatePresence } from "framer-motion";
import { getWarehouses } from "../../utils/inventory/warehouseUtils";

// Cấu hình kho mặc định (nếu không được cung cấp)
// Tối ưu hóa: Khởi tạo tĩnh mảng tabs một lần để tránh tái cấp phát bộ nhớ.
const DEFAULT_WAREHOUSE_TABS = (() => {
  const warehouses = getWarehouses();
  const hasAll = warehouses.some((w) => w.key === "all");

  const tabs = new Array(
    hasAll ? warehouses.length : warehouses.length + 1,
  );
  let offset = 0;

  if (!hasAll) {
    tabs[0] = { key: "all", label: "Tất cả" };
    offset = 1;
  }

  for (let i = 0; i < warehouses.length; i++) {
    const w = warehouses[i];
    tabs[i + offset] = { key: w.key, label: w.label };
  }

  return tabs;
})();

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
    // Tối ưu hóa: Trả về mảng tĩnh để tránh tái cấp phát bộ nhớ.
    const finalWarehouseTabs = useMemo(() => {
      if (warehouseTabs) return warehouseTabs;
      return DEFAULT_WAREHOUSE_TABS;
    }, [warehouseTabs]);

    // Cấu hình danh mục (Thống nhất)
    // Tối ưu hóa: Sử dụng vòng lặp for thay vì map và spread để giảm thiểu việc cấp phát mảng.
    const categoryTabs = useMemo(() => {
      const hasAll = categories.includes("Tất cả");
      const tabs = new Array(
        hasAll ? categories.length : categories.length + 1,
      );
      let offset = 0;

      if (!hasAll) {
        tabs[0] = { key: "Tất cả", label: "Tất cả" };
        offset = 1;
      }

      for (let i = 0; i < categories.length; i++) {
        const cat = categories[i];
        tabs[i + offset] = { key: cat, label: cat };
      }

      return tabs;
    }, [categories]);

    return (
      <div className={className}>
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          onClearSearch={onClearSearch}
          placeholder={placeholder}
          onToggleSelect={onToggleSelect}
          isSelectionMode={isSelectionMode}
        />

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
                <div className="bg-rose-50/90 backdrop-blur px-3 pb-3 pt-3 space-y-3">
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
