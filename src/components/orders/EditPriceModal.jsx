import React, { useState, useEffect } from "react";
import SheetModal from "../modals/SheetModal";
import Button from "../button/Button";
import {
  formatNumber,
  formatInputNumber,
} from "../../utils/formatters/formatUtils";

const EditPriceModal = ({ item, isOpen, onClose, onSave }) => {
  const [price, setPrice] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");

  useEffect(() => {
    if (item && isOpen) {
      setPrice(item.price);
      // Calculate initial discount percent based on originalPrice
      // If originalPrice is not available (shouldn't happen with new logic), fallback to price
      const basePrice = item.originalPrice || item.price;

      if (basePrice > 0 && basePrice > item.price) {
        const discount = ((basePrice - item.price) / basePrice) * 100;
        setDiscountPercent(Math.round(discount));
      } else {
        setDiscountPercent(0);
      }
    }
  }, [item, isOpen]);

  const handlePriceChange = (value) => {
    // Remove non-numeric chars except standard decimal (though formatInputNumber uses dots/commas)
    // Assuming formatInputNumber uses commas for thousands.
    const numericValue = Number(value.replace(/[^0-9]/g, ""));
    setPrice(numericValue);

    const basePrice = item?.originalPrice || item?.price || 0;
    if (basePrice > 0) {
      const discount = ((basePrice - numericValue) / basePrice) * 100;
      // Allow negative discount (markup) ? Usually no, let's clamp at 0 for display
      // But user might want to increase price. So let's just show negative discount if price > original
      setDiscountPercent(Math.round(discount * 10) / 10);
    }
  };

  const handleDiscountChange = (value) => {
    const percent = value;
    setDiscountPercent(percent); // Allow typing decimal

    const numPercent = Number(percent);
    const basePrice = item?.originalPrice || item?.price || 0;

    if (basePrice > 0 && !isNaN(numPercent)) {
      const newPrice = basePrice * (1 - numPercent / 100);
      // Round to nearest 100 or 1000? Let's just round to integer.
      setPrice(Math.round(newPrice));
    }
  };

  const handleSave = () => {
    onSave(item.productId || item.id, Number(price));
    onClose();
  };

  return (
    <SheetModal
      open={isOpen}
      onClose={onClose}
      title="Điều chỉnh giá bán"
      footer={
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onClose}>
            Huỷ
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Lưu giá
          </Button>
        </div>
      }
    >
      <div className="space-y-4 py-2">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Sản phẩm
          </label>
          <div className="text-sm font-medium text-gray-900 mt-1">
            {item?.name}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Giá gốc
          </label>
          <div className="text-lg font-medium text-gray-700">
            {formatNumber(item?.originalPrice || 0)}đ
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Giảm (%)
            </label>
            <div className="relative mt-1">
              <input
                type="number"
                value={discountPercent}
                onChange={(e) => handleDiscountChange(e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-3 pr-8 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
                placeholder="0"
              />
              <span className="absolute right-3 top-3 text-gray-400 text-sm">
                %
              </span>
            </div>
          </div>
          <div className="flex-[2]">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Giá bán mới
            </label>
            <div className="relative mt-1">
              <input
                type="text"
                inputMode="numeric"
                value={formatInputNumber(price)}
                onChange={(e) => handlePriceChange(e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-3 pr-8 text-lg font-bold text-rose-600 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
                placeholder="0"
              />
              <span className="absolute right-3 top-4 text-gray-400 text-xs">
                đ
              </span>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-400 italic text-center pt-2">
            Nhập % giảm giá hoặc giá bán trực tiếp.
        </div>
      </div>
    </SheetModal>
  );
};

export default EditPriceModal;
