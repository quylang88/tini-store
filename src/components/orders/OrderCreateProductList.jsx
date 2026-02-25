import React, { useState, memo, useMemo } from "react";
import { Plus, Minus, ShoppingCart, Image as ImageIcon } from "lucide-react";
import { formatInputNumber } from "../../utils/formatters/formatUtils";
import { getWarehouseShortLabel } from "../../utils/inventory/warehouseUtils";
import ProductFilterSection from "../../components/common/ProductFilterSection";
import ExpandableProductName from "../../components/common/ExpandableProductName";

const QuantityStepper = memo(
  ({ qty, availableStock, adjustQuantity, handleQuantityChange, id }) => {
    return (
      <div className="flex items-center bg-rose-50 rounded-lg h-9 border border-rose-200 overflow-hidden shadow-sm shrink-0">
        <button
          onClick={() => adjustQuantity(id, -1, availableStock)}
          className="w-9 h-full flex items-center justify-center text-rose-600 active:bg-rose-200 transition select-none"
        >
          <Minus size={16} strokeWidth={2.5} />
        </button>
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          className="w-12 h-full text-center bg-transparent border-x border-rose-200 outline-none text-gray-900 font-bold text-sm m-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          value={qty}
          onChange={(e) =>
            handleQuantityChange(id, e.target.value, availableStock)
          }
          onFocus={(e) => e.target.select()}
        />
        <button
          onClick={() => adjustQuantity(id, 1, availableStock)}
          disabled={qty >= availableStock}
          className="w-9 h-full flex items-center justify-center text-rose-600 active:bg-rose-200 disabled:opacity-30 transition select-none"
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>
    );
  },
);

QuantityStepper.displayName = "QuantityStepper";

