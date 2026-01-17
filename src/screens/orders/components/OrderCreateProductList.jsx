import React from "react";
import { Plus, Minus, Search, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatInputNumber } from "../../../utils/helpers";
import { getWarehouseLabel } from "../../../utils/warehouseUtils";
import ProductFilterSection from "../../../components/common/ProductFilterSection";

const OrderCreateProductList = ({
  filteredProducts,
  handleScroll,
  cart,
  selectedWarehouse,
  orderBeingEdited,
  priceOverrides,
  adjustQuantity,
  handleQuantityChange,
  activeCategory,
  // Filter Props
  setSelectedWarehouse,
  setActiveCategory,
  categories,
  warehouseTabs,
  warehouseLabel,
  className = "",
  style = {},
}) => {
  // Khi đang sửa đơn, cộng lại số lượng cũ để hiển thị tồn kho chính xác
  const getAvailableStock = (productId, stock) => {
    if (!orderBeingEdited) return stock;
    const orderWarehouse = orderBeingEdited.warehouse || "daLat";
    if (orderWarehouse !== selectedWarehouse) return stock;
    const previousQty =
      orderBeingEdited.items.find((item) => item.productId === productId)
        ?.quantity || 0;
    return stock + previousQty;
  };

  return (
    <div
      className={`flex-1 overflow-y-auto p-3 space-y-3 pb-40 min-h-0 ${className}`}
      style={style}
      onScroll={handleScroll}
    >
      {/* Filter Section rendered inside the scroll view */}
      <ProductFilterSection
        warehouseFilter={selectedWarehouse}
        onWarehouseChange={setSelectedWarehouse}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        categories={categories}
        warehouseTabs={warehouseTabs}
        warehouseLabel={warehouseLabel}
        namespace="order-create"
        className="-mx-3 -mt-3 mb-0 pt-5 pb-0" // Not sticky, scrolls with list
      />
      {/* Re-adding -mx-3 to compensate for parent padding */}

      <AnimatePresence mode="popLayout">
        {filteredProducts.map((p) => {
          const qty = cart[p.id] || 0;
          const warehouseStock =
            selectedWarehouse === "vinhPhuc"
              ? p.stockByWarehouse?.vinhPhuc ?? 0
              : p.stockByWarehouse?.daLat ?? p.stock ?? 0;
          const availableStock = getAvailableStock(p.id, warehouseStock);
          const isOutOfStock = availableStock <= 0;

          return (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              key={p.id}
              className={`bg-amber-50 p-3 rounded-xl shadow-sm border border-amber-100 flex gap-3 items-center ${
                isOutOfStock ? "opacity-50 grayscale" : ""
              }`}
            >
              <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative border border-gray-200">
                {p.image ? (
                  <img
                    src={p.image}
                    className="w-full h-full object-cover"
                    alt={p.name}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={16} className="text-gray-300" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 grid grid-cols-2 gap-2 text-[10px]">
                {/* Cột 1: Tên + Giá bán */}
                <div className="space-y-1">
                  <div className="font-bold text-rose-800 text-sm truncate">
                    {p.name}
                  </div>
                  <div className="flex items-center">
                    <span className="font-bold text-rose-700 text-sm">
                      {priceOverrides?.[p.id] !== undefined
                        ? formatInputNumber(priceOverrides[p.id])
                        : formatInputNumber(p.price)}
                    </span>
                    <span className="text-rose-700 font-bold text-sm ml-0.5">
                      đ
                    </span>
                  </div>
                </div>

                {/* Cột 2: Danh mục + Kho hàng */}
                <div className="text-right space-y-1">
                  <span
                    className={`text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded whitespace-nowrap inline-block ${
                      activeCategory !== "Tất cả" ? "invisible" : ""
                    }`}
                  >
                    {p.category}
                  </span>
                  <div className="text-amber-600 text-[10px]">
                    Kho {getWarehouseLabel(selectedWarehouse)}: {availableStock}
                  </div>
                </div>
              </div>

              {/* Bộ điều khiển số lượng - giữ nguyên ở bên phải cùng */}
              {qty > 0 ? (
                <div className="flex items-center bg-rose-50 rounded-lg h-9 border border-rose-100 overflow-hidden shadow-sm shrink-0">
                  <button
                    onClick={() => adjustQuantity(p.id, -1, availableStock)}
                    className="w-9 h-full flex items-center justify-center text-rose-600 active:bg-rose-200 transition"
                  >
                    <Minus size={16} strokeWidth={2.5} />
                  </button>
                  <input
                    type="number"
                    className="w-12 h-full text-center bg-transparent border-x border-rose-100 outline-none text-rose-900 font-bold text-sm m-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={qty}
                    onChange={(e) =>
                      handleQuantityChange(p.id, e.target.value, availableStock)
                    }
                    onFocus={(e) => e.target.select()}
                  />
                  <button
                    onClick={() => adjustQuantity(p.id, 1, availableStock)}
                    disabled={qty >= availableStock}
                    className="w-9 h-full flex items-center justify-center text-rose-600 active:bg-rose-200 disabled:opacity-30 transition"
                  >
                    <Plus size={16} strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => adjustQuantity(p.id, 1, availableStock)}
                  disabled={isOutOfStock}
                  className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg text-xs font-bold active:scale-95 transition shrink-0"
                >
                  {isOutOfStock ? "Hết" : "Thêm"}
                </button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {filteredProducts.length === 0 && (
        <div className="text-center text-gray-400 mt-10">
          <div className="flex justify-center mb-2">
            <Search size={32} className="opacity-20" />
          </div>
          <p>Không tìm thấy sản phẩm</p>
        </div>
      )}
    </div>
  );
};

export default OrderCreateProductList;
