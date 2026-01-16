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
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
      categories={categories}
      isExpanded={isExpanded}
      namespace="inventory"
    />
  );
};

export default InventoryHeader;
