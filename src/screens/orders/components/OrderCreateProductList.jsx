import React from "react";
import { Plus, Minus, Search, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatInputNumber } from "../../../utils/helpers";
import { getWarehouseLabel } from "../../../utils/warehouseUtils";

const OrderCreateProductList = ({
  filteredProducts,
  handleScroll,
  cart,
  selectedWarehouse,
  orderBeingEdited,
  priceOverrides,
  handlePriceChange,
  adjustQuantity,
  handleQuantityChange,
  activeCategory,
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
      className="flex-1 overflow-y-auto p-3 space-y-3 pb-40 min-h-0"
      onScroll={handleScroll}
    >
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
              className={`bg-white p-3 rounded-xl shadow-sm border border-amber-100 flex gap-3 items-center ${
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

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div className="font-bold text-sm text-amber-900 truncate pr-1">
                    {p.name}
                  </div>
                  {/* Badge danh mục */}
                  <span
                    className={`text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 whitespace-nowrap ${
                      activeCategory !== "Tất cả" ? "invisible" : ""
                    }`}
                  >
                    {p.category}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5 flex items-center">
                  <div className="relative inline-block border-b border-amber-200 border-dashed">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={
                        priceOverrides?.[p.id] !== undefined
                          ? formatInputNumber(priceOverrides[p.id])
                          : formatInputNumber(p.price)
                      }
                      onChange={(e) => handlePriceChange(p.id, e.target.value)}
                      className="font-semibold text-amber-700 bg-transparent w-20 outline-none p-0 text-xs"
                    />
                    <span className="absolute right-0 top-0 pointer-events-none bg-transparent">
                      đ
                    </span>
                  </div>
                  <span className="mx-1">|</span>
                  <span>
                    Kho {getWarehouseLabel(selectedWarehouse)}: {availableStock}
                  </span>
                </div>
              </div>

              {/* Bộ điều khiển số lượng */}
              {qty > 0 ? (
                <div className="flex items-center bg-rose-50 rounded-lg h-9 border border-rose-100 overflow-hidden shadow-sm">
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
                  className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg text-xs font-bold active:scale-95 transition"
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
