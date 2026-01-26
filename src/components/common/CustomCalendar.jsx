import React, { useState, useMemo, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const CustomCalendar = ({
  mode = "single", // 'single' | 'range'
  selectedDate, // Date | null (cho chế độ single)
  startDate, // Date | null (cho chế độ range)
  endDate, // Date | null (cho chế độ range)
  onDateSelect, // (date) => void
  className = "",
}) => {
  const [viewDate, setViewDate] = useState(() => {
    // Bắt đầu xem tại ngày được chọn hoặc ngày bắt đầu hoặc hôm nay
    const target = selectedDate || startDate || new Date();
    return new Date(target.getFullYear(), target.getMonth(), 1);
  });

  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const monthListRef = useRef(null);
  const yearListRef = useRef(null);

  const scrollToActive = () => {
    if (monthListRef.current) {
      const activeMonth = monthListRef.current.querySelector(".bg-rose-500");
      if (activeMonth) {
        activeMonth.scrollIntoView({ block: "center" });
      }
    }
    if (yearListRef.current) {
      const activeYear = yearListRef.current.querySelector(".bg-rose-500");
      if (activeYear) {
        activeYear.scrollIntoView({ block: "center" });
      }
    }
  };

  // Chuẩn hóa so sánh ngày
  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const today = new Date();

  // Tạo danh sách ngày cho lưới lịch
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7; // Bắt đầu từ Thứ Hai
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [viewDate]);

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateClick = (date) => {
    if (mode === "single") {
      onDateSelect?.(date);
    } else {
      // Logic range thường được xử lý bởi component cha, nhưng ở đây có logic đơn giản:
      // Nếu có onDateSelect (chung), ta chỉ truyền ngày được click
      // Nếu component cha xử lý logic range qua onDateSelect, điều đó là ổn.
      onDateSelect?.(date);
    }
  };

  const handleMonthSelect = (m) => {
    setViewDate(new Date(viewDate.getFullYear(), m, 1));
    // Chưa đóng picker vội, người dùng có thể muốn chọn năm
  };

  const handleYearSelect = (y) => {
    setViewDate(new Date(y, viewDate.getMonth(), 1));
    setShowMonthYearPicker(false); // Đóng sau khi chọn năm (mô hình phổ biến)
  };

  // Tạo danh sách năm cuộn được từ 1900 đến 2100 hoặc +/- 50 năm quanh viewDate
  const rangeYears = useMemo(
    () => Array.from({ length: 101 }, (_, i) => viewDate.getFullYear() - 50 + i),
    [viewDate],
  );

  return (
    <div
      className={`bg-white p-3 rounded-xl shadow-lg border border-amber-100 select-none overflow-hidden relative ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {showMonthYearPicker ? (
          <motion.div
            key="picker"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onAnimationComplete={scrollToActive}
            className="w-full h-full"
          >
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-rose-100">
              <span className="text-sm font-bold text-rose-800">
                Chọn Tháng/Năm
              </span>
              <button
                onClick={() => setShowMonthYearPicker(false)}
                className="text-xs text-rose-500 font-medium px-2"
              >
                Đóng
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 h-48">
              {/* Tháng */}
              <div
                ref={monthListRef}
                className="overflow-y-auto overscroll-contain border-r border-rose-100 pr-1 h-full"
              >
                {Array.from({ length: 12 }, (_, i) => i).map((m) => (
                  <button
                    key={m}
                    onClick={() => handleMonthSelect(m)}
                    className={`w-full text-left px-3 py-1.5 text-xs rounded-lg mb-1 ${
                      viewDate.getMonth() === m
                        ? "bg-rose-500 text-white font-bold"
                        : "text-gray-700"
                    }`}
                  >
                    Tháng {m + 1}
                  </button>
                ))}
              </div>
              {/* Năm */}
              <div
                ref={yearListRef}
                className="overflow-y-auto overscroll-contain pl-1 h-full"
              >
                {rangeYears.map((y) => (
                  <button
                    key={y}
                    id={`year-${y}`}
                    onClick={() => handleYearSelect(y)}
                    className={`w-full text-left px-3 py-1.5 text-xs rounded-lg mb-1 ${
                      viewDate.getFullYear() === y
                        ? "bg-rose-500 text-white font-bold"
                        : "text-gray-700"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
        <button
          onClick={handlePrevMonth}
          className="p-1 text-rose-500 hover:bg-rose-50 rounded-full"
        >
          <ChevronLeft size={18} />
        </button>

        <button
          onClick={() => setShowMonthYearPicker(true)}
          className="text-sm font-bold text-rose-800 hover:bg-rose-50 px-2 py-1 rounded-lg transition"
        >
          Tháng {String(viewDate.getMonth() + 1).padStart(2, "0")}{" "}
          {viewDate.getFullYear()}
        </button>

              <button
                onClick={handleNextMonth}
                className="p-1 text-rose-500 hover:bg-rose-50 rounded-full"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Các ngày trong tuần */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
                <div
                  key={d}
                  className="text-[10px] font-bold text-rose-400 text-center uppercase"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Lưới ngày */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, idx) => {
                if (!date) return <div key={`empty-${idx}`} />;

                const isSelected =
                  mode === "single"
                    ? isSameDay(date, selectedDate)
                    : (startDate && isSameDay(date, startDate)) ||
                      (endDate && isSameDay(date, endDate));

                const isInRange =
                  mode === "range" &&
                  startDate &&
                  endDate &&
                  date >= startDate &&
                  date <= endDate;

                const isToday = isSameDay(date, today);

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => handleDateClick(date)}
                    className={`
                      h-8 rounded-lg text-xs font-medium relative transition-all
                      ${
                        isSelected
                          ? "bg-rose-600 text-white font-bold shadow-md z-10"
                          : isInRange
                            ? "bg-rose-100 text-rose-900"
                            : "text-rose-900"
                      }
                      ${isToday && !isSelected ? "border-2 border-rose-400 text-rose-700 font-bold" : ""}
                      ${isToday && isSelected ? "ring-2 ring-white ring-offset-2 ring-offset-rose-500" : ""}
                    `}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomCalendar;
