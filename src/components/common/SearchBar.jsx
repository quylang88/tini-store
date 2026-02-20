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
            className={`w-[42px] h-[42px] flex items-center justify-center rounded-xl transition-all duration-300 flex-shrink-0 relative overflow-hidden ${
              isSelectionMode
                ? "bg-rose-500 text-white shadow-md border border-rose-600 scale-105"
                : "bg-rose-100 text-rose-600 border border-rose-200 active:bg-rose-200 active:scale-95"
            }`}
            aria-label={
              isSelectionMode ? "Thoát chế độ chọn" : "Bật chế độ chọn"
            }
          >
            <div className="relative z-10">
              {isSelectionMode ? (
                <CheckSquare size={20} strokeWidth={2} />
              ) : (
                <ListChecks size={20} strokeWidth={2} />
              )}
            </div>
            {/* Ink ripple effect simulation or just use active:scale for simplicity */}
          </button>
        )}
      </div>
    );
  },
);

SearchBar.displayName = "SearchBar";

export default SearchBar;
