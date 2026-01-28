import React, { useMemo, useState } from "react";
import { Maximize2 } from "lucide-react";
import { formatNumber } from "../../utils/formatters/formatUtils";
import { getWarehouseLabel } from "../../utils/inventory/warehouseUtils";
import SheetModal from "../../components/modals/SheetModal";
import ImageViewerModal from "../modals/ImageViewerModal";
import useModalCache from "../../hooks/ui/useModalCache";
import Button from "../../components/button/Button";
import usePagination from "../../hooks/ui/usePagination";
import { isScrollNearBottom } from "../../utils/ui/scrollUtils";

// ProductDetailModal: Hiển thị lịch sử nhập hàng (View Only)
const ProductDetailModal = ({ product, onClose, onEditLot }) => {
  // Logic giữ dữ liệu (Cached Data) để phục vụ animation exit.
  const cachedProduct = useModalCache(product, Boolean(product));
  const [showImageViewer, setShowImageViewer] = useState(false);

  // Sắp xếp các lô hàng theo thời gian mới nhất
  const sortedLots = useMemo(() => {
    if (!cachedProduct) return [];
    // Tối ưu hóa: So sánh chuỗi ISO trực tiếp thay vì tạo object Date mới (O(N) allocations).
    return [...(cachedProduct.purchaseLots || [])].sort((a, b) =>
      (b.createdAt || "").localeCompare(a.createdAt || ""),
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
        {/* Ảnh sản phẩm (nếu có) */}
        {cachedProduct.image && (
          <div className="relative w-full h-48 bg-gray-50 rounded-xl overflow-hidden border border-rose-100 group">
            <img
              src={cachedProduct.image}
              alt={cachedProduct.name}
              className="w-full h-full object-contain cursor-zoom-in"
              onClick={() => setShowImageViewer(true)}
            />
            <button
              onClick={() => setShowImageViewer(true)}
              className="absolute bottom-2 right-2 p-2 bg-black/40 text-white rounded-full backdrop-blur-sm active:scale-95 transition"
            >
              <Maximize2 size={18} />
            </button>
            {showImageViewer && (
              <ImageViewerModal
                src={cachedProduct.image}
                alt={cachedProduct.name}
                onClose={() => setShowImageViewer(false)}
              />
            )}
          </div>
        )}

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

              let costDisplay = (
                <span className="font-semibold">{formatNumber(lot.cost)}đ</span>
              );
              if (isJpImport && exchangeRate > 0) {
                const costJpy = Math.round(lot.cost / exchangeRate);
                costDisplay = (
                  <span className="font-semibold">
                    ¥{formatNumber(costJpy)}{" "}
                    <span className="pl-2 text-[10px] text-gray-500 font-normal">
                      (~{formatNumber(lot.cost)}đ)
                    </span>
                  </span>
                );
              }

              // Shipping Display Logic
              let shippingDisplay = null;
              if (lot.shipping) {
                if (isJpImport) {
                  const weight = lot.shipping.weightKg || 0;
                  const feeJpy = lot.shipping.feeJpy || 0;
                  shippingDisplay = `${weight}kg (¥${formatNumber(feeJpy)})`;
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
                      ? "border-gray-200 bg-gray-100 grayscale cursor-not-allowed"
                      : "border-rose-100 bg-rose-50 active:border-rose-200"
                  }`}
                >
                  <div className="flex items-center justify-between text-sm text-rose-700">
                    {costDisplay}
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
