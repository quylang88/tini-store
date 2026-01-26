import React, { useMemo } from "react";
import { formatNumber } from "../../utils/formatters/formatUtils";
import { getWarehouseLabel } from "../../utils/inventory/warehouseUtils";
import SheetModal from "../../components/modals/SheetModal";
import useModalCache from "../../hooks/ui/useModalCache";
import Button from "../../components/button/Button";
import usePagination from "../../hooks/ui/usePagination";
import { isScrollNearBottom } from "../../utils/ui/scrollUtils";

// ProductDetailModal: Hiển thị lịch sử nhập hàng (View Only)
const ProductDetailModal = ({ product, onClose, onEditLot }) => {
  // Logic giữ dữ liệu (Cached Data) để phục vụ animation exit.
  const cachedProduct = useModalCache(product, Boolean(product));

  // Sort lots by newest date first
  const sortedLots = useMemo(() => {
    if (!cachedProduct) return [];
    return [...(cachedProduct.purchaseLots || [])].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    );
  }, [cachedProduct]);

  const {
    visibleData: visibleLots,
    loadMore,
    hasMore,
  } = usePagination(sortedLots, {
    pageSize: 20,
    resetDeps: [cachedProduct?.id],
  });

  // Nếu chưa từng có sản phẩm nào được chọn thì không render gì cả.
  if (!cachedProduct) return null;

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
      onScroll={(e) => {
        if (isScrollNearBottom(e.target) && hasMore) {
          loadMore();
        }
      }}
    >
      <div className="space-y-4">
        <div className="flex flex-col border-b border-rose-100 pb-4">
          <div className="text-sm font-semibold text-amber-600">
            Giá bán: {formatNumber(cachedProduct.price)}đ
          </div>
        </div>

        <div className="space-y-3">
          {sortedLots.length === 0 ? (
            <div className="text-xs text-gray-500 text-center">
              Chưa có lịch sử nhập kho.
            </div>
          ) : (
            visibleLots.map((lot) => {
              const originalQty =
                Number(lot.originalQuantity) || Number(lot.quantity);
              const currentQty = Number(lot.quantity) || 0;

              // Status Logic
              const isSoldOut = currentQty === 0;
              const isLowStock = !isSoldOut && currentQty < originalQty * 0.15;

              // Cost Display Logic
              const exchangeRate = Number(lot.shipping?.exchangeRate) || 0;
              const isJpImport = lot.shipping?.method === "jp";

              let costDisplay = `${formatNumber(lot.cost)}đ`;
              if (isJpImport && exchangeRate > 0) {
                const costJpy = Math.round(lot.cost / exchangeRate);
                costDisplay = `${formatNumber(costJpy)}¥ (~${formatNumber(
                  lot.cost,
                )}đ)`;
              }

              // Shipping Display Logic
              let shippingDisplay = null;
              if (lot.shipping) {
                if (isJpImport) {
                  const weight = lot.shipping.weightKg || 0;
                  const feeJpy = lot.shipping.feeJpy || 0;
                  shippingDisplay = `${weight}kg (${formatNumber(feeJpy)}¥)`;
                } else {
                  shippingDisplay = `${formatNumber(lot.shipping.feeVnd)}đ`;
                }
              }

              return (
                <button
                  key={lot.id}
                  type="button"
                  disabled={isSoldOut}
                  onClick={() => !isSoldOut && onEditLot?.(lot)}
                  className={`w-full text-left border rounded-xl p-3 space-y-1 transition ${
                    isSoldOut
                      ? "border-gray-200 bg-gray-50 opacity-70 cursor-not-allowed"
                      : "border-rose-100 bg-rose-50 active:border-rose-200"
                  }`}
                >
                  <div className="flex items-center justify-between text-sm text-rose-700">
                    <span className="font-semibold">{costDisplay}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-rose-200 text-rose-600">
                      {getWarehouseLabel(lot.warehouse)}
                    </span>
                  </div>

                  {shippingDisplay && (
                    <div className="text-xs text-gray-600">
                      Phí gửi: {shippingDisplay}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-rose-100/50">
                    <div className="text-xs text-amber-700 font-medium">
                      Nhập <span className="font-bold">{originalQty}</span> -
                      Tồn <span className="font-bold">{currentQty}</span>
                    </div>
                    <div className="flex gap-1">
                      {isLowStock && (
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200">
                          Sắp hết
                        </span>
                      )}
                      {isSoldOut && (
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full border border-gray-300">
                          Đã hết
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-[10px] text-gray-400 mt-1">
                    {lot.createdAt
                      ? new Date(lot.createdAt).toLocaleString("vi-VN")
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
