import React, { useState, useRef } from "react";
import { ShoppingCart } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { formatNumber } from "../../utils/helpers";
import { getWarehouseLabel } from "../../utils/warehouseUtils";
import { getOrderDisplayName } from "../../utils/orderUtils";
import FloatingAddButton from "../../components/common/FloatingAddButton";

// Giao diện danh sách đơn tách riêng để dễ quản lý và thêm nút huỷ đơn
const OrderListView = ({
  orders,
  onCreateOrder,
  getOrderStatusInfo,
  handleTogglePaid,
  handleEditOrder,
  handleCancelOrder,
  onSelectOrder,
  setTabBarVisible,
}) => {
  // Logic scroll ẩn/hiện UI giống màn Inventory
  const [isAddButtonVisible, setIsAddButtonVisible] = useState(true);
  const lastScrollTop = useRef(0);

  const handleScroll = (e) => {
    const currentScrollTop = e.target.scrollTop;
    const direction = currentScrollTop > lastScrollTop.current ? "down" : "up";

    if (Math.abs(currentScrollTop - lastScrollTop.current) > 10) {
      if (direction === "down") {
        setIsAddButtonVisible(false);
        if (setTabBarVisible) setTabBarVisible(false);
      } else {
        setIsAddButtonVisible(true);
        // Chỉ hiện TabBar khi về đầu trang
        if (currentScrollTop < 50) {
          if (setTabBarVisible) setTabBarVisible(true);
        }
      }
      lastScrollTop.current = currentScrollTop;
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent pb-20">
      <div className="bg-amber-50/90 p-4 border-b border-amber-100 sticky top-0 z-10 flex justify-between items-center shadow-sm backdrop-blur">
        <img
          src="/tiny-shop-transparent.png"
          alt="Tiny Shop"
          className="h-12 w-auto object-contain"
        />
      </div>
      {/* Nút tạo đơn mới nổi để tái sử dụng layout và tránh lặp code. */}
      <AnimatePresence>
        {isAddButtonVisible && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed right-5 bottom-24 z-30"
          >
            <FloatingAddButton
              onClick={onCreateOrder}
              ariaLabel="Tạo đơn mới"
              className="!static"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0"
        onScroll={handleScroll}
      >
        {orders.map((order) => {
        const statusInfo = getOrderStatusInfo(order);
        const isPaid = order.status === "paid";
        const orderLabel = order.orderNumber
          ? `#${order.orderNumber}`
          : `#${order.id.slice(-4)}`;
        // Hiển thị tên đơn theo tên khách + địa chỉ rút gọn hoặc "Tại kho".
        const orderName = getOrderDisplayName(order);
        const warehouseLabel = getWarehouseLabel(order.warehouse || "daLat");
        // Với đơn gửi khách, cần hiển thị kho xuất ở hàng trạng thái bên phải.
        const shouldShowWarehouseOnStatus = order.orderType !== "warehouse";
        // Lợi nhuận = (giá bán - giá vốn) - phí gửi để xem nhanh hiệu quả đơn hàng.
        const estimatedProfit =
          order.items.reduce((sum, item) => {
            const cost = item.cost || 0;
            return sum + (item.price - cost) * item.quantity;
          }, 0) - (order.shippingFee || 0);
        return (
          <div
            key={order.id}
            className="bg-white p-4 rounded-xl shadow-sm border border-amber-100 transition cursor-pointer"
            onClick={() => onSelectOrder?.(order)}
          >
            <div className="flex justify-between mb-2 gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-900 text-lg">
                    {orderLabel}
                  </span>
                  <span className="text-xs font-semibold text-amber-600 truncate">
                    {orderName}
                  </span>
                </div>
              </div>
              <span className="text-rose-600 font-bold text-lg bg-rose-50 px-2 py-0.5 rounded">
                {formatNumber(order.total)}đ
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span
                className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-full border ${statusInfo.badgeClass}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${statusInfo.dotClass}`}
                />
                {statusInfo.label}
              </span>
              {shouldShowWarehouseOnStatus && (
                <span className="text-amber-600 font-semibold">
                  Tại kho: {warehouseLabel}
                </span>
              )}
            </div>
            {order.orderType === "delivery" && (
              <div className="text-xs text-gray-400 mb-2">
                Phí gửi khách: {formatNumber(order.shippingFee || 0)}đ
              </div>
            )}
            <div className="text-xs text-gray-400 mb-3 flex items-center gap-1">
              {new Date(order.date).toLocaleString()}
            </div>
            {order.comment && (
              <div className="mb-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                {order.comment}
              </div>
            )}
            <div className="border-t border-dashed border-gray-200 pt-2">
              <div className="flex items-center justify-between text-sm text-emerald-700">
                <span>Lợi nhuận</span>
                <span className="font-semibold text-emerald-700">
                  {formatNumber(estimatedProfit)}đ
                </span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  handleTogglePaid(order.id);
                }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition active:scale-95 ${
                  isPaid
                    ? "text-red-600 bg-red-50 border-red-100"
                    : "text-emerald-600 bg-emerald-50 border-emerald-100"
                }`}
              >
                {isPaid ? "Huỷ thanh toán" : "Thanh toán"}
              </button>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  handleEditOrder(order);
                }}
                className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full active:scale-95 transition"
              >
                Sửa đơn
              </button>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  handleCancelOrder(order.id);
                }}
                className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-full active:scale-95 transition"
              >
                Huỷ đơn
              </button>
            </div>
          </div>
        );
      })}
      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
          <ShoppingCart size={48} className="mb-2 opacity-20" />
          <p>Chưa có đơn hàng nào</p>
        </div>
      )}
    </div>
    </div>
  );
};

export default OrderListView;
