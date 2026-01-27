import { useState, useEffect } from "react";

/**
 * useDebounce Hook
 * Trì hoãn việc cập nhật giá trị cho đến khi thời gian chờ (delay) kết thúc.
 * Hữu ích để tối ưu hiệu năng cho các thao tác như tìm kiếm, filter.
 *
 * @param {any} value - Giá trị cần debounce
 * @param {number} delay - Thời gian chờ (ms)
 * @returns {any} - Giá trị đã debounce
 */
const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Thiết lập timer để cập nhật giá trị sau khoảng delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Xóa timer nếu value thay đổi hoặc component unmount
    // (trước khi timer kịp chạy)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
