import React, { useState } from "react";
import SheetModal from "../modals/SheetModal";
import Button from "../button/Button";
import ErrorModal from "../modals/ErrorModal";
import {
  formatNumber,
  formatInputNumber,
} from "../../utils/formatters/formatUtils";

const EditPriceModal = ({ item, isOpen, onClose, onSave }) => {
  const [error, setError] = useState(null);

  // Khởi tạo state trực tiếp từ props.
  const [price, setPrice] = useState(() => {
    if (!item) return "";
    // Requirement: "giá sale giá trị khởi đầu là null" nếu chưa có sale (giá = giá gốc).
    if (item.price === item.originalPrice) return "";
    return item.price;
  });

  const [discountPercent, setDiscountPercent] = useState(() => {
    if (!item) return "";
    const basePrice = item.originalPrice || item.price;
    if (basePrice > 0 && basePrice > item.price) {
      const discount = ((basePrice - item.price) / basePrice) * 100;
      return Math.round(discount);
    }
    return "";
  });

  const handlePriceChange = (value) => {
    if (value === "") {
      setPrice("");
      setDiscountPercent("");
      return;
    }

    // Loại bỏ các ký tự không phải số
    const numericValue = Number(value.replace(/[^0-9]/g, ""));
    setPrice(numericValue);

    const basePrice = item?.originalPrice || item?.price || 0;
    if (basePrice > 0) {
      const discount = ((basePrice - numericValue) / basePrice) * 100;
      setDiscountPercent(Math.round(discount * 10) / 10);
    }
  };

  const handleDiscountChange = (value) => {
    const percent = value;
    setDiscountPercent(percent);

    if (percent === "") {
      // Nếu xóa % thì xóa giá sale (về trạng thái null/empty)
      setPrice("");
      return;
    }

    const numPercent = Number(percent);
    const basePrice = item?.originalPrice || item?.price || 0;

    if (basePrice > 0 && !isNaN(numPercent)) {
      const newPrice = basePrice * (1 - numPercent / 100);
      setPrice(Math.round(newPrice));
    }
  };

  const applyQuickSale = (percent) => {
    handleDiscountChange(String(percent));
  };

  const handleSave = () => {
    // Nếu price rỗng thì coi như là giá gốc (huỷ sale) hoặc giữ nguyên giá gốc
    const currentPrice = price === "" ? item.originalPrice || 0 : Number(price);
    const originalPrice = item.originalPrice || 0;
    const cost = item.cost || 0;
    const profit = currentPrice - cost;

    if (currentPrice > originalPrice) {
      setError({
        title: "Giá bán không hợp lệ",
        message: "Giá sale không được lớn hơn giá gốc.",
      });
      return;
    }

    if (currentPrice < 0) {
      setError({
        title: "Giá bán không hợp lệ",
        message: "Giá bán không được nhỏ hơn 0.",
      });
      return;
    }

    // Kiểm tra lợi nhuận <= 0
    if (profit <= 0) {
      setError({
        title: "Lợi nhuận thấp",
        message: `Giá bán ${formatNumber(currentPrice)}đ thấp hơn hoặc bằng giá vốn (${formatNumber(cost)}đ). Lợi nhuận: ${formatNumber(profit)}đ.`,
      });
      return;
    }

    onSave(item.productId || item.id, currentPrice);
    onClose();
  };

  return (
    <>
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
              Sale
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
              Sản phẩm
            </label>
            <div className="text-sm font-medium text-gray-900 mt-1">
              {item?.name}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
              Giá gốc
            </label>
            <div className="text-lg font-medium text-gray-700">
              {formatNumber(item?.originalPrice || 0)}đ
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                Sale (%)
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
              <label className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                Giá sale
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

          {/* Quick Sale Buttons */}
          <div className="flex gap-3">
            {[10, 15, 20, 30].map((percent) => (
              <button
                key={percent}
                onClick={() => applyQuickSale(percent)}
                className="flex-1 py-2 bg-rose-50 text-rose-600 text-xs font-bold rounded-lg border border-rose-100 active:bg-rose-100 transition"
              >
                {percent}%
              </button>
            ))}
          </div>

          <div className="text-xs text-gray-400 italic text-center pt-2">
            Nhập % sale hoặc giá bán trực tiếp.
          </div>
        </div>
      </SheetModal>

      <ErrorModal
        open={!!error}
        title={error?.title}
        message={error?.message}
        onClose={() => setError(null)}
      />
    </>
  );
};

export default EditPriceModal;
