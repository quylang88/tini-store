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
  // để đảm bảo hiển thị đúng "lịch sử vĩnh viễn" thay vì chỉ hiển thị các lô đang còn tồn.
  const productHistory = useMemo(() => {
    if (!cachedProduct) return [];
    return history
      .filter((h) => h.productId === cachedProduct.id)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [history, cachedProduct]);

  // Nếu chưa từng có sản phẩm nào được chọn thì không render gì cả.
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
      open={Boolean(product)} // open phụ thuộc vào prop product hiện tại
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
              // Tìm lot tương ứng trong activeLots để xem có cho sửa không
              // Logic match: record.lotId === lot.id
              const matchingActiveLot = activeLots.find(
                (lot) => lot.id === record.lotId,
              );
              const isEditable = Boolean(matchingActiveLot);

              // Tính toán hiển thị
              const costDisplay =
                record.costVND > 0 ? record.costVND : record.costJPY;
              const currencyLabel = record.costVND > 0 ? "đ" : "¥";
              const warehouseLabel = getWarehouseLabel(record.warehouse);

              // Nếu record là bản edit (isEdit = true), ta có thể hiển thị icon hoặc note
              // Tuy nhiên user muốn xem lịch sử, nên cứ render thẳng.

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
                  <div className="text-xs text-amber-600">
                    Số lượng nhập:{" "}
                    <span className="font-semibold">{record.quantity}</span>
                  </div>
                  {record.shippingFeeVND > 0 && (
                    <div className="text-xs text-gray-600">
                      Phí gửi: {formatNumber(record.shippingFeeVND)}đ
                      {record.shippingFeeJPY > 0
                        ? ` (${formatNumber(record.shippingFeeJPY)}¥)`
                        : ""}
                    </div>
                  )}
                  <div className="flex justify-between items-end mt-1">
                    <div className="text-[10px] text-gray-400">
                      {new Date(record.timestamp).toLocaleString("vi-VN")}
                      {record.isEdit && <span className="ml-1 italic">(Đã sửa)</span>}
                    </div>
                    {isEditable ? (
                      <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        Sửa
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">
                        Đã hết/Gộp
                      </span>
                    )}
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

              return (
                <div
                  key={record.id}
                  className="w-full text-left border border-gray-100 rounded-xl p-3 space-y-1 bg-gray-50 opacity-80"
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