const ProductItem = memo(
  ({
    p,
    qty,
    availableStock, // Tối ưu hóa: Prop dạng nguyên thủy giúp React.memo hoạt động hiệu quả
    warehouseLabel, // Tối ưu hóa: Prop dạng nguyên thủy
    adjustQuantity,
    handleQuantityChange,
    activeCategory,
  }) => {
    const [isNameExpanded, setIsNameExpanded] = useState(false);

    // Logic hiển thị/ẩn thông tin phụ (category, kho) dựa trên việc mở rộng tên
    // Khi mở rộng tên -> Ẩn thông tin để nhường chỗ
    const shouldHideInfo = isNameExpanded;

    const handleExpandToggle = (targetState) => {
      setIsNameExpanded(targetState);
    };

    // Đã loại bỏ việc tính toán availableStock bằng useMemo tốn kém tại đây.
    // Logic đã được chuyển lên component cha để giảm overhead cho từng item.
    const isOutOfStock = availableStock <= 0;
    const isAdded = qty !== undefined;
    const displayQty = isAdded ? qty : 0;

    return (
      <div
        className={`bg-amber-50 p-3 rounded-xl shadow-sm border border-amber-100 flex gap-3 items-center transition duration-200 ${
          isOutOfStock ? "opacity-50 grayscale" : ""
        }`}
      >
        <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative border border-gray-200">
          {p.image ? (
            <img
              src={p.image}
              className="w-full h-full object-cover"
              alt={p.name}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon size={16} className="text-gray-300" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex gap-2 text-[10px]">
          {/* Cột 1: Tên + Giá bán - Sử dụng Flex grow để chiếm khoảng trống */}
          <div className="space-y-1 flex-1 min-w-0">
            <ExpandableProductName
              name={p.name}
              className="font-bold text-amber-900 text-sm"
              onExpandChange={handleExpandToggle}
              isExpanded={isNameExpanded}
            >
              <div className="flex items-center">
                <span className="font-bold text-rose-700 text-sm">
                  {formatInputNumber(p.price)}
                </span>
                <span className="text-rose-700 font-bold text-sm ml-0.5">
                  đ
                </span>
              </div>
            </ExpandableProductName>
          </div>

          {/* Cột 2: Danh mục + Kho hàng - Ẩn hoàn toàn khi cần thiết */}
          <div
            className={`text-right space-y-1 overflow-hidden shrink-0 transition-all duration-200 ease-in-out ${
              shouldHideInfo ? "w-0 opacity-0" : "w-auto opacity-100"
            }`}
          >
            <span
              className={`text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded whitespace-nowrap inline-block ${
                activeCategory !== "Tất cả" ? "invisible" : ""
              }`}
            >
              {p.category}
            </span>
            <div className="text-amber-600 text-[10px] origin-right whitespace-nowrap">
              {warehouseLabel}: {availableStock}
            </div>
          </div>
        </div>

        {/* Bộ điều khiển số lượng - giữ nguyên ở bên phải cùng */}
        {isAdded ? (
          <div className="flex-shrink-0">
            <QuantityStepper
              qty={displayQty}
              availableStock={availableStock}
              adjustQuantity={adjustQuantity}
              handleQuantityChange={handleQuantityChange}
              id={p.id}
            />
          </div>
        ) : (
          <button
            onClick={() => adjustQuantity(p.id, 1, availableStock)}
            disabled={isOutOfStock}
            className={`px-3 py-2 rounded-lg text-xs font-bold active:scale-95 transition shrink-0 border ${
              isOutOfStock
                ? "hidden"
                : "bg-amber-100 text-amber-700 border-amber-300 active:bg-amber-200"
            }`}
          >
            <Plus size={20} />
          </button>
        )}
      </div>
    );
  },
);

ProductItem.displayName = "ProductItem";

const OrderCreateProductList = memo(
  ({
    filteredProducts,
    getAvailableStock,
    handleScroll,
    cart,
    selectedWarehouse,
    adjustQuantity,
    handleQuantityChange,
    activeCategory,
    // Props bộ lọc
    setSelectedWarehouse,
    setActiveCategory,
    categories,
    warehouseTabs,
    warehouseLabel,
    className = "",
    style = {},
    sortConfig,
    onSortChange,
  }) => {
    // Tối ưu hóa: Tính toán nhãn kho một lần cho toàn bộ danh sách thay vì từng item
    const shortLabel = useMemo(
      () => getWarehouseShortLabel(selectedWarehouse),
      [selectedWarehouse],
    );

    return (
      <div
        className={`flex-1 overflow-y-auto p-3 space-y-3 pb-40 min-h-0 ${className}`}
        style={style}
        onScroll={handleScroll}
      >
        {/* Phần bộ lọc được render bên trong scroll view */}
        <ProductFilterSection
          warehouseFilter={selectedWarehouse}
          onWarehouseChange={setSelectedWarehouse}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          categories={categories}
          warehouseTabs={warehouseTabs}
          warehouseLabel={warehouseLabel}
          namespace="order-create"
          className="-mx-3 -mt-3 mb-0 pt-5 pb-0" // Không sticky, cuộn theo danh sách
          sortConfig={sortConfig}
          onSortChange={onSortChange}
        />
        {/* Thêm lại -mx-3 để bù cho padding của cha */}

        {filteredProducts.map((p) => {
          // Tối ưu hóa: Tính toán tồn kho ở đây để truyền xuống dưới dạng prop nguyên thủy.
          // Giúp tránh việc React.memo bị vô hiệu hóa do prop function thay đổi reference.
          const stock = getAvailableStock
            ? getAvailableStock(p, selectedWarehouse)
            : 0;

          return (
            <ProductItem
              key={p.id}
              p={p}
              qty={cart[p.id]}
              availableStock={stock}
              warehouseLabel={shortLabel}
              adjustQuantity={adjustQuantity}
              handleQuantityChange={handleQuantityChange}
              activeCategory={activeCategory}
            />
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-24 text-gray-500 w-full">
            <ShoppingCart
              size={48}
              strokeWidth={1.5}
              className="mb-3 opacity-20"
            />
            <p className="text-sm font-medium">Không có sản phẩm nào</p>
          </div>
        )}
      </div>
    );
  },
);

OrderCreateProductList.displayName = "OrderCreateProductList";

export default OrderCreateProductList;
