import React, { memo } from "react";
import SearchInput from "./SearchInput";

const SearchBar = memo(
  ({
    searchTerm,
    onSearchChange,
    onClearSearch,
    placeholder = "Tìm tên hoặc nhập mã...",
    className = "",
  }) => {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Search Input expands to fill space */}
        <div className="flex-1">
          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            onClear={onClearSearch}
            placeholder={placeholder}
            inputClassName="w-full bg-rose-100 pl-9 pr-9 py-2.5 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-300 transition-all border border-rose-300"
          />
        </div>
      </div>
    );
  },
);

SearchBar.displayName = "SearchBar";

export default SearchBar;
