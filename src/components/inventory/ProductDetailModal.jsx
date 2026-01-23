import React from "react";
import { formatNumber } from "../../utils/formatters/formatUtils";
import {
  getLatestCost,
  getLatestLot,
} from "../../utils/inventory/purchaseUtils";
import { getWarehouseLabel } from "../../utils/inventory/warehouseUtils";
import SheetModal from "../../components/modals/SheetModal";
import useModalCache from "../../hooks/ui/useModalCache";
import Button from "../../components/button/Button";

// ProductDetailModal: Hiển thị lịch sử nhập hàng (View Only)
const ProductDetailModal = ({ product, onClose, onEditLot }) => {
  // Logic giữ dữ liệu (Cached Data) để phục vụ animation exit.
  const cachedProduct = useModalCache(product, Boolean(product));

  // Nếu chưa từng có sản phẩm nào được chọn thì không render gì cả.
  if (!cachedProduct) return null;

  const latestLot = getLatestLot(cachedProduct);
  const latestCost = getLatestCost(cachedProduct);
  // Sort lots by newest date first
  const lots = [...(cachedProduct.purchaseLots || [])].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  );

  const footer = (
    <Button variant="sheetClose" size="sm" onClick={onClose}>
      Đóng
    </Button>
  );

  return (
    <SheetModal
      open={Boolean(product)} // open phụ thuộc vào prop product hiện tại
      onClose={onClose}
      title={`${cachedProduct.name}`}
      showCloseIcon={false}
      footer={footer}
    >
      <div className="space-y-4">
        <div className="flex flex-col border-b border-rose-100 pb-4">
          <div className="text-sm font-semibold text-amber-600">
            Giá bán: {formatNumber(cachedProduct.price)}đ
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Giá nhập mới nhất: {formatNumber(latestCost)}đ
            {latestLot
              ? ` • Kho: ${getWarehouseLabel(latestLot.warehouse)}`
              : ""}
          </div>
        </div>

        <div className="space-y-3">
          {lots.length === 0 ? (
            <div className="text-xs text-gray-500 text-center">
              Chưa có lịch sử nhập kho.
            </div>
          ) : (
            lots.map((lot) => {
              const salePrice = Number(cachedProduct.price) || 0;
              const shippingPerUnit =
                Number(lot.shipping?.perUnitVnd ?? lot.shipping?.feeVnd) || 0;
              const unitCost = (Number(lot.cost) || 0) + shippingPerUnit;
              const profitAtCurrentPrice = salePrice - unitCost;
              return (
                <button
                  key={lot.id}
                  type="button"
                  onClick={() => onEditLot?.(lot)}
                  className="w-full text-left border border-rose-100 rounded-xl p-3 space-y-1 active:border-rose-200 bg-rose-50 transition"
                >
                  <div className="flex items-center justify-between text-sm text-rose-700">
                    <span className="font-semibold">
                      {formatNumber(lot.cost)}đ
                    </span>
                    <span className="text-xs text-rose-600">
                      {getWarehouseLabel(lot.warehouse)}
                    </span>
                  </div>
                  <div className="text-xs text-amber-600">
                    Số lượng:{" "}
                    <span className="font-semibold">{lot.quantity}</span>
                  </div>
                  <div className="text-xs text-emerald-700">
                    Lợi nhuận theo giá hiện tại:{" "}
                    <span className="font-semibold">
                      {formatNumber(profitAtCurrentPrice)}đ
                    </span>
                  </div>
                  {lot.shipping && (
                    <div className="text-xs text-gray-600">
                      Phí gửi: {formatNumber(lot.shipping.feeVnd || 0)}đ
                      {lot.shipping.method === "jp"
                        ? ` (${formatNumber(lot.shipping.feeJpy || 0)}¥)`
                        : ""}
                    </div>
                  )}
                  <div className="text-[10px] text-gray-400">
                    {lot.createdAt
                      ? new Date(lot.createdAt).toLocaleString()
                      : ""}
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
