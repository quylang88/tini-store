import React, { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";

const ProductUsageInstructionsField = ({
  value,
  onChange,
  onGenerateAI,
  readOnly = false,
  disabled = false,
  isGenerating = false,
  errorText = "",
}) => {
  const textareaRef = useRef(null);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const showOfflineMessage = !isOnline && isGenerating;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-bold text-rose-700 uppercase">
          Hướng dẫn sử dụng
        </label>
        {isGenerating ? (
          <span
            className={`text-[11px] font-medium flex items-center gap-1 ${
              !isOnline ? "text-amber-700 font-semibold" : "text-amber-600"
            }`}
            role="status"
          >
            {!isOnline ? "Không có kết nối mạng" : "AI đang tra cứu…"}
          </span>
        ) : (
          onGenerateAI && (
            <button
              type="button"
              onClick={onGenerateAI}
              disabled={disabled || readOnly || !isOnline}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200/80 rounded-md hover:bg-amber-100 active:bg-amber-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Tra cứu hướng dẫn sử dụng bằng AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Tra cứu AI</span>
            </button>
          )
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
        placeholder="Nhập hướng dẫn hoặc bấm Tra cứu AI..."
        readOnly={readOnly}
        disabled={disabled}
        aria-invalid={Boolean(errorText)}
      />
      {showOfflineMessage && (
        <p className="mt-1 text-[11px] text-amber-600 font-medium" role="alert">
          Không có kết nối Internet để AI tra cứu HDSD. Vui lòng kiểm tra mạng hoặc nhập thủ công.
        </p>
      )}
      {errorText && !isGenerating && !showOfflineMessage && (
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
