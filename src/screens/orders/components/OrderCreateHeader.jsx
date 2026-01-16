import React from "react";
import SearchBarWithScanner from "../../../components/common/SearchBarWithScanner";
import WarehouseFilter from "../../../components/common/WarehouseFilter";
import ScrollableTabs from "../../../components/common/ScrollableTabs";
import { motion, AnimatePresence } from "framer-motion";

const OrderCreateHeader = ({
  orderBeingEdited,
  setShowScanner,
  searchTerm,
  setSearchTerm,
  isHeaderExpanded,
  selectedWarehouse,
  setSelectedWarehouse,
  categoryTabs,
  activeCategory,
  setActiveCategory,
}) => {
  return (
    <div className="bg-amber-50/90 sticky top-0 z-10 shadow-sm backdrop-blur">
      {/* Hàng 1: Tiêu đề */}
      <div className="p-3 border-b border-amber-100 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-amber-900">
            {orderBeingEdited
              ? `Sửa đơn #${
                  orderBeingEdited.orderNumber ?? orderBeingEdited.id.slice(-4)
                }`
              : "Tạo đơn hàng"}
          </h2>
          {orderBeingEdited && (
            <div className="text-xs text-amber-500">
              Chỉnh sửa số lượng sản phẩm trong đơn hàng
            </div>
          )}
        </div>
      </div>

      {/* Hàng 2: Thanh Tìm kiếm & Scan */}
      <div className="px-3 py-2 border-b border-amber-100">
        <SearchBarWithScanner
          searchTerm={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          onClearSearch={() => setSearchTerm("")}
          onShowScanner={() => setShowScanner(true)}
          placeholder="Nhập tên hoặc quét mã sản phẩm..."
        />
      </div>

      <AnimatePresence initial={false}>
        {isHeaderExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {/* Hàng 3: Chọn kho xuất */}
            <div className="px-3 py-2 border-b border-amber-100 flex items-center gap-2 text-xs font-semibold text-amber-700">
              <span className="shrink-0">Kho xuất:</span>
              <WarehouseFilter
                activeTab={selectedWarehouse}
                onChange={setSelectedWarehouse}
                layoutIdPrefix="order-warehouse"
                className="flex-1"
              />
            </div>

            {/* Hàng 4: Thanh Tab Danh mục (Scrollable) */}
            <div className="px-3 py-2 border-b border-amber-100">
              <ScrollableTabs
                tabs={categoryTabs}
                activeTab={activeCategory}
                onTabChange={setActiveCategory}
                layoutIdPrefix="order-category"
                className="-mx-3" // Negative margin to handle padding
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderCreateHeader;
