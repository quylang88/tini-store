import React from "react";
import MonthYearPickerInput from "../common/MonthYearPickerInput";
import {
  formatInputNumber,
  formatNumber,
} from "../../utils/formatters/formatUtils";

const ProductPricingSection = ({
  formData,
  setFormData,
  onMoneyChange,
  highlightOps,
  finalProfit,
  hasProfitData,
  isEditingLot,
}) => {
  const getHighlightProps = highlightOps?.getHighlightProps || (() => ({}));
  const isHighlighted = highlightOps?.isHighlighted || (() => false);
  const highlightClass = highlightOps?.highlightClass || "";

  return (
    <div className="space-y-4">
      {/* Hạn sử dụng */}
      <div>
        <label className="text-xs font-bold text-rose-700 uppercase">
          Hạn sử dụng
        </label>
        <MonthYearPickerInput
          value={formData.expiryDate || ""}
          onChange={(val) => setFormData({ ...formData, expiryDate: val })}
          placeholder="Chọn tháng/năm..."
        />
      </div>

      {/* Giá bán + Lợi nhuận */}
      <div className="grid grid-cols-2 gap-3 items-start">
        <div className="flex flex-col gap-1 min-w-0">
          <label className="text-xs font-bold text-rose-700 uppercase">
            Giá bán (VNĐ)
          </label>
          <input
            inputMode="numeric"
            enterKeyHint="done"
            className={`w-full border-b border-gray-200 py-2 focus:border-rose-400 outline-none text-gray-900 font-bold text-lg disabled:text-gray-500 ${
              isHighlighted("price") ? highlightClass : ""
            }`}
            value={formatInputNumber(formData.price)}
            onChange={onMoneyChange("price")}
            placeholder="0"
            disabled={isEditingLot}
            {...getHighlightProps("price", formData.price)}
          />
        </div>

        <div className="flex flex-col gap-1 min-w-0">
          <label className="text-xs font-bold text-emerald-700 uppercase">
            Lợi nhuận (VNĐ)
          </label>
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
            <div className="text-lg font-bold text-emerald-700">
              {hasProfitData ? formatNumber(finalProfit) : "0"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPricingSection;
