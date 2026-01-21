import { useState, useRef, useLayoutEffect } from "react";

/**
 * Hook để cache dữ liệu cho modal, giúp giữ lại nội dung hiển thị
 * khi modal đang đóng (animation exit) mặc dù dữ liệu gốc đã bị null/undefined.
 *
 * @param {any} data - Dữ liệu cần cache (object, string, etc.).
 * @param {boolean} open - Trạng thái mở của modal.
 * @returns {any} Dữ liệu được cache.
 */
const useModalCache = (data, open) => {
  const cacheRef = useRef(data);
  const [cachedData, setCachedData] = useState(data);

  // Cập nhật ref khi modal mở để luôn có dữ liệu mới nhất (không gây re-render)
  useLayoutEffect(() => {
    if (open) {
      cacheRef.current = data;
    }
  }, [data, open]);

  // Khi modal đóng, cập nhật state từ ref để giữ lại nội dung cũ
  // Sử dụng useLayoutEffect để tránh flash nội dung (update state trước paint)
  useLayoutEffect(() => {
    if (!open) {
      setCachedData(cacheRef.current);
    }
  }, [open]);

  return open ? data : cachedData;
};

export default useModalCache;
