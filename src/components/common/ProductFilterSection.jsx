import React from "react";
import AnimatedFilterTabs from "./AnimatedFilterTabs";
import ScrollableTabs from "./ScrollableTabs";
import { Calendar, DollarSign } from "lucide-react";
import SortButton from "../button/SortButton";
import { getWarehouses } from "../../utils/inventory/warehouseUtils";

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
  // Cấu hình kho mặc định
  const defaultWarehouseTabs = [
    { key: "all", label: "Tất cả" },
    ...getWarehouses().map((w) => ({ key: w.key, label: w.label })),
  ];

  const finalWarehouseTabs = warehouseTabs || defaultWarehouseTabs;

  // Cấu hình danh mục
  const categoryTabs = [
    { key: "Tất cả", label: "Tất cả" },
    ...categories.map((cat) => ({ key: cat, label: cat })),
  ];

  const handleDateSort = () => {
    if (sortConfig?.key === "date") {
      // Đảo ngược hướng
      onSortChange({
        key: "date",
        direction: sortConfig.direction === "desc" ? "asc" : "desc",
      });
    } else {
      // Đặt thành ngày giảm dần (Mới nhất trước)
      onSortChange({ key: "date", direction: "desc" });
    }
  };

  const handlePriceSort = () => {
    if (sortConfig?.key === "price") {
      // Đảo ngược hướng
      onSortChange({
        key: "price",
        direction: sortConfig.direction === "asc" ? "desc" : "asc",
      });
    } else {
      // Đặt thành giá tăng dần (Thấp đến Cao)
      onSortChange({ key: "price", direction: "asc" });
    }
  };

  return (
    <div className={`px-3 pt-5 pb-3 space-y-3 bg-rose-50 ${className}`}>
      {/* Tab kho và Nút sắp xếp */}
      <div className="flex items-center gap-2">
        {warehouseLabel && (
          <span className="text-sm font-semibold text-rose-700 shrink-0">
            {warehouseLabel}
          </span>
        )}

        {/* Bọc AnimatedFilterTabs trong container cuộn */}
        <div className="flex-1 overflow-x-auto scrollbar-hide">
          <AnimatedFilterTabs
            tabs={finalWarehouseTabs}
            activeTab={warehouseFilter}
            onChange={onWarehouseChange}
            layoutIdPrefix={`${namespace}-warehouse-section`}
            className="flex-nowrap whitespace-nowrap"
          />
        </div>

        {/* Nút sắp xếp */}
        {onSortChange && (
          <div className="flex items-center gap-2 ml-1 shrink-0">
            <SortButton
              active={sortConfig?.key === "date"}
              direction={sortConfig?.direction}
              onClick={handleDateSort}
              icon={Calendar}
              label="Sort by Date"
              sortType="date"
            />
            <SortButton
              active={sortConfig?.key === "price"}
              direction={sortConfig?.direction}
              onClick={handlePriceSort}
              icon={DollarSign}
              label="Sort by Price"
              sortType="price"
            />
          </div>
        )}
      </div>

      {/* Tab danh mục (Cuộn được) */}
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
