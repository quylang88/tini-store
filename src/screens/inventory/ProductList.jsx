import React from "react";
import { Image as ImageIcon, Trash2 } from "lucide-react";
import { formatNumber } from "../../utils/helpers";
import { getLatestCost, getLatestUnitCost } from "../../utils/purchaseUtils";
import { normalizeWarehouseStock } from "../../utils/warehouseUtils";
import { motion, AnimatePresence } from "framer-motion";

const ProductList = ({ products, onDelete, onOpenDetail }) => {
  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-24">
      {/* 
        Fixes:
        1. mode="popLayout": Ensures exiting items are removed from the layout flow immediately (position: absolute),
           preventing the "No products" text from jumping up after the exit animation finishes.
        2. 'layout' prop added: Synchronizes smoothness with Order screen animations.
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
              transition={{ duration: 0.2 }}
              key={product.id}
              onClick={() => onOpenDetail(product)}
              className="bg-white p-3 rounded-xl shadow-sm border border-amber-100 flex gap-3 items-start cursor-pointer hover:shadow-md transition"
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
                    <div className="font-bold text-amber-900 truncate text-sm">
                      {product.name}
                    </div>
                    <div className="text-gray-400 font-mono">
                      {product.barcode || "---"}
                    </div>
                    <div className="text-amber-700 font-bold text-sm">
                      {formatNumber(product.price)}đ
                    </div>
                    {hasProfitData && (
                      <div className="text-[10px] text-emerald-600">
                        Lợi nhuận: {formatNumber(expectedProfit)}đ
                      </div>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded inline-block">
                      {product.category}
                    </div>
                    <div className="text-amber-600">
                      Vĩnh Phúc: {stockByWarehouse.vinhPhuc} sp
                    </div>
                    <div className="text-amber-600">
                      Lâm Đồng: {stockByWarehouse.daLat} sp
                    </div>
                    <div className="text-[10px] text-amber-500">
                      Giá nhập mới nhất: {formatNumber(latestCost)}đ
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(product.id);
                }}
                className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 active:bg-rose-100 flex items-center justify-center shadow-sm self-center"
                aria-label={`Xoá ${product.name}`}
              >
                <Trash2 size={18} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Animated Empty State to prevent jumping */}
      {products.length === 0 && (
        <motion.div
          layout
          key="empty-state"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="text-center text-gray-400 mt-10 text-sm"
        >
          Không có sản phẩm nào
        </motion.div>
      )}
    </div>
  );
};

export default ProductList;
