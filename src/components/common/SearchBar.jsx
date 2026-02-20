import React, { memo } from "react";
import SearchInput from "./SearchInput";
import { ListChecks, CheckSquare } from "lucide-react";

const SearchBar = memo(
  ({
    searchTerm,
    onSearchChange,
    onClearSearch,
    placeholder = "Tìm tên hoặc nhập mã...",
    className = "",
    onToggleSelect,
    isSelectionMode,
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
        {onToggleSelect && (
          <button
            onClick={onToggleSelect}
            className={`p-2.5 rounded-xl border transition-colors flex-shrink-0 ${
              isSelectionMode
                ? "bg-rose-600 text-white border-rose-600 shadow-md"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 active:bg-gray-100"
            }`}
            aria-label={
              isSelectionMode ? "Thoát chế độ chọn" : "Bật chế độ chọn"
            }
          >
            {isSelectionMode ? (
              <CheckSquare size={20} strokeWidth={2} />
            ) : (
              <ListChecks size={20} strokeWidth={2} />
            )}
          </button>
        )}
      </div>
    );
  },
);

SearchBar.displayName = "SearchBar";

export default SearchBar;
