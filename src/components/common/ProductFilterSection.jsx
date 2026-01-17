import React from "react";
import AnimatedFilterTabs from "./AnimatedFilterTabs";
import ScrollableTabs from "./ScrollableTabs";

const ProductFilterSection = ({
  warehouseFilter,
  onWarehouseChange,
  warehouseTabs,
  warehouseLabel,
  activeCategory,
  setActiveCategory,
  categories = [],
  namespace = "common",
  className = "",
}) => {
  // Default Warehouse Configuration
  const defaultWarehouseTabs = [
    { key: "all", label: "Tất cả" },
    { key: "vinhPhuc", label: "Vĩnh Phúc" },
    { key: "daLat", label: "Lâm Đồng" },
  ];

  const finalWarehouseTabs = warehouseTabs || defaultWarehouseTabs;

  // Category Configuration
  const categoryTabs = [
    { key: "Tất cả", label: "Tất cả" },
    ...categories.map((cat) => ({ key: cat, label: cat })),
  ];

  return (
    <div className={`px-3 pt-5 pb-3 space-y-3 bg-rose-50 ${className}`}>
      {/* Warehouse Tabs */}
      <div className="flex items-center gap-2">
        {warehouseLabel && (
          <span className="text-sm font-semibold text-rose-700 shrink-0">
            {warehouseLabel}
          </span>
        )}
        <AnimatedFilterTabs
          tabs={finalWarehouseTabs}
          activeTab={warehouseFilter}
          onChange={onWarehouseChange}
          layoutIdPrefix={`${namespace}-warehouse-section`}
          className="flex-1"
        />
      </div>

      {/* Category Tabs (Scrollable) */}
      <ScrollableTabs
        tabs={categoryTabs}
        activeTab={activeCategory}
        onTabChange={setActiveCategory}
        layoutIdPrefix={`${namespace}-category-section`}
        className="-mx-3"
      />
    </div>
  );
};

export default ProductFilterSection;
