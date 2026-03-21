import React, { memo } from "react";
import { Check } from "lucide-react";
import PaidStamp from "../common/PaidStamp";
import {
  formatNumber,
  formatDateTime,
} from "../../utils/formatters/formatUtils";
import {
  getWarehouseLabel,
  getDefaultWarehouse,
  resolveWarehouseKey,
} from "../../utils/inventory/warehouseUtils";
import { getOrderDisplayName } from "../../utils/orders/orderUtils";

// Component hiển thị từng dòng đơn hàng trong danh sách
// Sử dụng React.memo để tối ưu hiệu năng render khi props không đổi
const OrderListItem = memo(
  ({
    order,
    getOrderStatusInfo,
    handleTogglePaid,
    handleEditOrder,
    handleCancelOrder,
    onSelectOrder,
    isMergeMode = false,
    isSelected = false,
    mergeEligibility = { canSelect: true, reason: "" },
    onToggleOrderSelection,
  }) => {
    const statusInfo = getOrderStatusInfo(order);
    const isPaid = order.status === "paid";
    const isDisabledInMerge =
      isMergeMode && !isSelected && !mergeEligibility?.canSelect;
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
    // Tối ưu hóa: Thay thế reduce() bằng vòng lặp for...of để tăng tốc độ lặp, tránh chi phí callback
    let estimatedProfit = -(order.shippingFee || 0);
    for (const item of order.items) {
      const cost = item.cost || 0;
      estimatedProfit += (item.price - cost) * item.quantity;
    }

    return (
      <div
        className={`p-4 rounded-xl shadow-sm border cursor-pointer hover:shadow-md transition-all duration-200 active:scale-95 relative overflow-hidden ${
          isMergeMode
            ? isSelected
              ? "bg-rose-50 border-rose-500 ring-1 ring-rose-500"
              : isDisabledInMerge
                ? "bg-gray-100 border-gray-200 opacity-75"
                : "bg-amber-50 border-amber-100"
            : isPaid
              ? "bg-gray-50 border-gray-200"
              : "bg-amber-50 border-amber-100"
        }`}
        onClick={() => {
          if (isMergeMode) {
            if (isDisabledInMerge) return;
            onToggleOrderSelection?.(order);
            return;
          }

          onSelectOrder?.(order);
        }}
      >
        <PaidStamp isPaid={isPaid} variant="list" />
        <div
          className={`transition-all duration-300 ${isPaid ? "grayscale opacity-75" : ""}`}
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
            <div className="h-6 flex items-center gap-2">
              {!isPaid && !isMergeMode && (
                <span
                  className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-full border ${statusInfo.badgeClass}`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${statusInfo.dotClass}`}
                  />
                  {statusInfo.label}
                </span>
              )}
              {isMergeMode && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold ${
                    isSelected
                      ? "border-rose-300 bg-rose-100 text-rose-700"
                      : mergeEligibility?.reason
                        ? "border-gray-300 bg-gray-100 text-gray-600"
                        : "border-amber-200 bg-amber-100 text-amber-700"
                  }`}
                >
                  {isSelected
                    ? "Đã chọn"
                    : mergeEligibility?.reason || "Có thể gộp"}
                </span>
              )}
            </div>
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
            {formatDateTime(order.date)}
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
          {isMergeMode ? (
            <div className="mt-3 flex justify-end">
              {isSelected ? (
                <div className="w-9 h-9 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-sm">
                  <Check size={18} strokeWidth={3} />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full border-2 border-gray-300 bg-white" />
              )}
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap justify-end gap-2 h-8 items-center">
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  handleTogglePaid(order);
                }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition active:scale-95 relative z-20 whitespace-nowrap ${
                  isPaid
                    ? "text-red-600 bg-red-50 border-red-300"
                    : "text-emerald-600 bg-emerald-50 border-emerald-300"
                }`}
              >
                {isPaid ? "Huỷ thanh toán" : "Thanh toán"}
              </button>

              {!isPaid && (
                <div className="flex gap-2">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleEditOrder(order);
                    }}
                    className="text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-300 px-3 py-1.5 rounded-full active:scale-95 transition whitespace-nowrap"
                  >
                    Sửa đơn
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleCancelOrder(order);
                    }}
                    className="text-xs font-semibold text-red-600 bg-red-50 border border-red-300 px-3 py-1.5 rounded-full active:scale-95 transition whitespace-nowrap"
                  >
                    Huỷ đơn
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
);

OrderListItem.displayName = "OrderListItem";

export default OrderListItem;
