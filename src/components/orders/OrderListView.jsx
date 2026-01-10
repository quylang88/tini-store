import React from 'react';
import { Plus, ShoppingCart } from 'lucide-react';
import { formatNumber } from '../../utils/helpers';

// Giao diện danh sách đơn tách riêng để dễ quản lý và thêm nút huỷ đơn
const OrderListView = ({
  orders,
  setView,
  getOrderStatusInfo,
  handleTogglePaid,
  handleExportToVietnam,
  handleEditOrder,
  handleCancelOrder
}) => (
  <div className="flex flex-col h-full bg-transparent pb-20">
    <div className="bg-amber-50/90 p-4 border-b border-amber-100 sticky top-0 z-10 flex justify-between items-center shadow-sm backdrop-blur">
      <img
        src="/tiny-shop-transparent.png"
        alt="Tiny Shop"
        className="h-12 w-auto object-contain"
      />
      <button onClick={() => setView('create')} className="bg-rose-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-rose-200 active:scale-95 transition flex items-center gap-2">
        <Plus size={18} /> Đơn mới
      </button>
    </div>
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {orders.map(order => {
        const statusInfo = getOrderStatusInfo(order);
        const hasShipping = order.shippingUpdated || order.shippingFee > 0;
        const isPaid = order.status === 'paid';
        return (
          <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-amber-100 hover:border-rose-200 transition">
            <div className="flex justify-between mb-2">
              <span className="font-bold text-gray-800 text-lg">#{order.id.slice(-4)}</span>
              <span className="text-rose-600 font-bold text-lg bg-rose-50 px-2 py-0.5 rounded">{formatNumber(order.total)}đ</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-full border ${statusInfo.badgeClass}`}>
                <span className={`w-2 h-2 rounded-full ${statusInfo.dotClass}`} />
                {statusInfo.label}
              </span>
              <span className="text-gray-400">
                Phí gửi: {formatNumber(order.shippingFee || 0)}đ
              </span>
            </div>
            <div className="text-xs text-gray-400 mb-3 flex items-center gap-1">
              {new Date(order.date).toLocaleString()}
            </div>
            <div className="border-t border-dashed border-gray-200 pt-2 space-y-1">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm text-gray-600">
                  <span>{item.name} <span className="text-gray-400 text-xs">x{item.quantity}</span></span>
                  <span className="font-medium text-gray-500">{formatNumber(item.price * item.quantity)}đ</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <button
                onClick={() => handleTogglePaid(order.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${isPaid ? 'text-red-600 bg-red-50 border-red-100 hover:bg-red-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100'}`}
              >
                {isPaid ? 'Huỷ thanh toán' : 'Thanh toán'}
              </button>
              <button
                onClick={() => handleExportToVietnam(order.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${hasShipping
                    ? 'text-sky-700 bg-sky-50 border-sky-100 hover:bg-sky-100'
                    : 'text-indigo-700 bg-indigo-50 border-indigo-100 hover:bg-indigo-100'
                  }`}
              >
                {hasShipping ? 'Cập nhật phí gửi' : 'Xuất về VN'}
              </button>
              <button
                onClick={() => handleEditOrder(order)}
                className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full hover:bg-amber-100 transition"
              >
                Sửa đơn
              </button>
              <button
                onClick={() => handleCancelOrder(order.id)}
                className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-full hover:bg-red-100 transition"
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

export default OrderListView;
