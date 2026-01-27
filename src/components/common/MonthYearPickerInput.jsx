import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { Calendar } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const MonthYearPickerInput = ({
  value, // "yyyy-mm-dd" string
  onChange, // (value: string "yyyy-mm-dd") => void
  placeholder = "Chọn tháng/năm...",
  className = "",
  inputClassName = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const monthListRef = useRef(null);
  const yearListRef = useRef(null);

  // Helper: Parse value string "yyyy-mm-dd" to Date object (Local time)
  const parseDate = (val) => {
    if (!val) return new Date();
    const parts = val.split("-");
    if (parts.length !== 3) return new Date();
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  };

  // Internal state for the picker view
  const [viewDate, setViewDate] = useState(() => parseDate(value));

  // Helper: Format Date to MM/YYYY for display
  const formatDateDisplay = (val) => {
    if (!val) return "";
    const date = parseDate(val);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${year}`;
  };

  const centerActiveElement = (node) => {
    if (!node) return;
    const activeEl = node.querySelector(".bg-rose-500");
    if (activeEl) {
      const top =
        activeEl.offsetTop - node.clientHeight / 2 + activeEl.clientHeight / 2;
      node.scrollTop = top;
    }
  };

  const setMonthListRef = (node) => {
    monthListRef.current = node;
    if (node) centerActiveElement(node);
  };

  const setYearListRef = (node) => {
    yearListRef.current = node;
    if (node) centerActiveElement(node);
  };

  useLayoutEffect(() => {
    if (isOpen) {
      setViewDate(parseDate(value));
    }
  }, [isOpen, value]);

  useLayoutEffect(() => {
    if (isOpen) {
      centerActiveElement(monthListRef.current);
      centerActiveElement(yearListRef.current);
    }
  }, [isOpen, viewDate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
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

  const handleSelect = (newYear, newMonth) => {
    // Construct new date: YYYY-MM-01
    const date = new Date(newYear, newMonth, 1);
    // Format to YYYY-MM-DD
    const yearStr = date.getFullYear();
    const monthStr = String(date.getMonth() + 1).padStart(2, "0");
    const dayStr = "01";
    onChange(`${yearStr}-${monthStr}-${dayStr}`);
    setIsOpen(false);
  };

  const rangeYears = Array.from(
    { length: 101 },
    (_, i) => new Date().getFullYear() - 50 + i,
  );

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          !disabled && setIsOpen(!isOpen);
        }}
        className={`w-full flex items-center justify-between border-b border-gray-200 py-2 focus:border-rose-400 outline-none font-medium disabled:text-gray-500 ${inputClassName}`}
      >
        <span
          className={
            value
              ? "text-gray-900 w-full text-center"
              : "text-gray-400 w-full text-center"
          }
        >
          {value ? formatDateDisplay(value) : placeholder}
        </span>
        <Calendar size={16} className="text-gray-400 absolute right-0" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 bottom-full mb-2 left-0 w-full origin-bottom bg-white p-3 rounded-xl shadow-lg border border-amber-100 select-none overflow-hidden"
          >
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-rose-100">
              <span className="text-sm font-bold text-rose-800">
                Chọn Tháng/Năm
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs text-rose-500 font-medium px-2"
              >
                Đóng
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 h-48">
              {/* Month List */}
              <div
                ref={setMonthListRef}
                className="overflow-y-auto overscroll-contain border-r border-rose-100 pr-1 h-full relative"
              >
                {Array.from({ length: 12 }, (_, i) => i).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      const currentYear = viewDate.getFullYear();
                      handleSelect(currentYear, m);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs rounded-lg mb-1 ${
                      viewDate.getMonth() === m
                        ? "bg-rose-500 text-white font-bold"
                        : "text-gray-700 hover:bg-rose-50"
                    }`}
                  >
                    Tháng {m + 1}
                  </button>
                ))}
              </div>
              {/* Year List */}
              <div
                ref={setYearListRef}
                className="overflow-y-auto overscroll-contain pl-1 h-full relative"
              >
                {rangeYears.map((y) => (
                  <button
                    key={y}
                    onClick={() => {
                      setViewDate(new Date(y, viewDate.getMonth(), 1));
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs rounded-lg mb-1 ${
                      viewDate.getFullYear() === y
                        ? "bg-rose-500 text-white font-bold"
                        : "text-gray-700 hover:bg-rose-50"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MonthYearPickerInput;
