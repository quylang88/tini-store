import { useRef, useEffect } from "react";

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

  useEffect(() => {
    if (open) {
      cacheRef.current = data;
    }
  }, [data, open]);

  return open ? data : cacheRef.current;
};

export default useModalCache;
