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
          inputClassName="w-full bg-rose-100 pl-9 pr-9 py-2.5 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-300 transition-all border border-rose-300"
        />
      </div>

      {/* Barcode Scanner Button - Fixed size, Distinct background */}
      <button
        onClick={onShowScanner}
        className="flex-none w-10 h-10 bg-rose-200 text-rose-800 rounded-xl flex items-center justify-center active:scale-95 transition shadow-sm hover:bg-rose-300 border border-rose-300"
        aria-label="Quét mã vạch"
      >
        <ScanBarcode size={22} />
      </button>
    </div>
  );
};

export default SearchBarWithScanner;
