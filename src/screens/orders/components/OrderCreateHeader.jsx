import React from "react";
import { ScanBarcode } from "lucide-react";
import SearchInput from "../../../components/common/SearchInput";
import AnimatedFilterTabs from "../../../components/common/AnimatedFilterTabs";
import ScrollableTabs from "../../../components/common/ScrollableTabs";
import { motion, AnimatePresence } from "framer-motion";

const OrderCreateHeader = ({
  orderBeingEdited,
  setShowScanner,
  searchTerm,
  setSearchTerm,
  isHeaderExpanded,
  warehouseTabs,
  selectedWarehouse,
  setSelectedWarehouse,
  categoryTabs,
  activeCategory,
  setActiveCategory,
}) => {
  return (
    <div className="bg-amber-50/90 sticky top-0 z-10 shadow-sm backdrop-blur">
      {/* Hàng 1: Tiêu đề & Nút chức năng */}
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center gap-1 text-rose-600 bg-rose-50 px-3 py-2 rounded-lg text-sm font-bold active:scale-95 transition"
          >
            <ScanBarcode size={18} />{" "}
            <span className="hidden sm:inline">Quét</span>
          </button>
        </div>
      </div>

      {/* Hàng 2: Thanh Tìm kiếm */}
      <div className="px-3 py-2 border-b border-amber-100">
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm("")}
          placeholder="Tìm tên hoặc mã sản phẩm..."
          inputClassName="w-full bg-amber-100/70 pl-9 pr-9 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-all"
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
              <AnimatedFilterTabs
                tabs={warehouseTabs}
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
