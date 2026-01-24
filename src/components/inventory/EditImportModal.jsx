import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatNumber } from "../../utils/formatters/formatUtils";
import EnhancedInput from "../common/EnhancedInput";

const EditImportModal = ({ isOpen, onClose, record, onSave }) => {
  const [formData, setFormData] = useState({
    remainingQuantity: "",
    originalQuantity: "", // Read-only mostly, but affects delta
    cost: "",
  });

  useEffect(() => {
    if (record) {
      setFormData({
        remainingQuantity: record.remainingQuantity,
        originalQuantity: record.originalQuantity,
        cost: record.cost,
      });
    }
  }, [record]);

  if (!isOpen || !record) return null;

  const handleSave = () => {
    const newRemaining = Number(formData.remainingQuantity);
    const oldRemaining = Number(record.remainingQuantity);
    const delta = newRemaining - oldRemaining;

    // Sync logic: "nhập = 10 , tồn = 5, user thực hiện sửa tồn = 8 -> nhập = 13"
    // So newOriginal = oldOriginal + delta
    const oldOriginal = Number(record.originalQuantity);
    const newOriginal = oldOriginal + delta;

    // We pass the updated record back
    onSave({
      ...record,
      remainingQuantity: newRemaining,
      originalQuantity: newOriginal,
      cost: Number(formData.cost),
      // We could add more fields here if needed
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Sửa lần nhập hàng</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Read Only Info */}
            <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                <div>
                    <span className="block text-gray-400 text-xs">Ngày nhập</span>
                    <span className="font-medium">{new Date(record.importDate).toLocaleDateString('vi-VN')}</span>
                </div>
                 <div>
                    <span className="block text-gray-400 text-xs">Kho</span>
                    <span className="font-medium">{record.warehouse === 'vinhPhuc' ? 'Vĩnh Phúc' : 'Lâm Đồng'}</span>
                </div>
            </div>

            {/* Remaining Quantity Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tồn kho hiện tại
              </label>
              <div className="relative">
                <EnhancedInput
                  type="tel"
                  value={formData.remainingQuantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, remainingQuantity: e.target.value }))}
                  className="w-full pl-3 pr-3 py-3 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold text-lg text-emerald-600"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Sửa tồn kho sẽ tự động cập nhật số lượng nhập tương ứng.
              </p>
            </div>

             {/* Cost Input */}
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá nhập (VND)
              </label>
              <EnhancedInput
                type="tel"
                value={formData.cost}
                onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                className="w-full pl-3 pr-3 py-3 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

             <div className="pt-4">
                <button
                    onClick={handleSave}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                    <Save size={18} />
                    Lưu thay đổi
                </button>
             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditImportModal;
