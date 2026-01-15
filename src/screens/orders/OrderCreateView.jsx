/* eslint-disable no-unused-vars */
import React from "react";
import {
  ScanBarcode,
  Image as ImageIcon,
  Plus,
  Minus,
  ShoppingCart,
  Search,
} from "lucide-react";
import BarcodeScanner from "../../components/BarcodeScanner";
import SearchInput from "../../components/common/SearchInput";
import { formatInputNumber, formatNumber } from "../../utils/helpers";
import { getWarehouseLabel, WAREHOUSES } from "../../utils/warehouseUtils";
import SheetModal from "../../components/modals/SheetModal";
import Button from "../../components/common/Button";
import AnimatedFilterTabs from "../../components/common/AnimatedFilterTabs";
import { motion, AnimatePresence } from "framer-motion";

// Giao diện tạo/sửa đơn được tách riêng để Orders.jsx gọn hơn
const OrderCreateView = ({
  settings,
  cart,
  showScanner,
  setShowScanner,
  orderBeingEdited,
  selectedWarehouse,
  setSelectedWarehouse,
  orderType,
  setOrderType,
  customerName,
  setCustomerName,
  customerAddress,
  setCustomerAddress,
  shippingFee,
  setShippingFee,
  activeCategory,
  setActiveCategory,
  searchTerm,
  setSearchTerm,
  filteredProducts,
  totalAmount,
  reviewItems,
  isReviewOpen,
  hideBackButton,
  orderComment,
  setOrderComment,
  priceOverrides,
  handlePriceChange,
  handleExitCreate,
  handleCancelDraft,
  handleScanForSale,
  handleQuantityChange,
  adjustQuantity,
  handleOpenReview,
  handleCloseReview,
  handleConfirmOrder,
}) => {
  const categories = settings?.categories || ["Chung"];

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

  const warehouseTabs = WAREHOUSES.map((w) => ({ key: w.key, label: w.label }));

  // Tab danh mục dạng cuộn ngang
  const categoryTabs = [
    { key: "Tất cả", label: "Tất cả" },
    ...categories.map((c) => ({ key: c, label: c })),
  ];

  return (
    <div className="flex flex-col h-full bg-transparent pb-safe-area relative">
      {showScanner && (
        <BarcodeScanner
          onScanSuccess={handleScanForSale}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Header Cố định */}
      <div className="bg-amber-50/90 sticky top-0 z-10 shadow-sm backdrop-blur">
        {/* Hàng 1: Tiêu đề & Nút chức năng */}
        <div className="p-3 border-b border-amber-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-amber-900">
              {orderBeingEdited
                ? `Sửa đơn #${
                    orderBeingEdited.orderNumber ??
                    orderBeingEdited.id.slice(-4)
                  }`
                : "Tạo đơn hàng"}
            </h2>
            {orderBeingEdited && (
              <div className="text-xs text-amber-500">
                Chỉnh sửa số lượng sản phẩm trong đơn hàng
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-1 text-rose-600 bg-rose-50 px-3 py-2 rounded-lg text-sm font-bold active:scale-95 transition"
            >
              <ScanBarcode size={18} />{" "}
              <span className="hidden sm:inline">Quét</span>
            </button>
          </div>
        </div>

        {/* Hàng 2: Thanh Tìm kiếm */}
        <div className="px-3 py-2 border-b border-amber-100">
          <SearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm("")}
            placeholder="Tìm tên hoặc mã sản phẩm..."
            inputClassName="w-full bg-amber-100/70 pl-9 pr-9 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-all"
          />
        </div>

        {/* Hàng 3: Chọn kho xuất */}
        <div className="px-3 py-2 border-b border-amber-100 flex items-center gap-2 text-xs font-semibold text-amber-700">
          <span className="shrink-0">Kho xuất:</span>
          <AnimatedFilterTabs
            tabs={warehouseTabs}
            activeTab={selectedWarehouse}
            onChange={setSelectedWarehouse}
            layoutIdPrefix="order-warehouse"
            className="flex-1"
          />
        </div>

        {/* Hàng 4: Thanh Tab Danh mục (Scrollable) */}
        <div className="px-3 py-2 overflow-x-auto no-scrollbar border-b border-amber-100">
          <div className="flex gap-2 min-w-max">
            {categoryTabs.map((tab) => {
              const isActive = activeCategory === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveCategory(tab.key)}
                  className={`relative px-3 py-2 text-sm font-medium transition-colors z-0 outline-none select-none ${
                    isActive ? "text-rose-600" : "text-amber-500"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="order-category-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* List Sản Phẩm (Đã Lọc) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-40 min-h-0">
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
                    {activeCategory === "Tất cả" && (
                      <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 whitespace-nowrap">
                        {p.category}
                      </span>
                    )}
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
                        onChange={(e) =>
                          handlePriceChange(p.id, e.target.value)
                        }
                        className="font-semibold text-amber-700 bg-transparent w-20 outline-none p-0 text-xs"
                      />
                      <span className="absolute right-0 top-0 pointer-events-none bg-transparent">
                        đ
                      </span>
                    </div>
                    <span className="mx-1">|</span>
                    <span>
                      Kho {getWarehouseLabel(selectedWarehouse)}:{" "}
                      {availableStock}
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
                        handleQuantityChange(
                          p.id,
                          e.target.value,
                          availableStock
                        )
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

      {/* Tạo đơn hàng */}
      {totalAmount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-amber-50/90 border-t border-amber-200 p-4 pb-[calc(env(safe-area-inset-bottom)+28px)] z-[60] shadow-[0_-4px_15px_rgba(0,0,0,0.1)] animate-slide-up backdrop-blur">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-500 font-medium text-sm">Tổng đơn:</span>
            <span className="text-2xl font-bold text-rose-600">
              {formatNumber(totalAmount)}đ
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCancelDraft}
              className="flex-1 bg-white text-amber-700 py-3.5 rounded-xl font-bold border border-amber-200 shadow-sm active:scale-95 transition"
            >
              {orderBeingEdited ? "Huỷ sửa" : "Huỷ đơn"}
            </button>
            <button
              onClick={handleOpenReview}
              className="flex-1 bg-amber-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-rose-200 active:scale-95 transition flex items-center justify-center gap-2 text-lg"
            >
              <ShoppingCart size={20} />{" "}
              {orderBeingEdited ? "Cập nhật đơn" : "Lên đơn"}
            </button>
          </div>
        </div>
      )}

      {/* Modal Review sử dụng SheetModal mới */}
      <SheetModal
        open={isReviewOpen}
        onClose={handleCloseReview}
        title={
          orderBeingEdited ? "Xác nhận cập nhật đơn" : "Xác nhận tạo đơn hàng"
        }
        showCloseIcon={true}
        footer={
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Tổng đơn</span>
              <span className="text-lg font-bold text-rose-600">
                {formatNumber(totalAmount)}đ
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleCloseReview}>
                Xem lại
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmOrder}>
                {orderBeingEdited ? "Cập nhật" : "Xác nhận"}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="text-xs text-amber-600 -mt-2 mb-2">
            Kiểm tra lại danh sách sản phẩm trước khi xác nhận.
          </div>

          <div className="space-y-3">
            {reviewItems.map((item) => (
              <div
                key={item.id}
                className="flex justify-between text-sm text-gray-600"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-amber-900">
                    <span className="font-semibold truncate">{item.name}</span>
                    <span className="text-xs text-gray-400">
                      x{item.quantity}
                    </span>
                  </div>
                </div>
                <div className="font-semibold text-amber-700">
                  {formatNumber(item.price * item.quantity)}đ
                </div>
              </div>
            ))}
            {reviewItems.length === 0 && (
              <div className="text-sm text-gray-400 text-center">
                Chưa có sản phẩm nào.
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-amber-700">
              Loại đơn hàng
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOrderType("delivery")}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                  orderType === "delivery"
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                Gửi khách
              </button>
              <button
                type="button"
                onClick={() => setOrderType("warehouse")}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                  orderType === "warehouse"
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                Bán tại kho
              </button>
            </div>
          </div>

          {orderType === "delivery" ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-amber-700">
                Thông tin khách hàng
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Tên khách hàng"
                className="w-full border border-amber-200 rounded-xl px-3 py-2 text-sm text-amber-900 focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
              <textarea
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Địa chỉ giao hàng"
                rows={2}
                className="w-full border border-amber-200 rounded-xl px-3 py-2 text-sm text-amber-900 focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
              <div>
                <label className="text-xs font-semibold text-amber-700">
                  Phí gửi khách
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatInputNumber(shippingFee)}
                  onChange={(e) => setShippingFee(e.target.value)}
                  placeholder="Ví dụ: 25,000"
                  className="mt-1 w-full border border-amber-200 rounded-xl px-3 py-2 text-sm text-amber-900 focus:outline-none focus:ring-2 focus:ring-rose-200"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {/* Bán tại kho không cần thông tin khách hàng và phí gửi */}
              Đơn bán tại kho - không cần nhập thông tin khách và phí gửi.
            </div>
          )}

          {/* Ghi chú để user nhớ lại tình trạng đơn, đặt cuối modal theo yêu cầu */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-amber-700">
              Ghi chú
            </label>
            <textarea
              value={orderComment}
              onChange={(e) => setOrderComment(e.target.value)}
              placeholder="Ví dụ: khách hẹn lấy vào chiều nay..."
              rows={3}
              className="w-full border border-amber-200 rounded-xl p-3 text-sm text-amber-900 focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
          </div>
        </div>
      </SheetModal>
    </div>
  );
};

export default OrderCreateView;
