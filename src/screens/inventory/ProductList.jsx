import React from "react";
import { Image as ImageIcon, Trash2, Edit } from "lucide-react";
import { formatNumber } from "../../utils/helpers";
import { getLatestCost, getLatestUnitCost } from "../../utils/purchaseUtils";
import { normalizeWarehouseStock } from "../../utils/warehouseUtils";
import { motion, AnimatePresence } from "framer-motion";

const ProductList = ({
  products,
  onDelete,
  onOpenDetail,
  activeCategory,
  activeWarehouse,
  onEditBasicInfo,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 pb-24">
      {/* 
        Các sửa đổi:
        1. Sử dụng 'flex flex-col gap-3' thay vì 'space-y-3' để tránh lỗi nhảy layout do
           selector margin của 'space-y' tương tác với các phần tử position absolute (đang exit).
        2. mode="popLayout": Đảm bảo các item đang exit được loại bỏ khỏi luồng layout ngay lập tức (position: absolute).
        3. Empty State được render BÊN NGOÀI AnimatePresence như một thẻ div tĩnh.
           Kết hợp với 'popLayout', điều này đảm bảo text xuất hiện ngay lập tức ở đúng vị trí
           mà không bị đẩy bởi các item đang exit hoặc tự animate.
      */}
      <AnimatePresence mode="popLayout">
        {products.map((product) => {
          // Hiển thị nhanh giá nhập, lợi nhuận và tồn kho từng kho.
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
              key={product.id}
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
                    <div className="font-bold text-rose-800 text-sm truncate">
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
                    {/* Slot 1: Chỉ hiện Vĩnh Phúc khi xem Tất cả. Các trường hợp khác ẩn để giữ khoảng trống */}
                    <div
                      className={`text-amber-600 ${
                        activeWarehouse !== "all" ? "invisible" : ""
                      }`}
                    >
                      Vĩnh Phúc: {stockByWarehouse.vinhPhuc} sp
                    </div>

                    {/* Slot 2: Hiện Lâm Đồng (mặc định) hoặc Vĩnh Phúc (khi filter VP) */}
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
        })}
      </AnimatePresence>

      {/* 
        Trạng thái rỗng hoàn toàn tĩnh BÊN NGOÀI AnimatePresence.
        Không cần props animation hay key.
      */}
      {products.length === 0 && (
        <div className="text-center text-gray-400 mt-10 text-sm">
          Không có sản phẩm nào
        </div>
      )}
    </div>
  );
};

export default ProductList;
