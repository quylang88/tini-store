import React from 'react';
import { Search, X } from 'lucide-react';

// Component dùng chung cho ô tìm kiếm để tránh lặp logic hiển thị icon + nút xoá.
const SearchInput = ({
  value,
  onChange,
  onClear,
  placeholder,
  className = '',
  inputClassName = '',
}) => {
  const hasValue = Boolean(value);

  return (
    <div className={`relative ${className}`}>
      {/* Icon kính lúp để nhận biết đây là ô tìm kiếm */}
      <Search className="absolute left-3 top-2.5 text-amber-400" size={16} />
      <input
        type="text"
        placeholder={placeholder}
        className={inputClassName}
        value={value}
        onChange={onChange}
      />
      {/* Nút xoá nhanh chỉ hiển thị khi đã nhập nội dung */}
      {hasValue && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
          aria-label="Xoá nội dung tìm kiếm"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
