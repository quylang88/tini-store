import React, { useEffect, useRef } from "react";

const ProductUsageInstructionsField = ({
  value,
  onChange,
  readOnly = false,
  disabled = false,
  isGenerating = false,
  errorText = "",
}) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
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
        ref={textareaRef}
        className={`mt-1 min-h-24 max-h-72 w-full resize-none overflow-y-auto rounded-lg border p-3 text-sm text-gray-900 outline-none read-only:bg-gray-50 read-only:text-gray-500 disabled:bg-gray-100 disabled:text-gray-400 ${
          errorText && !isGenerating
            ? "border-red-400 focus:border-red-500"
            : "border-gray-200 focus:border-rose-400"
        }`}
        value={value ?? ""}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder="Nhập hướng dẫn hoặc để AI tự tạo khi lưu..."
        readOnly={readOnly}
        disabled={disabled}
        aria-invalid={Boolean(errorText)}
      />
      {errorText && !isGenerating && (
        <p
          className="mt-1 text-[11px] text-red-500 font-medium"
          role="alert"
        >
          {errorText}
        </p>
      )}
    </div>
  );
};

export default ProductUsageInstructionsField;
