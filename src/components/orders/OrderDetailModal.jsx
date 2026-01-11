import React from 'react';
import { formatNumber } from '../../utils/helpers';

const OrderDetailModal = ({ order, onClose }) => {
  if (!order) return null;
  const orderLabel = order.orderNumber ? `#${order.orderNumber}` : `#${order.id.slice(-4)}`;
  const hasShipping = order.shippingUpdated || order.shippingFee > 0;
  const statusLabel = order.status === 'paid' ? 'Đã thanh toán' : hasShipping ? 'Đã xuất VN' : 'Chờ gom';

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-amber-100 overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-4 border-b border-amber-100 bg-amber-50">
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-amber-900">Chi tiết đơn {orderLabel}</div>
            <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
              {statusLabel}
            </span>
          </div>
          <div className="text-xs text-amber-600 mt-1">{new Date(order.date).toLocaleString()}</div>
        </div>
        <div className="p-4 space-y-3 max-h-[55vh] overflow-y-auto">
          {order.items.map((item, index) => (
            <div key={`${item.productId}-${index}`} className="flex justify-between text-sm text-gray-600">
              <div className="min-w-0">
                <div className="font-semibold text-amber-900 truncate">{item.name}</div>
                <div className="text-xs text-gray-400">x{item.quantity}</div>
              </div>
              <div className="font-semibold text-amber-700">
                {formatNumber(item.price * item.quantity)}đ
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-amber-100 bg-amber-50 space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Phí gửi</span>
            <span className="font-semibold text-amber-700">{formatNumber(order.shippingFee || 0)}đ</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Tổng đơn hàng</span>
            <span className="text-lg font-bold text-rose-600">{formatNumber(order.total)}đ</span>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-rose-500 text-white font-semibold shadow-md shadow-rose-200 hover:bg-rose-600 transition"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
