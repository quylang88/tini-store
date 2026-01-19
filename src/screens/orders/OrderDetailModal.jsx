import React from "react";
import SheetModal from "../../components/modals/SheetModal";
import { formatNumber } from "../../utils/helpers";
import { getWarehouseLabel } from "../../utils/warehouseUtils";
import { getOrderDisplayName } from "../../utils/orderUtils";
import useModalCache from "../../hooks/useModalCache";
import Button from "../../components/common/Button";
import { exportOrderToHTML } from "../../utils/fileUtils";
import ExpandableProductName from "../../components/common/ExpandableProductName";

// OrderDetailModal: Xem chi tiết đơn hàng (View Only) -> showCloseIcon={false}
const OrderDetailModal = ({ order, onClose, getOrderStatusInfo }) => {
  // Giữ lại dữ liệu cũ để animation đóng vẫn hiển thị nội dung
  const cachedOrder = useModalCache(order, Boolean(order));

  if (!cachedOrder) return null;

  const orderLabel = cachedOrder.orderNumber
    ? `#${cachedOrder.orderNumber}`
    : `#${cachedOrder.id.slice(-4)}`;
  const orderName = getOrderDisplayName(cachedOrder);
  const statusInfo = getOrderStatusInfo?.(cachedOrder);
  const warehouseLabel = getWarehouseLabel(cachedOrder.warehouse || "daLat");

  // Tính lợi nhuận ước tính (giống logic ở OrderListView)
  const estimatedProfit =
    cachedOrder.items.reduce((sum, item) => {
      const cost = item.cost || 0;
      return sum + (item.price - cost) * item.quantity;
    }, 0) - (cachedOrder.shippingFee || 0);

  const footer = (
    <div className="flex gap-3">
      <Button
        variant="secondary"
        size="sm"
        onClick={onClose}
        className="flex-1"
      >
        Đóng
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={() => exportOrderToHTML(cachedOrder)}
        className="flex-1"
      >
        Xuất hoá đơn
      </Button>
    </div>
  );

  return (
    <SheetModal
      open={Boolean(order)} // Điều khiển đóng mở bằng prop order
      onClose={onClose}
      title={`Chi tiết đơn hàng ${orderLabel}`}
      footer={footer}
      showCloseIcon={false} // View Only
    >
      <div className="space-y-4">
        {/* Header Info */}
        <div className="border-b border-rose-100 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-rose-600">
              {orderName}
            </div>
            {statusInfo && (
              <span
                className={`inline-flex items-center gap-2 px-2 py-1 rounded-full border text-xs font-semibold ${statusInfo.badgeClass}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${statusInfo.dotClass}`}
                />
                {statusInfo.label}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(cachedOrder.date).toLocaleString()}
          </div>
          {cachedOrder.comment && (
            <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
              {cachedOrder.comment}
            </div>
          )}
        </div>

        {/* List Items */}
        <div className="space-y-3">
          {cachedOrder.items.map((item, index) => (
            <div
              key={`${item.productId}-${index}`}
              className="flex justify-between items-start text-sm text-gray-600"
            >
              <div className="min-w-0 flex-1 mr-2">
                <ExpandableProductName
                  name={item.name}
                  textClassName="font-semibold text-rose-900"
                  // Here we don't hide siblings (price), we just allow name expansion.
                  // So we pass no children.
                />
                <div className="text-xs text-gray-400 mt-0.5">
                    x{item.quantity}
                </div>
              </div>
              <div className="font-semibold text-rose-700 whitespace-nowrap">
                {formatNumber(item.price * item.quantity)}đ
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="border-t border-rose-100 pt-3 bg-rose-50 -mx-5 px-5 -mb-2 pb-2 mt-2 space-y-2">
          {cachedOrder.orderType !== "warehouse" && (
            <div className="flex justify-between text-sm text-gray-500">
              <span>Tại kho</span>
              <span className="font-semibold text-rose-700">
                {warehouseLabel}
              </span>
            </div>
          )}
          {cachedOrder.orderType === "delivery" && (
            <>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Khách hàng</span>
                <span className="font-semibold text-rose-700">
                  {cachedOrder.customerName || "-"}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Địa chỉ</span>
                <span className="font-semibold text-rose-700 text-right">
                  {cachedOrder.customerAddress || "-"}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Phí gửi khách</span>
                <span className="font-semibold text-rose-700">
                  {formatNumber(cachedOrder.shippingFee || 0)}đ
                </span>
              </div>
            </>
          )}
          <div
            className={`flex justify-between text-sm text-gray-500 ${
              cachedOrder.orderType === "warehouse"
                ? ""
                : "mt-2 pt-2 border-t border-rose-200/50"
            }`}
          >
            <span className="font-medium text-rose-900">Tổng đơn</span>
            <span className="text-lg font-bold text-rose-600">
              {formatNumber(cachedOrder.total)}đ
            </span>
          </div>
          <div className="flex justify-between text-sm text-emerald-600 pt-1">
            <span className="font-medium">Lợi nhuận</span>
            <span className="font-bold">{formatNumber(estimatedProfit)}đ</span>
          </div>
        </div>
      </div>
    </SheetModal>
  );
};

export default OrderDetailModal;
