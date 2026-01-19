import React from "react";
import AnimatedFilterTabs from "./AnimatedFilterTabs";
import ScrollableTabs from "./ScrollableTabs";
import { Calendar, DollarSign } from "lucide-react";

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
  sortConfig,
  onSortChange,
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

  const handleDateSort = () => {
    if (sortConfig?.key === "date") {
      // Toggle direction
      onSortChange({
        key: "date",
        direction: sortConfig.direction === "desc" ? "asc" : "desc",
      });
    } else {
      // Set to date desc (Newest first)
      onSortChange({ key: "date", direction: "desc" });
    }
  };

  const handlePriceSort = () => {
    if (sortConfig?.key === "price") {
      // Toggle direction
      onSortChange({
        key: "price",
        direction: sortConfig.direction === "asc" ? "desc" : "asc",
      });
    } else {
      // Set to price asc (Low to High)
      onSortChange({ key: "price", direction: "asc" });
    }
  };

  return (
    <div className={`px-3 pt-5 pb-3 space-y-3 bg-rose-50 ${className}`}>
      {/* Warehouse Tabs and Sort Buttons */}
      <div className="flex items-center gap-2">
        {warehouseLabel && (
          <span className="text-sm font-semibold text-rose-700 shrink-0">
            {warehouseLabel}
          </span>
        )}

        {/* Wrap AnimatedFilterTabs in a scrolling container */}
        <div className="flex-1 overflow-x-auto scrollbar-hide">
           <AnimatedFilterTabs
            tabs={finalWarehouseTabs}
            activeTab={warehouseFilter}
            onChange={onWarehouseChange}
            layoutIdPrefix={`${namespace}-warehouse-section`}
            className="flex-nowrap whitespace-nowrap"
          />
        </div>

        {/* Sort Buttons */}
        {onSortChange && (
          <div className="flex items-center gap-2 ml-1 shrink-0">
            <button
              onClick={handleDateSort}
              className={`p-2 rounded-lg transition-colors ${
                sortConfig?.key === "date"
                  ? "bg-rose-200 text-rose-800"
                  : "bg-white/50 text-gray-500 hover:bg-white"
              }`}
              aria-label="Sort by Date"
            >
              <Calendar size={20} strokeWidth={2} />
            </button>
            <button
              onClick={handlePriceSort}
              className={`p-2 rounded-lg transition-colors ${
                sortConfig?.key === "price"
                  ? "bg-rose-200 text-rose-800"
                  : "bg-white/50 text-gray-500 hover:bg-white"
              }`}
              aria-label="Sort by Price"
            >
              <DollarSign size={20} strokeWidth={2} />
            </button>
          </div>
        )}
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
