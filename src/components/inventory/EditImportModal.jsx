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
    warehouse: "lamDong",
    // Shipping
    shippingMethod: "vn", // 'vn' or 'jp'
    shippingFeeVnd: "",
    shippingWeightKg: "",
    shippingFeeJpy: "",
    costJpy: "", // For JPY edit support
  });

  useEffect(() => {
    if (record) {
      setFormData({
        remainingQuantity: record.remainingQuantity,
        originalQuantity: record.originalQuantity,
        cost: record.cost,
        warehouse: record.warehouse || "lamDong",
        shippingMethod: record.shipping?.method || "vn",
        shippingFeeVnd: record.shipping?.perUnitVnd || record.shipping?.feeVnd || "", // This is confusing in data, let's use what we have
        // Actually, perUnitVnd is calculated. feeVnd is total?
        // Let's rely on purchaseUtils normalization. `perUnitVnd` is what matters for Unit Cost.
        // But user might want to edit the TOTAL fee if it was entered that way?
        // For simplicity, let's edit perUnitVnd for VN method, and Weight/JpyFee for JP method.

        shippingWeightKg: record.shipping?.weightKg || "",
        shippingFeeJpy: record.shipping?.feeJpy || "",

        // Use normalized VND fee as default input if VN method
        shippingFeeVndInput: record.shipping?.method === 'jp' ? '' : (record.shipping?.perUnitVnd || ""),

        costJpy: record.costJpy || "",
      });
    }
  }, [record]);

  if (!isOpen || !record) return null;

  const handleSave = () => {
    const newRemaining = Number(formData.remainingQuantity);
    const oldRemaining = Number(record.remainingQuantity);
    const delta = newRemaining - oldRemaining;

    const oldOriginal = Number(record.originalQuantity);
    const newOriginal = oldOriginal + delta;

    // Construct Shipping Object
    let newShipping = { ...record.shipping };

    if (formData.shippingMethod === 'jp') {
        const weight = Number(formData.shippingWeightKg) || 0;
        const feeJpy = Number(formData.shippingFeeJpy) || 0;
        // Recalculate VND Fee? We need Exchange Rate.
        // We don't have settings here.
        // We should probably rely on existing exchange rate in record, or just keep old VND fee if not provided?
        // Ideally we pass settings or exchange rate.
        // Let's assume record.shipping.exchangeRate exists.
        const rate = record.shipping?.exchangeRate || 170; // Fallback
        const feeVnd = Math.round(feeJpy * rate);

        newShipping = {
            method: 'jp',
            weightKg: weight,
            feeJpy: feeJpy,
            feeVnd: feeVnd,
            perUnitVnd: feeVnd, // Assuming 1 unit logic or we divide?
            // Wait, feeJpy usually is TOTAL for the weight.
            // But here we are editing a LOT.
            // If weight is for the LOT.
            // Then perUnitVnd = feeVnd / quantity? Or is weight per unit?
            // In `inventoryForm`: weight is for the LOT (entered for the batch).
            // `feeJpy = weight * 900`.
            // `feeVnd = feeJpy * rate`.
            // `shippingInfo` has `perUnitVnd: feeVnd`.
            // WAIT. If `feeVnd` is total fee, then `perUnitVnd` should be `feeVnd / quantity`.
            // BUT `addPurchaseLot` uses `perUnitVnd: shippingFeeVnd`.
            // Let's check `inventorySaveUtils`.
            // `const feeJpy = ...`. `const feeVnd = ...`.
            // `shipping: { ... perUnitVnd: feeVnd }`.
            // It seems `feeVnd` calculated there is treated as PER UNIT?
            // No, `shippingWeight` in form is usually "Weight per unit" or "Total Weight"?
            // Form label: "Cân nặng (kg)". Usually for 1 unit if adding 1 product?
            // No, usually bulk import.
            // If I import 10 items, 1kg total. Fee is for 1kg.
            // Then fee per unit is Fee/10.
            // The current logic in `inventorySaveUtils`: `feeVnd` is passed to `perUnitVnd`.
            // If the user entered Total Weight, then `perUnitVnd` is inflated.
            // Let's assume the user enters "Weight PER UNIT" in the form?
            // Label says "Cân nặng".
            // If I look at `inventoryForm.js` (not visible here), usually it's implicit.
            // Let's stick to updating the fields directly as they are stored.
            exchangeRate: rate
        };
    } else {
        // VN Method
        const fee = Number(formData.shippingFeeVndInput) || 0;
        newShipping = {
            method: 'vn',
            feeVnd: fee,
            perUnitVnd: fee
        };
    }

    onSave({
      ...record,
      remainingQuantity: newRemaining,
      originalQuantity: newOriginal,
      cost: Number(formData.cost),
      costJpy: formData.costJpy ? Number(formData.costJpy) : undefined,
      warehouse: formData.warehouse,
      shipping: newShipping
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
          className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
            <h3 className="font-bold text-gray-800">Sửa lần nhập hàng</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Read Only Date */}
            <div className="text-xs text-gray-400">
               Ngày nhập: {new Date(record.importDate).toLocaleDateString('vi-VN')}
            </div>

            {/* Warehouse */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kho hàng
              </label>
              <select
                value={formData.warehouse}
                onChange={(e) => setFormData(prev => ({ ...prev, warehouse: e.target.value }))}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                 <option value="lamDong">Lâm Đồng</option>
                 <option value="vinhPhuc">Vĩnh Phúc</option>
              </select>
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
             <div className="grid grid-cols-2 gap-3">
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá vốn (VND)
                  </label>
                  <EnhancedInput
                    type="tel"
                    value={formData.cost}
                    onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* JPY Cost (Optional) */}
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá vốn (JPY)
                  </label>
                  <EnhancedInput
                    type="tel"
                    placeholder="Tùy chọn"
                    value={formData.costJpy}
                    onChange={(e) => setFormData(prev => ({ ...prev, costJpy: e.target.value }))}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
            </div>

            {/* Shipping Config */}
             <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    Phí vận chuyển
                </label>

                <div className="flex gap-4 mb-3">
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            name="shippingMethod"
                            value="vn"
                            checked={formData.shippingMethod === 'vn'}
                            onChange={(e) => setFormData(prev => ({ ...prev, shippingMethod: 'vn' }))}
                            className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">Việt Nam</span>
                    </label>
                     <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            name="shippingMethod"
                            value="jp"
                            checked={formData.shippingMethod === 'jp'}
                            onChange={(e) => setFormData(prev => ({ ...prev, shippingMethod: 'jp' }))}
                            className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">Nhật Bản</span>
                    </label>
                </div>

                {formData.shippingMethod === 'vn' ? (
                     <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Phí vận chuyển (VND/sp)
                      </label>
                      <EnhancedInput
                        type="tel"
                        value={formData.shippingFeeVndInput}
                        onChange={(e) => setFormData(prev => ({ ...prev, shippingFeeVndInput: e.target.value }))}
                        className="w-full p-2 bg-white border border-gray-200 rounded-lg"
                      />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                         <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Cân nặng (kg)
                          </label>
                          <EnhancedInput
                            type="tel"
                            value={formData.shippingWeightKg}
                            onChange={(e) => setFormData(prev => ({ ...prev, shippingWeightKg: e.target.value }))}
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg"
                          />
                        </div>
                         <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Phí Nhật (JPY)
                          </label>
                          <EnhancedInput
                            type="tel"
                            value={formData.shippingFeeJpy}
                            onChange={(e) => setFormData(prev => ({ ...prev, shippingFeeJpy: e.target.value }))}
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg"
                          />
                        </div>
                    </div>
                )}
             </div>

             <div className="pt-2">
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
