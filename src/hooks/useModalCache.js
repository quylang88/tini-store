import { useState, useEffect } from "react";

/**
 * Hook để cache dữ liệu cho modal, giúp giữ lại nội dung hiển thị
 * khi modal đang đóng (animation exit) mặc dù dữ liệu gốc đã bị null/undefined.
 *
 * @param {any} data - Dữ liệu cần cache (object, string, etc.). Nếu là object được tạo mới mỗi render, hãy dùng useMemo ở component cha.
 * @param {boolean} open - Trạng thái mở của modal.
 * @returns {any} Dữ liệu được cache.
 */
const useModalCache = (data, open) => {
  const [cachedData, setCachedData] = useState(data);

  useEffect(() => {
    if (open) {
      setCachedData(data);
    }
  }, [data, open]);

  return cachedData;
};

export default useModalCache;
