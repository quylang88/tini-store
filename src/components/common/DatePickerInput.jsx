import React, { useState, useRef, useEffect } from "react";
import { Calendar } from "lucide-react";
import CustomCalendar from "./CustomCalendar";

const DatePickerInput = ({
  value, // string "yyyy-mm-dd" (native input format) or Date object?
         // Let's assume standard date string "yyyy-mm-dd" to be compatible with native inputs logic,
         // OR standard Date object.
         // Requirements say format "dd/MM/YYYY".
         // Let's accept "yyyy-mm-dd" value (for ease of storage/compatibility) but display "dd/MM/YYYY".
  onChange, // (value: string "yyyy-mm-dd") => void
  placeholder = "Chọn ngày...",
  className = "",
  inputClassName = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Helper: Parse yyyy-mm-dd string to Date
  const parseDate = (val) => {
    if (!val) return null;
    const parts = val.split("-");
    if (parts.length !== 3) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  };

  // Helper: Format Date to yyyy-mm-dd (for storage/onChange)
  const formatDateForValue = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Helper: Format Date to dd/MM/YYYY (for display)
  const formatDateDisplay = (val) => {
    const date = typeof val === 'string' ? parseDate(val) : val;
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const selectedDate = typeof value === 'string' ? parseDate(value) : value;

  const handleSelect = (date) => {
    onChange(formatDateForValue(date));
    // Do NOT close immediately per requirement ("chưa đóng modal mà hightlight ngày đó nổi bật lên")
    // Closing is handled by clicking outside.
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between border-b border-gray-200 py-2 focus:border-rose-400 outline-none font-medium disabled:text-gray-500 text-left ${inputClassName}`}
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value ? formatDateDisplay(value) : placeholder}
        </span>
        <Calendar size={16} className="text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 left-0 w-72 max-w-[90vw]">
          <CustomCalendar
            mode="single"
            selectedDate={selectedDate}
            onDateSelect={handleSelect}
            className="shadow-xl border-rose-200 ring-1 ring-black/5"
          />
        </div>
      )}
    </div>
  );
};

export default DatePickerInput;
