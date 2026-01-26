import React, { useEffect, useMemo, useRef, useState } from "react";
import CustomCalendar from "../common/CustomCalendar";

const DateRangeFilter = ({ customRange, setCustomRange }) => {
  const [quickMonth, setQuickMonth] = useState("");
  const [quickYear, setQuickYear] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const containerRef = useRef(null);

  // Chuẩn hoá ngày để lưu vào state dưới dạng yyyy-mm-dd.
  const formatDateInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Parse chuỗi yyyy-mm-dd về Date để xử lý so sánh.
  const parseDateValue = (value) =>
    value ? new Date(`${value}T00:00:00`) : null;

  const startDate = useMemo(
    () => parseDateValue(customRange.start),
    [customRange.start]
  );
  const endDate = useMemo(
    () => parseDateValue(customRange.end),
    [customRange.end]
  );

  // Hiển thị theo định dạng dd/mm/yyyy cho người dùng Việt.
  const formatDateDisplay = (date) => {
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Khi người dùng chọn kiểu khác (tháng/năm), xoá phần còn lại để tránh xung đột.
  const updateCustomRange = (nextRange) => {
    setQuickMonth("");
    setQuickYear("");
    setCustomRange((prev) => ({ ...prev, ...nextRange }));
  };

  // Chọn ngày: nhấn lần 1 đặt start, nhấn lần 2 đặt end (tự đảo nếu cần).
  const handleDateSelect = (date) => {
    const selected = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    if (!startDate || (startDate && endDate)) {
      updateCustomRange({ start: formatDateInput(selected), end: "" });
      return;
    }
    if (selected < startDate) {
      updateCustomRange({
        start: formatDateInput(selected),
        end: formatDateInput(startDate),
      });
      return;
    }
    updateCustomRange({
      start: formatDateInput(startDate),
      end: formatDateInput(selected),
    });
  };

  // Chọn nhanh theo tháng sẽ tự set khoảng đầu/cuối tháng hiện tại.
  const handleQuickMonthChange = (event) => {
    const value = event.target.value;
    setQuickMonth(value);
    if (!value) return;
    setQuickYear("");
    setCustomRange({ start: null, end: null });
    const year = new Date().getFullYear();
    const month = Number(value);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    setCustomRange({
      start: formatDateInput(start),
      end: formatDateInput(end),
    });
  };

  // Chọn nhanh theo năm sẽ set khoảng 01/01 - 31/12 của năm đó.
  const handleQuickYearChange = (event) => {
    const value = event.target.value;
    setQuickYear(value);
    if (!value) return;
    const year = Number(value);
    setQuickMonth("");
    setCustomRange({ start: null, end: null });
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    setCustomRange({
      start: formatDateInput(start),
      end: formatDateInput(end),
    });
  };

  // Reset về tháng hiện tại và đưa lịch về đúng tháng hôm nay.
  const handleReset = () => {
    const now = new Date();
    const monthValue = String(now.getMonth() + 1).padStart(2, "0");
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setQuickMonth(monthValue);
    setQuickYear("");
    setCustomRange({
      start: formatDateInput(start),
      end: formatDateInput(end),
    });
  };

  useEffect(() => {
    // Mặc định lọc theo tháng hiện tại khi chưa có dữ liệu chọn trước.
    if (customRange.start || customRange.end) return;
    handleReset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Đóng lịch khi bấm ra ngoài để tránh che giao diện.
    const handleClickOutside = (event) => {
      if (!calendarOpen) return;
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [calendarOpen]);

  return (
    <div className="grid gap-2 text-xs text-rose-700" ref={containerRef}>
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase text-rose-500">
          Khoảng thời gian
        </span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setCalendarOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-2 rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs text-rose-900 shadow-sm transition active:bg-rose-50"
          >
            <span className="font-semibold text-rose-900">
              {startDate ? formatDateDisplay(startDate) : "Chọn ngày bắt đầu"}
            </span>
            <span className="text-rose-400">→</span>
            <span className="font-semibold text-rose-900">
              {endDate ? formatDateDisplay(endDate) : "Chọn ngày kết thúc"}
            </span>
          </button>
          {calendarOpen && (
            <div className="absolute z-20 mt-2 w-full">
               <CustomCalendar
                  mode="range"
                  startDate={startDate}
                  endDate={endDate}
                  onDateSelect={handleDateSelect}
                  className="w-full"
               />
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase text-rose-500">
            Theo tháng
          </span>
          <select
            value={quickMonth}
            onChange={handleQuickMonthChange}
            className="rounded-lg border border-rose-300 bg-white px-2 py-1.5 text-xs text-rose-900 shadow-sm focus:border-rose-400 focus:ring-1 focus:ring-rose-400 outline-none transition-colors"
          >
            <option value="">Chọn tháng</option>
            {Array.from({ length: 12 }, (_, index) => {
              const monthValue = String(index + 1).padStart(2, "0");
              return (
                <option key={monthValue} value={monthValue}>
                  Tháng {monthValue}
                </option>
              );
            })}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase text-rose-500">
            Theo năm
          </span>
          <input
            type="number"
            value={quickYear}
            onChange={handleQuickYearChange}
            placeholder="Nhập năm"
            className="rounded-lg border border-rose-300 bg-white px-2 py-1.5 text-xs text-rose-900 placeholder-rose-300 shadow-sm focus:border-rose-400 focus:ring-1 focus:ring-rose-400 outline-none transition-colors"
          />
        </label>
      </div>
      <button
        type="button"
        onClick={() => {
          handleReset();
          updateCustomRange({ start: null, end: null });
        }}
        className="w-full rounded-lg border border-rose-300 bg-rose-100 px-3 py-2 text-xs font-bold text-rose-800 transition active:bg-rose-200 shadow-sm"
      >
        Reset
      </button>
    </div>
  );
};

export default DateRangeFilter;
