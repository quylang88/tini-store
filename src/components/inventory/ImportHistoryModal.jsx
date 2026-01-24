import React, { useMemo } from "react";
import { X, Edit2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatNumber, formatDate } from "../../utils/formatters/formatUtils";
import { getImportHistory } from "../../utils/inventory/historyUtils";

const ImportHistoryModal = ({ isOpen, onClose, product, onEditImport }) => {
  const history = useMemo(() => {
    if (!product || !isOpen) return [];
    const allHistory = getImportHistory();
    // Filter by product ID and sort by date desc
    return allHistory
      .filter((h) => h.productId === product.id)
      .sort((a, b) => new Date(b.importDate) - new Date(a.importDate));
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Lịch sử nhập hàng
              </h2>
              <p className="text-sm text-gray-500 line-clamp-1">{product.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* List */}
          <div className="overflow-y-auto p-4 space-y-3">
            {history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Chưa có lịch sử nhập hàng nào.
              </div>
            ) : (
              history.map((record) => (
                <HistoryItem
                    key={record.id}
                    record={record}
                    onEdit={() => onEditImport(record)}
                />
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const HistoryItem = ({ record, onEdit }) => {
  const isJp = record.shipping && record.shipping.method === "jp";
  const importDate = formatDate(record.importDate);

  const original = Number(record.originalQuantity) || 0;
  const remaining = Number(record.remainingQuantity) || 0;

  // Badge Logic
  let badge = null;
  const isOutOfStock = remaining === 0;

  if (isOutOfStock) {
    badge = (
      <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500 rounded-full">
        Hết
      </span>
    );
  } else if (remaining < original * 0.15) {
     badge = (
      <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-600 rounded-full">
        Sắp hết
      </span>
    );
  }

  // Cost Display
  const renderCost = () => {
    if (isJp && record.costJpy) {
      // Show Yen cost + VND equivalent
      return (
        <span className="font-medium text-rose-600">
             {formatNumber(record.costJpy)}¥
             <span className="text-xs text-gray-400 font-normal ml-1">
                 (~{formatNumber(record.cost)}đ)
             </span>
        </span>
      );
    }
    return <span className="font-medium text-rose-600">{formatNumber(record.cost)}đ</span>;
  };

  const renderShipping = () => {
    if (isJp) {
        // "phí gửi nếu tại nhật thì phải hiển thị số cân kèm tiền yên tương ứng"
        const weight = record.shipping?.weightKg || 0;
        const feeJpy = record.shipping?.feeJpy || 0;
        return (
            <div className="text-xs text-gray-500">
                Phí: {weight}kg ({formatNumber(feeJpy)}¥)
            </div>
        )
    }
    const feeVnd = record.shipping?.feeVnd || record.shipping?.perUnitVnd || 0;
    return (
        <div className="text-xs text-gray-500">
            Phí: {formatNumber(feeVnd)}đ/sp
        </div>
    )
  };

  return (
    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 relative">
      <div className="flex justify-between items-start mb-2">
        <div className="text-sm font-medium text-gray-700">{importDate}</div>
        {badge}
      </div>

      <div className="flex justify-between items-center mb-2">
        <div className="flex flex-col">
            <div className="text-xs text-gray-400">Giá nhập</div>
            {renderCost()}
        </div>
        <div className="flex flex-col text-right">
             {renderShipping()}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-200 mt-2">
         <div className="flex items-center gap-4 text-sm">
            <div>
                <span className="text-gray-400 text-xs block">Nhập</span>
                <span className="font-bold text-gray-800">{original}</span>
            </div>
            <div>
                <span className="text-gray-400 text-xs block">Tồn</span>
                <span className={`font-bold ${isOutOfStock ? 'text-gray-400' : 'text-emerald-600'}`}>
                    {remaining}
                </span>
            </div>
         </div>

         <button
            onClick={onEdit}
            disabled={isOutOfStock}
            className={`p-2 rounded-lg transition-colors ${
                isOutOfStock
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-white text-blue-600 shadow-sm border border-gray-200 hover:bg-blue-50'
            }`}
         >
            <Edit2 size={16} />
         </button>
      </div>

       <div className="absolute top-3 right-12 text-xs text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-100">
        {record.warehouse === 'vinhPhuc' ? 'Vĩnh Phúc' : 'Lâm Đồng'}
       </div>
    </div>
  );
};

export default ImportHistoryModal;
