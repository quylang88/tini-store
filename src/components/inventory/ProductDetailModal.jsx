import React, { useMemo } from "react";
import { formatNumber } from "../../utils/formatters/formatUtils";
import {
  getLatestCost,
  getLatestLot,
} from "../../utils/inventory/purchaseUtils";
import { getWarehouseLabel } from "../../utils/inventory/warehouseUtils";
import SheetModal from "../../components/modals/SheetModal";
import useModalCache from "../../hooks/ui/useModalCache";
import Button from "../../components/button/Button";
import useImportHistory from "../../hooks/inventory/useImportHistory";

// ProductDetailModal: Hiển thị lịch sử nhập hàng (View Only)
const ProductDetailModal = ({ product, onClose, onEditLot }) => {
  // Logic giữ dữ liệu (Cached Data) để phục vụ animation exit.
  const cachedProduct = useModalCache(product, Boolean(product));
  const { history } = useImportHistory();

  // Lọc lịch sử nhập hàng của sản phẩm này từ shop_import_history (Immutable Log)
  const productHistory = useMemo(() => {
    if (!cachedProduct) return [];
    return history
      .filter((h) => h.productId === cachedProduct.id)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [history, cachedProduct]);

  if (!cachedProduct) return null;

  const latestCost = getLatestCost(cachedProduct);
  const activeLots = cachedProduct.purchaseLots || [];

  const footer = (
    <Button variant="sheetClose" size="sm" onClick={onClose}>
      Đóng
    </Button>
  );

  return (
    <SheetModal
      open={Boolean(product)}
      onClose={onClose}
      title={`${cachedProduct.name}`}
      showCloseIcon={false}
      footer={footer}
    >
      <div className="space-y-4">
        <div className="flex flex-col border-b border-rose-100 pb-4">
          <div className="text-sm font-semibold text-amber-600">
            Giá bán hiện tại: {formatNumber(cachedProduct.price)}đ
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Giá nhập mới nhất: {formatNumber(latestCost)}đ
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Lịch sử nhập hàng (Vĩnh viễn)
          </div>

          {productHistory.length === 0 ? (
            <div className="text-xs text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
              Chưa có dữ liệu lịch sử nhập hàng.
            </div>
          ) : (
            productHistory.map((record) => {
              // Tìm lot tương ứng trong activeLots
              const matchingActiveLot = activeLots.find(
                (lot) => lot.id === record.lotId,
              );

              const currentQty = matchingActiveLot ? (Number(matchingActiveLot.quantity) || 0) : 0;
              const initialQty = Number(record.quantity) || 0;

              // Logic trạng thái
              const isSoldOut = currentQty === 0;
              // Sắp hết nếu còn hàng nhưng < 15% tổng nhập
              const isLowStock = !isSoldOut && (currentQty < initialQty * 0.15);
              // Chỉ cho sửa nếu chưa hết hàng
              const isEditable = !isSoldOut && Boolean(matchingActiveLot);

              // Tính toán hiển thị
              const costDisplay =
                record.costVND > 0 ? record.costVND : record.costJPY;
              const currencyLabel = record.costVND > 0 ? "đ" : "¥";
              const warehouseLabel = getWarehouseLabel(record.warehouse);

              const Content = (
                <>
                  <div className="flex items-center justify-between text-sm text-rose-700">
                    <span className="font-semibold">
                      {formatNumber(costDisplay)}
                      {currencyLabel}
                    </span>
                    <span className="text-xs text-rose-600">
                      {warehouseLabel}
                    </span>
                  </div>

                  {/* Grid hiển thị Số lượng nhập vs Tồn kho */}
                  <div className="grid grid-cols-2 gap-4 mt-1">
                    <div className="text-xs text-amber-600">
                      Nhập: <span className="font-semibold">{initialQty}</span>
                    </div>
                    <div className="text-xs text-emerald-600">
                      Tồn: <span className="font-semibold">{currentQty}</span>
                    </div>
                  </div>

                  {record.shippingFeeVND > 0 && (
                    <div className="text-xs text-gray-600 mt-1">
                      Phí gửi: {formatNumber(record.shippingFeeVND)}đ
                      {record.shippingFeeJPY > 0
                        ? ` (${formatNumber(record.shippingFeeJPY)}¥)`
                        : ""}
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-2">
                    <div className="text-[10px] text-gray-400">
                      {new Date(record.timestamp).toLocaleString("vi-VN")}
                    </div>

                    <div className="flex gap-2">
                      {isSoldOut && (
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                          Đã hết
                        </span>
                      )}

                      {isLowStock && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                          Sắp hết
                        </span>
                      )}
                    </div>
                  </div>
                </>
              );

              if (isEditable) {
                return (
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => onEditLot?.(matchingActiveLot)}
                    className="w-full text-left border border-rose-100 rounded-xl p-3 space-y-1 active:border-rose-200 bg-rose-50 transition hover:bg-rose-100"
                  >
                    {Content}
                  </button>
                );
              }

              // Disabled State (Sold Out)
              return (
                <div
                  key={record.id}
                  className="w-full text-left border border-gray-100 rounded-xl p-3 space-y-1 bg-gray-50 opacity-70 select-none"
                >
                  {Content}
                </div>
              );
            })
          )}
        </div>
      </div>
    </SheetModal>
  );
};

export default ProductDetailModal;
