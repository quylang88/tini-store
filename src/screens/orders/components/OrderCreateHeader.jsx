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
  // categoryTabs, // Removed as we pass raw names now (or need to map back if passed)
  // But wait, parent passes categoryTabs (objects). We need to support that or change parent.
  // The plan said "Update OrderCreateHeader... Ensure props are mapped correctly".
  // Since ProductFilterHeader takes string array, we might need to extract names if categoryTabs are passed.
  // However, simpler is to use `categoryTabs` prop if passed, or extract strings.
  // Let's check `categoryTabs` structure: { key, label }.
  // If we just pass categories (strings), ProductFilterHeader builds tabs.
  // OrderCreateView computes `categoryTabs` from `categories`.
  // So we can just pass `settings.categories` if available, or map `categoryTabs`.
  // But `OrderCreateHeader` props are fixed by parent usage.
  // We need to see what `categoryTabs` contains. It contains "Tất cả" + categories.
  // So `categories` (the raw list) is not directly passed to OrderCreateHeader currently.
  // We should modify OrderCreateHeader to accept `categories` (raw) or map `categoryTabs` back to strings?
  // Mapping back is hacky.
  // Better: Update `OrderCreateView` to pass `categories` (raw) to `OrderCreateHeader`.
  categoryTabs,
  activeCategory,
  setActiveCategory,
}) => {
  // Extract category names from tabs if needed, or better, change parent.
  // Let's assume we change parent. But for now let's see if we can derive it.
  // categoryTabs = [{key: 'Tất cả'...}, {key: 'X', label: 'X'}...]
  // We can map `categoryTabs.slice(1).map(t => t.key)` to get categories.
  const categories = categoryTabs
    ? categoryTabs.filter(t => t.key !== "Tất cả").map(t => t.key)
    : [];

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

      {/* Unified Search & Filter Component */}
      <ProductFilterHeader
        searchTerm={searchTerm}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
        onClearSearch={() => setSearchTerm("")}
        onShowScanner={() => setShowScanner(true)}

        warehouseFilter={selectedWarehouse}
        onWarehouseChange={setSelectedWarehouse}

        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        categories={categories}

        isExpanded={isHeaderExpanded}
        namespace="order"
        className="!bg-transparent !backdrop-blur-none" // Remove bg because wrapper has it?
        // Wrapper has `bg-amber-50/90`. ProductFilterHeader has `bg-amber-50/90`.
        // If we nest them, opacity adds up.
        // We should probably override className to remove bg or make it transparent.
      />
    </div>
  );
};

export default OrderCreateHeader;
