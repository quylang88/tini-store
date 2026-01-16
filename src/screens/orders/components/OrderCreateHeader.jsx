import React from "react";
import ProductFilterHeader from "../../../components/common/ProductFilterHeader";

const OrderCreateHeader = ({
  orderBeingEdited,
  setShowScanner,
  searchTerm,
  setSearchTerm,
  isHeaderExpanded,
  selectedWarehouse,
  setSelectedWarehouse,
  categories,
  activeCategory,
  setActiveCategory,
  enableFilters = true,
}) => {
  return (
    <div className="bg-amber-50/90 sticky top-0 z-10 shadow-sm backdrop-blur">
      {/* Hàng 1: Tiêu đề */}
      <div className="p-3 border-b border-amber-100 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-amber-800">
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

      {/* Unified Search & Filter Component */}
      <ProductFilterHeader
        searchTerm={searchTerm}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
        onClearSearch={() => setSearchTerm("")}
        onShowScanner={() => setShowScanner(true)}
        enableFilters={enableFilters}
        warehouseFilter={selectedWarehouse}
        onWarehouseChange={setSelectedWarehouse}
        warehouseTabs={[
          { key: "vinhPhuc", label: "Vĩnh Phúc" },
          { key: "daLat", label: "Lâm Đồng" },
        ]}
        warehouseLabel="Kho xuất:"
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        categories={categories}
        isExpanded={isHeaderExpanded}
        namespace="order"
        className="!bg-transparent !backdrop-blur-none"
      />
    </div>
  );
};

export default OrderCreateHeader;
