import React, { memo } from "react";
import { motion } from "framer-motion";
import { formatNumber } from "../../utils/formatters/formatUtils";
import {
  getWarehouseLabel,
  getDefaultWarehouse,
  resolveWarehouseKey,
} from "../../utils/inventory/warehouseUtils";
import { getOrderDisplayName } from "../../utils/orders/orderUtils";

const OrderListItem = memo(
  ({
    order,
    getOrderStatusInfo,
    handleTogglePaid,
    handleEditOrder,
    handleCancelOrder,
    onSelectOrder,
  }) => {
    const statusInfo = getOrderStatusInfo(order);
    const isPaid = order.status === "paid";
    const orderLabel = order.orderNumber
      ? `#${order.orderNumber}`
      : `#${order.id.slice(-4)}`;
    // Hiển thị tên đơn theo tên khách + địa chỉ rút gọn hoặc "Tại kho".
    const orderName = getOrderDisplayName(order);
    const warehouseLabel = getWarehouseLabel(
      resolveWarehouseKey(order.warehouse) || getDefaultWarehouse().key,
    );
    // Với đơn gửi khách, cần hiển thị kho xuất ở hàng trạng thái bên phải.
    const shouldShowWarehouseOnStatus = order.orderType !== "warehouse";
    // Lợi nhuận = (giá bán - giá vốn) - phí gửi để xem nhanh hiệu quả đơn hàng.
    const estimatedProfit =
      order.items.reduce((sum, item) => {
        const cost = item.cost || 0;
        return sum + (item.price - cost) * item.quantity;
      }, 0) - (order.shippingFee || 0);

    return (
      <motion.div
        whileTap={{ scale: 0.96 }}
        className="bg-amber-50 p-4 rounded-xl shadow-sm border border-amber-100 cursor-pointer hover:shadow-md transition-shadow"
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
            <span className={`w-2 h-2 rounded-full ${statusInfo.dotClass}`} />
            {statusInfo.label}
          </span>
          {shouldShowWarehouseOnStatus && (
            <span className="text-amber-600 font-semibold">
              Tại kho: {warehouseLabel}
            </span>
          )}
        </div>
        {order.orderType === "delivery" && (
          <div className="text-xs text-gray-600 mb-2">
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
                ? "text-red-600 bg-red-50 border-red-300"
                : "text-emerald-600 bg-emerald-50 border-emerald-300"
            }`}
          >
            {isPaid ? "Huỷ thanh toán" : "Thanh toán"}
          </button>
          <button
            onClick={(event) => {
              event.stopPropagation();
              handleEditOrder(order);
            }}
            className="text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-300 px-3 py-1.5 rounded-full active:scale-95 transition"
          >
            Sửa đơn
          </button>
          <button
            onClick={(event) => {
              event.stopPropagation();
              handleCancelOrder(order.id);
            }}
            className="text-xs font-semibold text-red-600 bg-red-50 border border-red-300 px-3 py-1.5 rounded-full active:scale-95 transition"
          >
            Huỷ đơn
          </button>
        </div>
      </motion.div>
    );
  },
);

OrderListItem.displayName = "OrderListItem";

export default OrderListItem;
