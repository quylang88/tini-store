import React from 'react';
import { formatNumber } from '../../utils/helpers';
import { getLatestCost, getLatestLot } from '../../utils/purchaseUtils';
import { getWarehouseLabel } from '../../utils/warehouseUtils';
import SheetModal from '../modals/SheetModal';

// ProductDetailModal: Hiển thị lịch sử nhập hàng (View Only)
// Không có nút X, có nút Đóng ở cuối.
const ProductDetailModal = ({ product, onClose, onEditLot }) => {
  // Vì SheetModal handle animation exit, nên tốt nhất là luôn render SheetModal nhưng pass open=false/true.
  // Nhưng kiến trúc hiện tại của Inventory dùng điều kiện render.
  // Tạm thời chấp nhận render có điều kiện như cũ.
  if (!product) return null;

  const latestLot = getLatestLot(product);
  const latestCost = getLatestCost(product);
  const lots = product.purchaseLots || [];

  const footer = (
    <button
      type="button"
      onClick={onClose}
      className="w-full rounded-xl border border-amber-300 bg-amber-100 py-2.5 text-sm font-bold text-amber-900 transition active:border-amber-400 active:bg-amber-200"
    >
      Đóng
    </button>
  );

  return (
    <SheetModal
      open={Boolean(product)}
      onClose={onClose}
      showCloseIcon={false} // View only -> Tắt X
      footer={footer}
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-1">
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
                  className="w-full text-left border border-amber-100 rounded-xl p-3 space-y-1 active:border-amber-200 bg-amber-50 transition"
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
      </div>
    </SheetModal>
  );
};

export default ProductDetailModal;
