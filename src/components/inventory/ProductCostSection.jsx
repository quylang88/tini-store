import React from "react";
import {
  formatInputNumber,
  formatNumber,
} from "../../utils/formatters/formatUtils";

const ProductCostSection = ({
  formData,
  onCurrencyChange,
  onMoneyChange,
  highlightOps,
}) => {
  const getHighlightProps = highlightOps?.getHighlightProps || (() => ({}));
  const isHighlighted = highlightOps?.isHighlighted || (() => false);
  const highlightClass = highlightOps?.highlightClass || "";

  return (
    <div className="bg-rose-50 p-3 rounded-lg border border-rose-100 space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-rose-800 uppercase">
          Giá nhập
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onCurrencyChange("JPY")}
            className={`px-2 py-1 text-[10px] font-semibold rounded border transition ${
              formData.costCurrency === "JPY"
                ? "bg-rose-500 text-white border-rose-500"
                : "bg-transparent text-rose-700 border-rose-200 active:border-rose-400"
            }`}
          >
            Theo Yên
          </button>
          <button
            type="button"
            onClick={() => onCurrencyChange("VND")}
            className={`px-2 py-1 text-[10px] font-semibold rounded border transition ${
              formData.costCurrency === "VND"
                ? "bg-rose-500 text-white border-rose-500"
                : "bg-transparent text-rose-700 border-rose-200 active:border-rose-400"
            }`}
          >
            Theo VNĐ
          </button>
        </div>
      </div>

      <div className="relative">
        {/* Form nhập theo Yên */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            formData.costCurrency === "JPY"
              ? "opacity-100 translate-x-0 relative z-10"
              : "opacity-0 -translate-x-4 absolute inset-0 -z-10 pointer-events-none"
          }`}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-rose-800 uppercase">
                Giá nhập (Yên)
              </label>
              <div className="relative">
                <span className="absolute left-0 top-2 text-rose-500">¥</span>
                <input
                  inputMode="numeric"
                  enterKeyHint="done"
                  className={`w-full bg-transparent border-b border-rose-100 py-2 pl-4 focus:border-rose-400 outline-none text-gray-900 font-bold ${
                    isHighlighted("costJPY") ? highlightClass : ""
                  }`}
                  value={formatInputNumber(formData.costJPY)}
                  onChange={onMoneyChange("costJPY")}
                  placeholder="0"
                  tabIndex={formData.costCurrency === "JPY" ? 0 : -1}
                  {...getHighlightProps("costJPY", formData.costJPY)}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-rose-800 uppercase">
                Tỷ giá
              </label>
              <input
                inputMode="numeric"
                enterKeyHint="done"
                className="w-full bg-transparent border-b border-rose-100 py-2 focus:border-rose-400 outline-none text-gray-900 text-right"
                value={formatInputNumber(formData.exchangeRate)}
                onChange={onMoneyChange("exchangeRate")}
                placeholder="0"
                tabIndex={formData.costCurrency === "JPY" ? 0 : -1}
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            = {formatNumber(formData.cost)} VNĐ (Vốn)
          </div>
        </div>

        {/* Form nhập theo VNĐ */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            formData.costCurrency === "VND"
              ? "opacity-100 translate-x-0 relative z-10"
              : "opacity-0 translate-x-4 absolute inset-0 -z-10 pointer-events-none"
            }`}
        >
          <div className="relative">
            <span className="absolute left-0 top-2 text-rose-500">đ</span>
            <input
              inputMode="numeric"
              enterKeyHint="done"
              className={`w-full bg-transparent border-b border-rose-100 py-2 pl-4 focus:border-rose-400 outline-none text-gray-900 font-bold ${
                isHighlighted("costVNDInput") ? highlightClass : ""
              }`}
              value={formatInputNumber(formData.costVNDInput)}
              onChange={onMoneyChange("costVNDInput")}
              placeholder="0"
              tabIndex={formData.costCurrency === "VND" ? 0 : -1}
              {...getHighlightProps("costVNDInput", formData.costVNDInput)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCostSection;
