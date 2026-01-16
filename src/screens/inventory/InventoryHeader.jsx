import React from "react";
import ProductFilterHeader from "../../components/common/ProductFilterHeader";

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
  return (
    <ProductFilterHeader
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      onClearSearch={onClearSearch}
      onShowScanner={onShowScanner}
      warehouseFilter={warehouseFilter}
      onWarehouseChange={onWarehouseChange}
      // Explicitly pass full options for Inventory (though it defaults to this)
      warehouseTabs={[
        { key: "all", label: "Tất cả" },
        { key: "vinhPhuc", label: "Vĩnh Phúc" },
        { key: "daLat", label: "Lâm Đồng" },
      ]}
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
      categories={categories}
      isExpanded={isExpanded}
      namespace="inventory"
    />
  );
};

export default InventoryHeader;
