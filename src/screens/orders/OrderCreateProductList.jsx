import React, { useState } from "react";
import { Plus, Minus, Search, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatInputNumber } from "../../utils/formatters/formatUtils";
import { getWarehouseLabel } from "../../utils/inventory/warehouseUtils";
import ProductFilterSection from "../../components/common/ProductFilterSection";
import useLongPress from "../../hooks/ui/useLongPress";
import ExpandableProductName from "../../components/common/ExpandableProductName";

const QuantityStepper = ({
  qty,
  availableStock,
  adjustQuantity,
  handleQuantityChange,
  id,
}) => {
  // Long press for +
  const addProps = useLongPress(() => adjustQuantity(id, 1, availableStock), {
    enabled: qty < availableStock,
    speed: 150,
    delay: 500,
    accelerate: true,
  });

  // Long press for -
  const subtractProps = useLongPress(
    () => adjustQuantity(id, -1, availableStock),
    {
      enabled: true,
      speed: 150,
      delay: 500,
      accelerate: true,
    },
  );

  return (
    <div className="flex items-center bg-rose-50 rounded-lg h-9 border border-rose-200 overflow-hidden shadow-sm shrink-0">
      <button
        onClick={() => adjustQuantity(id, -1, availableStock)}
        {...subtractProps}
        className="w-9 h-full flex items-center justify-center text-rose-600 active:bg-rose-200 transition select-none"
      >
        <Minus size={16} strokeWidth={2.5} />
      </button>
      <input
        type="number"
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
        {...addProps}
        className="w-9 h-full flex items-center justify-center text-rose-600 active:bg-rose-200 disabled:opacity-30 transition select-none"
      >
        <Plus size={16} strokeWidth={2.5} />
      </button>
    </div>
  );
};

const ProductItem = ({
  p,
  cart,
  selectedWarehouse,
  orderBeingEdited,
  adjustQuantity,
  handleQuantityChange,
  activeCategory,
}) => {
  const [isInfoHidden, setIsInfoHidden] = useState(false);
  const [isNameExpanded, setIsNameExpanded] = useState(false);

  const handleExpandToggle = (targetState) => {
    if (targetState) {
      // Opening: Hide info first -> then expand text
      // FIX: Bỏ setTimeout để hiệu ứng mượt hơn (concurrent animations)
      // ExpandableProductName đã được tối ưu với layout prop và line-clamp
      setIsInfoHidden(true);
      setIsNameExpanded(true);
    } else {
      // Closing: Collapse text first -> then show info
      setIsNameExpanded(false);
      setIsInfoHidden(false);
    }
  };

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

  const rawQty = cart[p.id];
  const isAdded = rawQty !== undefined;
  // Hiển thị value cho input: nếu undefined thì fallback về 0 (nhưng UI sẽ dùng isAdded để ẩn hiện)
  // Nếu rawQty là "" thì giữ nguyên để input rỗng.
  const displayQty = isAdded ? rawQty : 0;

  const warehouseStock =
    selectedWarehouse === "vinhPhuc"
      ? (p.stockByWarehouse?.vinhPhuc ?? 0)
      : (p.stockByWarehouse?.daLat ?? p.stock ?? 0);
  const availableStock = getAvailableStock(p.id, warehouseStock);
  const isOutOfStock = availableStock <= 0;

  // Determine text label based on state
  // Custom logic: use short labels for list items only
  const getShortWarehouseLabel = (key) => {
    if (key === "vinhPhuc") return "Kho VP";
    if (key === "daLat") return "Kho LĐ";
    return getWarehouseLabel(key);
  };
  const warehouseLabel = getShortWarehouseLabel(selectedWarehouse);

  // Logic:
  // "Trong TH đang mở thanh tăng giảm số lượng (isAdded) mà tên dài quá user chạm expand name (isExpanded)
  // thì danh mục và số lượng kho hàng sẽ có animaation biến mất"
  const shouldHideInfo = isInfoHidden;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
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

      <motion.div layout className="flex-1 min-w-0 flex gap-2 text-[10px]">
        {/* Cột 1: Tên + Giá bán - Use Flex grow to take space */}
        <div className="space-y-1 flex-1 min-w-0">
          <ExpandableProductName
            name={p.name}
            className="font-bold text-amber-900 text-sm"
            onExpandChange={handleExpandToggle}
            isExpanded={isNameExpanded}
          >
            {/* 
              Use layout="position" to prevent squashing/stretching during parent width change,
              but allows it to move vertically when name expands.
            */}
            <motion.div layout="position" className="flex items-center">
              <span className="font-bold text-rose-700 text-sm">
                {formatInputNumber(p.price)}
              </span>
              <span className="text-rose-700 font-bold text-sm ml-0.5">đ</span>
            </motion.div>
          </ExpandableProductName>
        </div>

        {/* Cột 2: Danh mục + Kho hàng - Hide completely when needed */}
        <AnimatePresence>
          {!shouldHideInfo && (
            <motion.div
              layout
              initial={{ opacity: 1, width: "auto" }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="text-right space-y-1 overflow-hidden shrink-0"
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
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Bộ điều khiển số lượng - giữ nguyên ở bên phải cùng */}
      <AnimatePresence mode="popLayout" initial={false}>
        {isAdded ? (
          <motion.div
            layout
            key="stepper"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className="flex-shrink-0"
          >
            <QuantityStepper
              qty={displayQty}
              availableStock={availableStock}
              adjustQuantity={adjustQuantity}
              handleQuantityChange={handleQuantityChange}
              id={p.id}
            />
          </motion.div>
        ) : (
          <motion.button
            layout
            key="add-btn"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            onClick={() => adjustQuantity(p.id, 1, availableStock)}
            disabled={isOutOfStock}
            className={`px-3 py-2 rounded-lg text-xs font-bold active:scale-95 transition shrink-0 border ${
              isOutOfStock
                ? "hidden"
                : "bg-amber-100 text-amber-700 border-amber-300 active:bg-amber-200"
            }`}
          >
            <Plus size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const OrderCreateProductList = ({
  filteredProducts,
  handleScroll,
  cart,
  selectedWarehouse,
  orderBeingEdited,
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
  sortConfig,
  onSortChange,
}) => {
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
        sortConfig={sortConfig}
        onSortChange={onSortChange}
      />
      {/* Re-adding -mx-3 to compensate for parent padding */}

      <AnimatePresence mode="popLayout">
        {filteredProducts.map((p) => (
          <ProductItem
            key={p.id}
            p={p}
            cart={cart}
            selectedWarehouse={selectedWarehouse}
            orderBeingEdited={orderBeingEdited}
            adjustQuantity={adjustQuantity}
            handleQuantityChange={handleQuantityChange}
            activeCategory={activeCategory}
          />
        ))}
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
