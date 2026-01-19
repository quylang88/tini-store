import React from "react";
import AnimatedFilterTabs from "./AnimatedFilterTabs";
import ScrollableTabs from "./ScrollableTabs";
import { Calendar, DollarSign, ArrowUp, ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SortButton = ({ active, onClick, icon: Icon, direction, label }) => {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center justify-center gap-1 p-2 rounded-lg border transition-all active:scale-95 ${
        active
          ? "bg-rose-100 border-rose-300 text-rose-700 shadow-sm"
          : "bg-rose-50 border-rose-200 text-rose-400 hover:bg-rose-100 hover:text-rose-500 hover:border-rose-300"
      }`}
      aria-label={label}
    >
      <Icon size={20} strokeWidth={2} />
      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={direction} // Key changes trigger animation
            initial={{ opacity: 0, height: 0, width: 0, scale: 0 }}
            animate={{ opacity: 1, height: "auto", width: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, width: 0, scale: 0 }}
            transition={{ duration: 0.2 }}
          >
            {direction === "asc" ? (
              <ArrowUp size={14} strokeWidth={3} />
            ) : (
              <ArrowDown size={14} strokeWidth={3} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};

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
            <SortButton
              active={sortConfig?.key === "date"}
              direction={sortConfig?.direction}
              onClick={handleDateSort}
              icon={Calendar}
              label="Sort by Date"
            />
            <SortButton
              active={sortConfig?.key === "price"}
              direction={sortConfig?.direction}
              onClick={handlePriceSort}
              icon={DollarSign}
              label="Sort by Price"
            />
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
