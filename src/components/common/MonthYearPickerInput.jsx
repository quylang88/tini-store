import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
} from "react";
import { Calendar } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// Helper: Phân tích chuỗi giá trị "yyyy-mm-dd" thành đối tượng Date (Giờ địa phương)
const parseDate = (val) => {
  if (!val) return new Date();
  const parts = val.split("-");
  if (parts.length !== 3) return new Date();
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
};

// Helper: Định dạng Date thành MM/YYYY để hiển thị
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

const MonthYearPickerPopup = ({ value, onChange }) => {
  // Tham chiếu onChange ổn định để ngăn các vấn đề phụ thuộc trong effects
  const onChangeRef = useRef(onChange);
  useLayoutEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // State nội bộ cho view picker, khởi tạo từ prop value
  const [viewDate, setViewDate] = useState(() => parseDate(value));

  // Hàm updateValue ổn định
  const updateValue = useCallback((newYear, newMonth) => {
    // Tạo date mới: YYYY-MM-01
    // Định dạng thành YYYY-MM-DD
    const yearStr = newYear;
    const monthStr = String(newMonth + 1).padStart(2, "0");
    const dayStr = "01";
    onChangeRef.current?.(`${yearStr}-${monthStr}-${dayStr}`);
  }, []);

  // Logic: Xử lý giá trị rỗng khi mount (mặc định là Hôm nay)
  useEffect(() => {
    if (!value) {
      const today = new Date();
      updateValue(today.getFullYear(), today.getMonth());
      // viewDate đã được khởi tạo là today bởi parseDate(value)
    }
  }, [value, updateValue]);

  // Refs để cuộn
  const monthListRef = useRef(null);
  const yearListRef = useRef(null);

  // Logic: Cuộn tới phần tử active khi viewDate thay đổi
  useLayoutEffect(() => {
    centerActiveElement(monthListRef.current);
    centerActiveElement(yearListRef.current);
  }, [viewDate]);

  const handleSelectMonth = (newMonth) => {
    const currentYear = viewDate.getFullYear();
    // Cập nhật viewDate để highlight UI
    setViewDate(new Date(currentYear, newMonth, 1));
    // Cập nhật giá trị cha
    updateValue(currentYear, newMonth);
  };

  const handleSelectYear = (newYear) => {
    const currentMonth = viewDate.getMonth();
    // Cập nhật viewDate để highlight UI
    setViewDate(new Date(newYear, currentMonth, 1));
    // Cập nhật giá trị cha
    updateValue(newYear, currentMonth);
  };

  // Tạo danh sách năm (memoized cho lần mount hiện tại)
  const rangeYears = useMemo(() => {
    return Array.from(
      { length: 101 },
      (_, i) => new Date().getFullYear() - 50 + i,
    );
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute z-50 bottom-full mb-2 left-0 w-full origin-bottom bg-white p-3 rounded-xl shadow-lg border border-amber-100 select-none overflow-hidden"
    >
      <div className="flex justify-center items-center mb-2 pb-2 border-b border-rose-100">
        <span className="text-sm font-bold text-rose-800 uppercase">
          Chọn Tháng Năm
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 h-48">
        {/* Danh sách tháng */}
        <div
          ref={monthListRef}
          className="overflow-y-auto overscroll-contain border-r border-rose-100 pr-1 h-full relative scrollbar-hide"
        >
          {Array.from({ length: 12 }, (_, i) => i).map((m) => (
            <button
              key={m}
              onClick={() => handleSelectMonth(m)}
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
        {/* Danh sách năm */}
        <div
          ref={yearListRef}
          className="overflow-y-auto overscroll-contain pl-1 h-full relative scrollbar-hide"
        >
          {rangeYears.map((y) => (
            <button
              key={y}
              onClick={() => handleSelectYear(y)}
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
  );
};

const MonthYearPickerInput = ({
  value, // "yyyy-mm-dd" string
  onChange, // (value: string "yyyy-mm-dd") => void
  placeholder = "Chọn tháng năm...",
  className = "",
  inputClassName = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Đóng popup khi click ra ngoài
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
          <MonthYearPickerPopup value={value} onChange={onChange} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MonthYearPickerInput;
