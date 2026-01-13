import React, { useEffect, useMemo, useRef, useState } from 'react';

const DateRangeFilter = ({ customRange, setCustomRange }) => {
  const [quickMonth, setQuickMonth] = useState('');
  const [quickYear, setQuickYear] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const containerRef = useRef(null);

  const formatDateInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDateValue = (value) => (value ? new Date(`${value}T00:00:00`) : null);

  const startDate = useMemo(() => parseDateValue(customRange.start), [customRange.start]);
  const endDate = useMemo(() => parseDateValue(customRange.end), [customRange.end]);

  const formatDateDisplay = (date) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const updateCustomRange = (nextRange) => {
    setQuickMonth('');
    setQuickYear('');
    setCustomRange(prev => ({ ...prev, ...nextRange }));
  };

  const handleDateSelect = (date) => {
    const selected = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (!startDate || (startDate && endDate)) {
      updateCustomRange({ start: formatDateInput(selected), end: '' });
      return;
    }
    if (selected < startDate) {
      updateCustomRange({ start: formatDateInput(selected), end: formatDateInput(startDate) });
      return;
    }
    updateCustomRange({ start: formatDateInput(startDate), end: formatDateInput(selected) });
  };

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < startOffset; i += 1) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      days.push(new Date(year, month, day));
    }
    return days;
  }, [calendarMonth]);

  const handleQuickMonthChange = (event) => {
    const value = event.target.value;
    setQuickMonth(value);
    if (!value) return;
    setQuickYear('');
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

  const handleQuickYearChange = (event) => {
    const value = event.target.value;
    setQuickYear(value);
    if (!value) return;
    const year = Number(value);
    setQuickMonth('');
    setCustomRange({ start: null, end: null });
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    setCustomRange({
      start: formatDateInput(start),
      end: formatDateInput(end),
    });
  };

  const handleReset = () => {
    const now = new Date();
    const monthValue = String(now.getMonth() + 1).padStart(2, '0');
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setQuickMonth(monthValue);
    setQuickYear('');
    setCustomRange({
      start: formatDateInput(start),
      end: formatDateInput(end),
    });
  };

  useEffect(() => {
    if (customRange.start || customRange.end) return;
    handleReset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Đóng lịch khi bấm ra ngoài để tránh che giao diện.
    const handleClickOutside = (event) => {
      if (!calendarOpen) return;
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [calendarOpen]);

  return (
    <div className="grid gap-2 text-xs text-amber-700" ref={containerRef}>
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase text-amber-500">Khoảng thời gian</span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setCalendarOpen(open => !open)}
            className="flex w-full items-center justify-between gap-2 rounded-lg border border-amber-100 bg-amber-50/70 px-3 py-2 text-xs text-amber-900"
          >
            <span className="font-semibold text-amber-900">
              {startDate ? formatDateDisplay(startDate) : 'Chọn ngày bắt đầu'}
            </span>
            <span className="text-amber-400">→</span>
            <span className="font-semibold text-amber-900">
              {endDate ? formatDateDisplay(endDate) : 'Chọn ngày kết thúc'}
            </span>
          </button>
          {calendarOpen && (
            <div className="absolute z-20 mt-2 w-full rounded-xl border border-amber-100 bg-white p-3 shadow-lg">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-amber-700">
                <button
                  type="button"
                  onClick={() => setCalendarMonth(month => new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                  className="rounded-full px-2 py-1 text-amber-500 hover:bg-amber-50"
                >
                  ‹
                </button>
                <div>
                  Tháng {String(calendarMonth.getMonth() + 1).padStart(2, '0')} {calendarMonth.getFullYear()}
                </div>
                <button
                  type="button"
                  onClick={() => setCalendarMonth(month => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                  className="rounded-full px-2 py-1 text-amber-500 hover:bg-amber-50"
                >
                  ›
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-[11px] font-semibold text-amber-400">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                  <div key={day} className="text-center">{day}</div>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1 text-xs">
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} />;
                  }
                  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                  const isStart = startDate && dateOnly.getTime() === startDate.getTime();
                  const isEnd = endDate && dateOnly.getTime() === endDate.getTime();
                  const inRange = startDate && endDate
                    ? dateOnly >= startDate && dateOnly <= endDate
                    : false;
                  return (
                    <button
                      key={date.toISOString()}
                      type="button"
                      onClick={() => handleDateSelect(date)}
                      className={[
                        'rounded-lg px-2 py-1 text-center transition',
                        inRange ? 'bg-amber-100 text-amber-900' : 'text-amber-700 hover:bg-amber-50',
                        isStart || isEnd ? 'bg-amber-500 text-white hover:bg-amber-500' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase text-amber-500">Theo tháng</span>
          <select
            value={quickMonth}
            onChange={handleQuickMonthChange}
            className="rounded-lg border border-amber-100 bg-white px-2 py-1.5 text-xs text-amber-900"
          >
            <option value="">Chọn tháng</option>
            {Array.from({ length: 12 }, (_, index) => {
              const monthValue = String(index + 1).padStart(2, '0');
              return (
                <option key={monthValue} value={monthValue}>
                  Tháng {monthValue}
                </option>
              );
            })}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase text-amber-500">Theo năm</span>
          <input
            type="number"
            value={quickYear}
            onChange={handleQuickYearChange}
            placeholder="Nhập năm"
            className="rounded-lg border border-amber-100 bg-white px-2 py-1.5 text-xs text-amber-900"
          />
        </label>
      </div>
      <button
        type="button"
        onClick={handleReset}
        className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"
      >
        Reset
      </button>
    </div>
  );
};

export default DateRangeFilter;
