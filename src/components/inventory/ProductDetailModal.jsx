import React from 'react';
import { formatNumber } from '../../utils/helpers';
import { getLatestCost, getLatestLot } from '../../utils/purchaseUtils';
import { getWarehouseLabel } from '../../utils/warehouseUtils';
import useModalPresence from '../../hooks/useModalPresence';

const ProductDetailModal = ({ product, onClose, onEditLot }) => {
  // Dùng hook để giữ modal khi đóng, giúp chạy animation exit mượt.
  const { isMounted, animationState } = useModalPresence(Boolean(product), 280);
  if (!isMounted || !product) return null;

  const overlayAnimationClass = animationState === 'enter' ? 'modal-overlay-enter' : 'modal-overlay-exit';
  const panelAnimationClass = animationState === 'enter' ? 'modal-panel-enter' : 'modal-panel-exit';

  const latestLot = getLatestLot(product);
  const latestCost = getLatestCost(product);
  const lots = product.purchaseLots || [];

  return (
    <div
      className={`fixed inset-0 bg-black/50 z-[70] flex items-end sm:items-center justify-center backdrop-blur-sm ${overlayAnimationClass}`}
      onClick={onClose}
    >
      {/* Overlay và panel dùng animation enter/exit để hiệu ứng đồng nhất giữa các modal. */}
      <div
        className={`bg-white w-full sm:w-96 rounded-t-2xl sm:rounded-2xl p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] ${panelAnimationClass} max-h-[90vh] overflow-y-auto`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold text-lg text-amber-900">{product.name}</h3>
            <div className="text-xs text-amber-600">
              Giá nhập mới nhất: {formatNumber(latestCost)}đ
              {latestLot ? ` • Kho: ${getWarehouseLabel(latestLot.warehouse)}` : ''}
            </div>
          </div>
        </div>

        {/* Danh sách tất cả lần nhập kho */}
        <div className="space-y-3">
          {lots.length === 0 ? (
            <div className="text-xs text-gray-500 text-center">Chưa có lịch sử nhập kho.</div>
          ) : (
            lots.map((lot) => {
              const salePrice = Number(product.price) || 0;
              const shippingPerUnit = Number(lot.shipping?.perUnitVnd ?? lot.shipping?.feeVnd) || 0;
              const unitCost = (Number(lot.cost) || 0) + shippingPerUnit;
              const profitAtCurrentPrice = salePrice - unitCost;
              return (
                <button
                  key={lot.id}
                  type="button"
                  onClick={() => onEditLot?.(lot)}
                  className="w-full text-left border border-amber-100 rounded-xl p-3 space-y-1 bg-amber-50 active:border-amber-200 active:bg-amber-100 transition"
                >
                  <div className="flex items-center justify-between text-sm text-amber-800">
                    <span className="font-semibold">{formatNumber(lot.cost)}đ</span>
                    <span className="text-xs text-amber-600">{getWarehouseLabel(lot.warehouse)}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Số lượng: <span className="font-semibold">{lot.quantity}</span>
                  </div>
                  <div className="text-xs text-emerald-700">
                    Lợi nhuận theo giá hiện tại: <span className="font-semibold">{formatNumber(profitAtCurrentPrice)}đ</span>
                  </div>
                  {lot.shipping && (
                    <div className="text-xs text-gray-600">
                      Phí gửi: {formatNumber(lot.shipping.feeVnd || 0)}đ
                      {lot.shipping.method === 'jp' ? ` (${formatNumber(lot.shipping.feeJpy || 0)}¥)` : ''}
                    </div>
                  )}
                  <div className="text-[10px] text-gray-400">
                    {lot.createdAt ? new Date(lot.createdAt).toLocaleString() : ''}
                  </div>
                </button>
              );
            })
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl border border-amber-300 bg-amber-200 py-2 text-sm font-semibold text-amber-900 transition active:border-amber-400 active:bg-amber-300"
        >
          Đóng
        </button>
      </div>
    </div>
  );
};

export default ProductDetailModal;
