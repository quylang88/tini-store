import React from "react";

const ProductUsageInstructionsField = ({
  value,
  onChange,
  readOnly = false,
  disabled = false,
  isGenerating = false,
  helperText = "",
}) => (
  <div>
    <div className="flex items-center justify-between gap-3">
      <label className="text-xs font-bold text-rose-700 uppercase">
        Hướng dẫn sử dụng
      </label>
      {isGenerating && (
        <span
          className="text-[11px] font-medium text-amber-600"
          role="status"
        >
          AI đang tra cứu…
        </span>
      )}
    </div>
    <textarea
      className="mt-1 min-h-24 max-h-44 w-full resize-none overflow-y-auto rounded-lg border border-gray-200 p-3 text-sm text-gray-900 outline-none focus:border-rose-400 read-only:bg-gray-50 read-only:text-gray-500 disabled:bg-gray-100 disabled:text-gray-400"
      value={value ?? ""}
      onChange={(event) => onChange?.(event.target.value)}
      onInput={(event) => {
        event.currentTarget.style.height = "auto";
        event.currentTarget.style.height =
          `${event.currentTarget.scrollHeight}px`;
      }}
      placeholder="Nhập hướng dẫn hoặc để AI tự tạo khi lưu..."
      readOnly={readOnly}
      disabled={disabled}
    />
    {(helperText || isGenerating) && (
      <p className="mt-1 text-[11px] text-gray-500">
        {isGenerating
          ? "AI đang tìm nguồn web và chuẩn hoá hướng dẫn sử dụng."
          : helperText}
      </p>
    )}
  </div>
);

export default ProductUsageInstructionsField;
