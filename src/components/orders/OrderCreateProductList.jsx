import React, { useState } from "react";
import { Plus, Minus, ShoppingCart, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatInputNumber } from "../../utils/formatters/formatUtils";
import {
  normalizeWarehouseStock,
  getDefaultWarehouse,
  getWarehouseShortLabel,
  resolveWarehouseKey,
} from "../../utils/inventory/warehouseUtils";
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
  // Nhấn giữ để tăng
  const addProps = useLongPress(() => adjustQuantity(id, 1, availableStock), {
    enabled: qty < availableStock,
    speed: 150,
    delay: 500,
    accelerate: true,
  });

  // Nhấn giữ để giảm
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
      // Mở rộng: Ẩn thông tin và mở rộng text đồng thời để hiệu ứng mượt hơn
      // ExpandableProductName đã được tối ưu với layout prop và line-clamp
      setIsInfoHidden(true);
      setIsNameExpanded(true);
    } else {
      // Thu gọn: Thu gọn text và hiện thông tin đồng thời
      setIsNameExpanded(false);
      setIsInfoHidden(false);
    }
  };

  // Khi đang sửa đơn, cộng lại số lượng cũ để hiển thị tồn kho chính xác
  const getAvailableStock = (productId, stock) => {
    if (!orderBeingEdited) return stock;
    const orderWarehouse =
      resolveWarehouseKey(orderBeingEdited.warehouse) ||
      getDefaultWarehouse().key;
    if (orderWarehouse !== resolveWarehouseKey(selectedWarehouse)) return stock;
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

  const stockByWarehouse = normalizeWarehouseStock(p);
  const resolvedWarehouseKey = resolveWarehouseKey(selectedWarehouse);
  const warehouseStock = stockByWarehouse[resolvedWarehouseKey] || 0;

  const availableStock = getAvailableStock(p.id, warehouseStock);
  const isOutOfStock = availableStock <= 0;

  const warehouseLabel = getWarehouseShortLabel(selectedWarehouse);

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
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={16} className="text-gray-300" />
          </div>
        )}
      </div>

      <motion.div layout className="flex-1 min-w-0 flex gap-2 text-[10px]">
        {/* Cột 1: Tên + Giá bán - Sử dụng Flex grow để chiếm khoảng trống */}
        <div className="space-y-1 flex-1 min-w-0">
          <ExpandableProductName
            name={p.name}
            className="font-bold text-amber-900 text-sm"
            onExpandChange={handleExpandToggle}
            isExpanded={isNameExpanded}
          >
            {/* 
              Sử dụng layout="position" để ngăn việc bóp méo/kéo giãn trong quá trình thay đổi chiều rộng cha,
              nhưng cho phép nó di chuyển theo chiều dọc khi tên mở rộng.
            */}
            <motion.div layout="position" className="flex items-center">
              <span className="font-bold text-rose-700 text-sm">
                {formatInputNumber(p.price)}
              </span>
              <span className="text-rose-700 font-bold text-sm ml-0.5">đ</span>
            </motion.div>
          </ExpandableProductName>
        </div>

        {/* Cột 2: Danh mục + Kho hàng - Ẩn hoàn toàn khi cần thiết */}
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
};

export default OrderCreateProductList;
