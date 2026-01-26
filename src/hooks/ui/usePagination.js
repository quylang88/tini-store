import { useState, useEffect, useMemo } from "react";

/**
 * Hook xử lý phân trang (kiểu cuộn vô tận - infinite scroll).
 *
 * @param {Array} data - Tập dữ liệu đầy đủ.
 * @param {Object} config - Cấu hình.
 * @param {number} config.pageSize - Số lượng phần tử tải mỗi lần (mặc định 20).
 * @param {Array} config.resetDeps - Các dependency kích hoạt reset về trang đầu (ví dụ: từ khoá tìm kiếm, bộ lọc).
 * @returns {Object} { visibleData, loadMore, hasMore }
 */
const usePagination = (data, { pageSize = 20, resetDeps = [] } = {}) => {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  // Reset phân trang khi các phụ thuộc thay đổi (ví dụ: tìm kiếm, lọc)
  useEffect(() => {
    setVisibleCount(pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps);

  const visibleData = useMemo(() => {
    if (!data) return [];
    return data.slice(0, visibleCount);
  }, [data, visibleCount]);

  const loadMore = () => {
    if (data && visibleCount < data.length) {
      setVisibleCount((prev) => prev + pageSize);
    }
  };

  const hasMore = data ? visibleCount < data.length : false;

  return { visibleData, loadMore, hasMore };
};

export default usePagination;
