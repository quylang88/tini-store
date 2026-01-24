import React from "react";
import { Search } from "lucide-react";
import EnhancedInput from "./EnhancedInput";

// Component dùng chung cho ô tìm kiếm
const SearchInput = ({
  value,
  onChange,
  onClear,
  placeholder,
  className = "",
  inputClassName = "",
}) => {
  return (
    <EnhancedInput
      value={value}
      onChange={onChange}
      onClear={onClear}
      placeholder={placeholder}
      className={className}
      inputClassName={inputClassName}
      type="search"
      inputMode="search"
      enterKeyHint="search"
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="none"
      spellCheck="false"
      startIcon={<Search className="text-amber-400" size={16} />}
    />
  );
};

export default SearchInput;
