import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit, Trash2, Clock, History } from "lucide-react";
import { formatNumber, formatDate } from "../../utils/formatters/formatUtils";
import { getTotalStock } from "../../utils/inventory/warehouseUtils";

const ProductDetailModal = ({ product, onClose, onEditLot, onShowHistory }) => {
  if (!product) return null;

  // Use normalized lots for display
  const lots = product.purchaseLots || [];
  const totalStock = getTotalStock(product);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
        />
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col"
        >
          {/* Header Image & Close */}
          <div className="relative h-48 bg-gray-100 shrink-0">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <span className="text-4xl">📦</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                {product.name}
              </h2>
              <div className="flex items-center gap-2 text-gray-500">
                <span className="text-sm">{product.category}</span>
                {product.barcode && (
                  <>
                    <span>•</span>
                    <span className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                      {product.barcode}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                <div className="text-sm text-rose-600 mb-1">Giá bán</div>
                <div className="text-xl font-bold text-rose-700">
                  {formatNumber(product.price)}đ
                </div>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="text-sm text-emerald-600 mb-1">Tổng tồn kho</div>
                <div className="text-xl font-bold text-emerald-700">
                  {formatNumber(totalStock)}
                </div>
              </div>
            </div>

            {/* History Button */}
            <button
              onClick={onShowHistory}
              className="w-full mb-6 py-3 px-4 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center gap-2 font-medium hover:bg-indigo-100 transition-colors"
            >
              <History size={18} />
              Xem lịch sử nhập hàng
            </button>

            {/* Lots List (Current Inventory) */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Clock size={18} className="text-gray-400" />
                Lô hàng hiện có
              </h3>
              <div className="space-y-3">
                {lots.length === 0 ? (
                  <div className="text-center py-4 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    Chưa có lô hàng nào
                  </div>
                ) : (
                  lots.map((lot, index) => (
                    <div
                      key={lot.id || index}
                      className="p-3 rounded-xl border border-gray-100 bg-white shadow-sm flex items-center justify-between"
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-700">
                          {formatDate(lot.createdAt)}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {lot.warehouse === "vinhPhuc"
                            ? "Kho Vĩnh Phúc"
                            : "Kho Lâm Đồng"}
                        </div>
                        {Number(lot.cost) > 0 && (
                          <div className="text-xs text-gray-400 mt-1">
                            Vốn: {formatNumber(lot.cost)}đ
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-emerald-600">
                          {lot.quantity}
                        </div>
                        <button
                          onClick={() => onEditLot(lot)}
                          className="mt-1 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                        >
                          Sửa nhanh
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProductDetailModal;
