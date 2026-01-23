import React, { memo } from "react";
import { Image as ImageIcon, Trash2, Edit } from "lucide-react";
import { motion } from "framer-motion";
import { formatNumber } from "../../utils/formatters/formatUtils";
import {
  getLatestCost,
  getLatestUnitCost,
} from "../../utils/inventory/purchaseUtils";
import { normalizeWarehouseStock } from "../../utils/inventory/warehouseUtils";

// Sử dụng React.memo để ngăn component render lại không cần thiết
// khi props (như product) không thay đổi. Điều này giúp tối ưu hiệu năng
// khi danh sách sản phẩm dài.
const ProductListItem = memo(({
  product,
  onDelete,
  onOpenDetail,
  activeCategory,
  activeWarehouse,
  onEditBasicInfo,
}) => {
  const latestCost = getLatestCost(product);
  const latestUnitCost = getLatestUnitCost(product);
  const expectedProfit = (Number(product.price) || 0) - latestUnitCost;
  const hasProfitData = Number(product.price) > 0 && latestUnitCost > 0;
  const stockByWarehouse = normalizeWarehouseStock(product);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.2 }}
      onClick={() => onOpenDetail(product)}
      className="bg-amber-50 p-3 rounded-xl shadow-sm border border-amber-100 flex gap-3 items-start cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 relative">
        {product.image ? (
          <img
            src={product.image}
            className="w-full h-full object-cover"
            alt={product.name}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ImageIcon size={20} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="space-y-1">
            <div className="font-bold text-amber-900 text-sm truncate">
              {product.name}
            </div>
            <div className="text-gray-400 font-mono">
              {product.barcode || "---"}
            </div>
            <div className="text-rose-700 font-bold text-sm">
              {formatNumber(product.price)}đ
            </div>
            {hasProfitData && (
              <div className="text-[10px] text-emerald-600">
                Lợi nhuận: {formatNumber(expectedProfit)}đ
              </div>
            )}
          </div>
          <div className="text-right space-y-1">
            <div
              className={`text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded inline-block ${
                activeCategory !== "Tất cả" ? "invisible" : ""
              }`}
            >
              {product.category}
            </div>

            {/* Logic hiển thị kho dựa trên activeWarehouse */}
            <div
              className={`text-amber-600 ${
                activeWarehouse !== "all" ? "invisible" : ""
              }`}
            >
              Vĩnh Phúc: {stockByWarehouse.vinhPhuc} sp
            </div>

            <div className="text-amber-600">
              {activeWarehouse === "vinhPhuc"
                ? `Vĩnh Phúc: ${stockByWarehouse.vinhPhuc} sp`
                : `Lâm Đồng: ${stockByWarehouse.daLat} sp`}
            </div>

            <div className="text-[10px] text-amber-500">
              Giá nhập mới nhất: {formatNumber(latestCost)}đ
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 self-center">
        <button
          onClick={(event) => {
            event.stopPropagation();
            onDelete(product.id);
          }}
          className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 active:bg-rose-100 flex items-center justify-center shadow-sm border border-rose-300"
          aria-label={`Xoá ${product.name}`}
        >
          <Trash2 size={18} />
        </button>
        <button
          onClick={(event) => {
            event.stopPropagation();
            onEditBasicInfo(product);
          }}
          className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 active:bg-emerald-100 flex items-center justify-center shadow-sm border border-emerald-300"
          aria-label={`Sửa ${product.name}`}
        >
          <Edit size={16} />
        </button>
      </div>
    </motion.div>
  );
});

ProductListItem.displayName = "ProductListItem";

export default ProductListItem;
