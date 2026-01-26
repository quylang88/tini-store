import React, { useState, useRef, useEffect } from "react";
import { Calendar } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import CustomCalendar from "./CustomCalendar";

const DatePickerInput = ({
  value, // chuỗi "yyyy-mm-dd" (format input native) hoặc đối tượng Date?
  // Giả sử dùng chuỗi chuẩn "yyyy-mm-dd" để tương thích với logic input native,
  // HOẶC đối tượng Date chuẩn.
  // Yêu cầu hiển thị format "dd/MM/YYYY".
  // Chấp nhận giá trị "yyyy-mm-dd" (để dễ lưu trữ/tương thích) nhưng hiển thị "dd/MM/YYYY".
  onChange, // (value: string "yyyy-mm-dd") => void
  placeholder = "Chọn ngày...",
  className = "",
  inputClassName = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Helper: Parse chuỗi yyyy-mm-dd thành Date
  const parseDate = (val) => {
    if (!val) return null;
    const parts = val.split("-");
    if (parts.length !== 3) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  };

  // Helper: Format Date thành yyyy-mm-dd (để lưu trữ/onChange)
  const formatDateForValue = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Helper: Format Date thành dd/MM/YYYY (để hiển thị)
  const formatDateDisplay = (val) => {
    const date = typeof val === "string" ? parseDate(val) : val;
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const selectedDate = typeof value === "string" ? parseDate(value) : value;

  const handleSelect = (date) => {
    onChange(formatDateForValue(date));
    // Chưa đóng modal mà highlight ngày đó nổi bật lên
    // Việc đóng được xử lý khi click ra ngoài
  };

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

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 bottom-full mb-2 left-0 w-full origin-bottom"
          >
            <CustomCalendar
              mode="single"
              selectedDate={selectedDate}
              onDateSelect={handleSelect}
              className="shadow-xl border-rose-200 ring-1 ring-black/5"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DatePickerInput;
