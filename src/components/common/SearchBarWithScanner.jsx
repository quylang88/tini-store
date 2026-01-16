import React from "react";
import { ScanBarcode } from "lucide-react";
import SearchInput from "./SearchInput";

const SearchBarWithScanner = ({
  searchTerm,
  onSearchChange,
  onClearSearch,
  onShowScanner,
  placeholder = "Tìm tên hoặc quét mã...",
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
          inputClassName="w-full bg-amber-100/70 pl-9 pr-9 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-all"
        />
      </div>

      {/* Barcode Scanner Button - Fixed size, Distinct background */}
      <button
        onClick={onShowScanner}
        className="flex-none w-10 h-10 bg-amber-200 text-amber-800 rounded-xl flex items-center justify-center active:scale-95 transition shadow-sm hover:bg-amber-300 border border-amber-300"
        aria-label="Quét mã vạch"
      >
        <ScanBarcode size={22} />
      </button>
    </div>
  );
};

export default SearchBarWithScanner;
