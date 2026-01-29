import React from "react";
import {
  formatInputNumber,
  formatNumber,
} from "../../utils/formatters/formatUtils";

const ProductShippingSection = ({
  formData,
  onShippingMethodChange,
  onDecimalChange,
  onMoneyChange,
  highlightOps,
  shippingFeeJpy,
  shippingFeeVnd,
}) => {
  const getHighlightProps = highlightOps?.getHighlightProps || (() => ({}));
  const isHighlighted = highlightOps?.isHighlighted || (() => false);
  const highlightClass = highlightOps?.highlightClass || "";

  return (
    <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold text-rose-800 uppercase">
          Phí gửi
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onShippingMethodChange("jp")}
            className={`px-2 py-1 text-[10px] font-semibold rounded border transition ${
              formData.shippingMethod === "jp"
                ? "bg-rose-500 text-white border-rose-500"
                : "bg-transparent text-rose-700 border-rose-200 active:border-rose-400"
            }`}
          >
            Mua tại Nhật
          </button>
          <button
            type="button"
            onClick={() => onShippingMethodChange("vn")}
            className={`px-2 py-1 text-[10px] font-semibold rounded border transition ${
              formData.shippingMethod === "vn"
                ? "bg-rose-500 text-white border-rose-500"
                : "bg-transparent text-rose-700 border-rose-200 active:border-rose-400"
            }`}
          >
            Mua tại VN
          </button>
        </div>
      </div>

      <div className="relative">
        {/* Form phí gửi Nhật */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            formData.shippingMethod === "jp"
              ? "opacity-100 translate-x-0 relative z-10"
              : "opacity-0 -translate-x-4 absolute inset-0 -z-10 pointer-events-none"
          }`}
        >
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-rose-800 uppercase">
              Nhập cân (kg)
            </label>
            <input
              inputMode="decimal"
              enterKeyHint="next"
              lang="en"
              className={`w-full bg-transparent border-b border-rose-100 py-2 focus:border-rose-400 outline-none text-gray-900 font-bold ${
                isHighlighted("shippingWeightKg") ? highlightClass : ""
              }`}
              value={formData.shippingWeightKg}
              onChange={onDecimalChange("shippingWeightKg")}
              placeholder="0"
              tabIndex={formData.shippingMethod === "jp" ? 0 : -1}
              {...getHighlightProps(
                "shippingWeightKg",
                formData.shippingWeightKg,
              )}
            />
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>
                Phí gửi: {formatNumber(shippingFeeJpy)}¥ (~
                {formatNumber(shippingFeeVnd)}đ)
              </span>
              <span className="text-[10px] text-slate-500">900 yên / 1kg</span>
            </div>
          </div>
        </div>

        {/* Form phí gửi Việt Nam */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            formData.shippingMethod === "vn"
              ? "opacity-100 translate-x-0 relative z-10"
              : "opacity-0 translate-x-4 absolute inset-0 -z-10 pointer-events-none"
          }`}
        >
          <div>
            <label className="text-[10px] font-bold text-rose-800 uppercase">
              Phí gửi (VNĐ)
            </label>
            <input
              inputMode="numeric"
              enterKeyHint="done"
              className="w-full bg-transparent border-b border-rose-100 py-2 focus:border-rose-400 outline-none text-gray-900 font-bold"
              value={formatInputNumber(formData.shippingFeeVndInput)}
              onChange={onMoneyChange("shippingFeeVndInput")}
              placeholder="0"
              tabIndex={formData.shippingMethod === "vn" ? 0 : -1}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductShippingSection;
