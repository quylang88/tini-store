import React from 'react';
import SheetModal from '../modals/SheetModal';
import { formatNumber } from '../../utils/helpers';
import { getWarehouseLabel } from '../../utils/warehouseUtils';
import { getOrderDisplayName } from '../../utils/orderUtils';

// OrderDetailModal: Xem chi tiết đơn hàng (View Only) -> showCloseIcon={false}
const OrderDetailModal = ({ order, onClose, getOrderStatusInfo }) => {
  if (!order) return null;

  const orderLabel = order.orderNumber ? `#${order.orderNumber}` : `#${order.id.slice(-4)}`;
  const orderName = getOrderDisplayName(order);
  const statusInfo = getOrderStatusInfo?.(order);
  const warehouseLabel = getWarehouseLabel(order.warehouse || 'daLat');

  const footer = (
    <button
      onClick={onClose}
      className="w-full py-2.5 rounded-xl bg-rose-500 text-white font-semibold shadow-md shadow-rose-200 active:bg-rose-600 transition"
    >
      Đóng
    </button>
  );

  return (
    <SheetModal
      open={Boolean(order)}
      onClose={onClose}
      title={`Chi tiết đơn hàng ${orderLabel}`}
      footer={footer}
      showCloseIcon={false} // View Only
    >
      <div className="space-y-4">
        {/* Header Info */}
        <div className="border-b border-amber-100 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-amber-600">{orderName}</div>
            {statusInfo && (
              <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full border text-xs font-semibold ${statusInfo.badgeClass}`}>
                <span className={`w-2 h-2 rounded-full ${statusInfo.dotClass}`} />
                {statusInfo.label}
              </span>
            )}
          </div>
          <div className="text-xs text-amber-600">{new Date(order.date).toLocaleString()}</div>
          {order.comment && (
            <div className="mt-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs text-amber-800">
              {order.comment}
            </div>
          )}
        </div>

        {/* List Items */}
        <div className="space-y-3">
          {order.items.map((item, index) => (
            <div key={`${item.productId}-${index}`} className="flex justify-between text-sm text-gray-600">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-amber-900">
                  <span className="font-semibold truncate">{item.name}</span>
                  <span className="text-xs text-gray-400">x{item.quantity}</span>
                </div>
              </div>
              <div className="font-semibold text-amber-700">
                {formatNumber(item.price * item.quantity)}đ
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="border-t border-amber-100 pt-4 bg-amber-50 -mx-5 px-5 -mb-2 pb-2 mt-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Tại kho</span>
            <span className="font-semibold text-amber-700">{warehouseLabel}</span>
          </div>
          {order.orderType === 'delivery' && (
            <>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Khách hàng</span>
                <span className="font-semibold text-amber-700">{order.customerName || '-'}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Địa chỉ</span>
                <span className="font-semibold text-amber-700 text-right">{order.customerAddress || '-'}</span>
              </div>
            </>
          )}
          <div className="flex justify-between text-sm text-gray-500">
            <span>Phí gửi khách</span>
            <span className="font-semibold text-amber-700">{formatNumber(order.shippingFee || 0)}đ</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-2 pt-2 border-t border-amber-200/50">
            <span className="font-medium text-amber-900">Tổng đơn</span>
            <span className="text-lg font-bold text-rose-600">{formatNumber(order.total)}đ</span>
          </div>
        </div>
      </div>
    </SheetModal>
  );
};

export default OrderDetailModal;
