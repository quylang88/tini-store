import React from "react";
import { Search, X } from "lucide-react";

// Component dùng chung cho ô tìm kiếm để tránh lặp logic hiển thị icon + nút xoá.
const SearchInput = ({
  value,
  onChange,
  onClear,
  placeholder,
  className = "",
  inputClassName = "",
}) => {
  const hasValue = Boolean(value);

  return (
    <div className={`relative ${className}`}>
      {/* Icon kính lúp để nhận biết đây là ô tìm kiếm */}
      <Search className="absolute left-3 top-2.5 text-amber-400" size={16} />
      <input
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck="false"
        placeholder={placeholder}
        className={`${inputClassName} [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none`}
        style={{ WebkitAppearance: "none" }}
        value={value}
        onChange={onChange}
      />
      {/* Nút xoá nhanh chỉ hiển thị khi đã nhập nội dung */}
      {hasValue && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center text-gray-400 active:text-gray-600"
          aria-label="Xoá nội dung tìm kiếm"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
