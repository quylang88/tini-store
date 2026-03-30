import React, { memo } from "react";
import SearchInput from "./SearchInput";
import { ListChecks, CheckSquare } from "lucide-react";
import ToggleButton from "../button/ToggleButton";

const SearchBar = memo(
  ({
    searchTerm,
    onSearchChange,
    onClearSearch,
    placeholder = "Tìm tên hoặc nhập mã...",
    className = "",
    wrapperClassName = "",
    onToggleSelect,
    isSelectionMode,
  }) => {
    return (
      <div className={`bg-rose-50/90 backdrop-blur ${wrapperClassName}`}>
        <div className="px-3 pt-3 pb-1">
          <div className={`flex items-center gap-2 ${className}`}>
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
              <ToggleButton
                isActive={isSelectionMode}
                onClick={onToggleSelect}
                activeIcon={CheckSquare}
                inactiveIcon={ListChecks}
                label={
                  isSelectionMode ? "Thoát chế độ chọn" : "Bật chế độ chọn"
                }
                className="flex-shrink-0"
              />
            )}
          </div>
        </div>
      </div>
    );
  },
);

SearchBar.displayName = "SearchBar";

export default SearchBar;
