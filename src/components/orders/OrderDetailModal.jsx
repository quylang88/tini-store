import React from 'react';
import { formatNumber } from '../../utils/helpers';
import { getWarehouseLabel } from '../../utils/warehouseUtils';
import { getOrderDisplayName } from '../../utils/orderUtils';
import useModalPresence from '../../hooks/useModalPresence';

const OrderDetailModal = ({ order, onClose, getOrderStatusInfo }) => {
  // Giữ modal khi đóng để animation exit chạy xong trước khi unmount.
  const { isMounted, animationState } = useModalPresence(Boolean(order), 280);
  if (!isMounted || !order) return null;
  const orderLabel = order.orderNumber ? `#${order.orderNumber}` : `#${order.id.slice(-4)}`;
  // Gắn tên đơn theo thông tin khách hoặc bán tại kho để dễ nhận diện.
  const orderName = getOrderDisplayName(order);
  const statusInfo = getOrderStatusInfo?.(order);
  const warehouseLabel = getWarehouseLabel(order.warehouse || 'daLat');
  const overlayAnimationClass = animationState === 'enter' ? 'modal-overlay-enter' : 'modal-overlay-exit';
  const panelAnimationClass = animationState === 'enter' ? 'modal-panel-enter' : 'modal-panel-exit';

  return (
    <div
      className={`fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/40 p-4 backdrop-blur-sm ${overlayAnimationClass}`}
      onClick={onClose}
    >
      {/* Dùng overlay blur và animation enter/exit để giống modal thêm mới/chi tiết sản phẩm. */}
      <div
        className={`w-full sm:w-[420px] max-h-[90vh] bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-amber-100 overflow-hidden ${panelAnimationClass}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-4 border-b border-amber-100 bg-amber-50">
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-amber-900">Chi tiết đơn hàng {orderLabel}</div>
            {statusInfo && (
              <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full border text-xs font-semibold ${statusInfo.badgeClass}`}>
                <span className={`w-2 h-2 rounded-full ${statusInfo.dotClass}`} />
                {statusInfo.label}
              </span>
            )}
          </div>
          {/* Tên khách/địa chỉ hiển thị xuống dòng để tránh làm vỡ layout trạng thái */}
          <div className="text-xs font-semibold text-amber-600 mt-1">{orderName}</div>
          <div className="text-xs text-amber-600 mt-1">{new Date(order.date).toLocaleString()}</div>
          {order.comment && (
            <div className="mt-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs text-amber-800">
              {/* Ghi chú đơn hàng để gợi nhớ cho user */}
              {order.comment}
            </div>
          )}
        </div>
        <div className="p-4 space-y-3 max-h-[55vh] overflow-y-auto">
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
        <div className="p-4 border-t border-amber-100 bg-amber-50 space-y-2 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
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
          <div className="flex justify-between text-sm text-gray-500">
            <span>Tổng đơn</span>
            <span className="text-lg font-bold text-rose-600">{formatNumber(order.total)}đ</span>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-amber-300 bg-amber-200 text-amber-900 font-semibold shadow-sm active:bg-amber-300 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
