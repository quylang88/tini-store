import React, { memo, useMemo } from "react";
import { Image as ImageIcon, Trash2, Edit } from "lucide-react";
import { motion } from "framer-motion";
import { formatNumber } from "../../utils/formatters/formatUtils";
import { getProductStats } from "../../utils/inventory/purchaseUtils";
import {
  normalizeWarehouseStock,
  getWarehouses,
  resolveWarehouseKey,
  getSpecificWarehouseStock,
  getTotalStock,
} from "../../utils/inventory/warehouseUtils";

// Cache warehouse labels để tránh tìm kiếm tuyến tính O(N) trong mỗi render
// Việc này cải thiện hiệu năng danh sách khi lọc/scroll nhiều.
const WAREHOUSE_LABEL_MAP = getWarehouses().reduce((acc, w) => {
  acc[w.key] = w.label;
  return acc;
}, {});

// Sử dụng React.memo để ngăn component render lại không cần thiết
// khi props (như product) không thay đổi. Điều này giúp tối ưu hiệu năng
// khi danh sách sản phẩm dài.
const ProductListItem = memo(
  ({
    product,
    onDelete,
    onOpenDetail,
    activeCategory,
    activeWarehouse,
    onEditBasicInfo,
  }) => {
    // Tối ưu hóa: Memoize việc tìm lot mới nhất và tính toán chi phí (O(N)).
    // Sử dụng helper getProductStats để đóng gói logic và tránh quét mảng nhiều lần.
    const {
      latestLot,
      cost: latestCost,
      unitCost: latestUnitCost,
      isJpy,
    } = useMemo(() => getProductStats(product), [product]);

    // Check if product is out of stock in all warehouses
    const isOutOfStock = useMemo(() => getTotalStock(product) <= 0, [product]);

    const expectedProfit = (Number(product.price) || 0) - latestUnitCost;
    const hasProfitData = Number(product.price) > 0 && latestUnitCost > 0;
    // Tối ưu hóa: Chỉ tính toán tồn kho chi tiết khi hiển thị tất cả kho.
    // Khi lọc theo kho cụ thể, dùng getSpecificWarehouseStock để tránh tạo object không cần thiết.
    // Sử dụng useMemo để tránh tính toán lại khi component re-render do thay đổi props khác (như activeCategory).
    const stockByWarehouse = useMemo(
      () =>
        activeWarehouse === "all" ? normalizeWarehouseStock(product) : null,
      [activeWarehouse, product],
    );
    const warehouses = getWarehouses();

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileTap={{ scale: 0.96 }}
        transition={{ duration: 0.2 }}
        onClick={() => onOpenDetail(product)}
        className={`${
          isOutOfStock
            ? "bg-gray-100 border-gray-200"
            : "bg-amber-50 border-amber-100"
        } p-3 rounded-xl shadow-sm border flex gap-3 items-start cursor-pointer hover:shadow-md transition-shadow select-none`}
      >
        <div
          className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border relative ${
            isOutOfStock
              ? "bg-gray-200 border-gray-300"
              : "bg-gray-100 border-gray-200"
          }`}
        >
          {product.image ? (
            <img
              src={product.image}
              className={`w-full h-full object-cover ${isOutOfStock ? "grayscale opacity-80" : ""}`}
              alt={product.name}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <ImageIcon
                size={20}
                className={isOutOfStock ? "text-gray-400" : ""}
              />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          {/* Row 1: Name & Category */}
          <div className="flex justify-between items-start gap-2">
            <div
              className={`font-bold text-sm truncate ${
                isOutOfStock ? "text-gray-600" : "text-amber-900"
              }`}
            >
              {product.name}
            </div>
            <div
              className={`text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0 ${
                activeCategory !== "Tất cả" ? "invisible" : ""
              } ${isOutOfStock ? "bg-gray-200 text-gray-500" : "bg-gray-100 text-gray-500"}`}
            >
              {product.category}
            </div>
          </div>

          {/* Row 2: Barcode */}
          <div className="text-gray-400 font-mono text-[10px]">
            {product.barcode || "---"}
          </div>

          {/* Row 3: Price & Stock (aligned) */}
          <div className="flex justify-between items-baseline mt-1.5">
            <div
              className={`font-bold text-sm ${
                isOutOfStock ? "text-gray-600" : "text-rose-700"
              }`}
            >
              {formatNumber(product.price)}đ
            </div>
            <div
              className={`text-[10px] font-medium text-right ${
                isOutOfStock ? "text-gray-500" : "text-amber-700"
              }`}
            >
              {activeWarehouse === "all" ? (
                <span>
                  {warehouses
                    .map((w) => {
                      const qty = stockByWarehouse[w.key] || 0;
                      return `${w.shortLabel}: ${qty}`;
                    })
                    .join(" | ")}
                </span>
              ) : (
                <span>
                  {WAREHOUSE_LABEL_MAP[resolveWarehouseKey(activeWarehouse)] ||
                    activeWarehouse}
                  :{" "}
                  {getSpecificWarehouseStock(
                    product,
                    resolveWarehouseKey(activeWarehouse),
                  )}{" "}
                  sp
                </span>
              )}
            </div>
          </div>

          {/* Row 4: Profit & Import Cost (aligned) */}
          <div className="flex justify-between items-baseline">
            {hasProfitData ? (
              <div
                className={`text-[10px] ${
                  isOutOfStock ? "text-gray-500" : "text-emerald-600"
                }`}
              >
                Lợi nhuận: {formatNumber(expectedProfit)}đ
              </div>
            ) : (
              <div></div>
            )}
            <div
              className={`text-[10px] text-right ${
                isOutOfStock ? "text-gray-500" : "text-gray-600"
              }`}
            >
              Giá nhập mới nhất:{" "}
              {isJpy
                ? `${formatNumber(latestLot.costJpy)}¥`
                : `${formatNumber(latestCost)}đ`}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 self-center">
          <button
            onClick={(event) => {
              event.stopPropagation();
              onDelete(product);
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm border ${
              isOutOfStock
                ? "bg-gray-200 text-gray-500 border-gray-400 active:bg-gray-300"
                : "bg-rose-50 text-rose-600 active:bg-rose-100 border-rose-300"
            }`}
            aria-label={`Xoá ${product.name}`}
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onEditBasicInfo(product);
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm border ${
              isOutOfStock
                ? "bg-gray-200 text-gray-600 border-gray-400 active:bg-gray-300"
                : "bg-emerald-50 text-emerald-600 active:bg-emerald-100 border-emerald-300"
            }`}
            aria-label={`Sửa ${product.name}`}
          >
            <Edit size={16} />
          </button>
        </div>
      </motion.div>
    );
  },
);

ProductListItem.displayName = "ProductListItem";

export default ProductListItem;
