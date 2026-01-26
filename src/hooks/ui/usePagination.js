import { useState, useEffect, useMemo } from "react";

/**
 * Hook to handle pagination (infinite scroll style).
 *
 * @param {Array} data - The full dataset.
 * @param {Object} config - Configuration object.
 * @param {number} config.pageSize - Number of items to load per page.
 * @param {Array} config.resetDeps - Dependencies that should trigger a reset to the first page (e.g., search term, filters).
 * @returns {Object} { visibleData, loadMore, hasMore }
 */
const usePagination = (data, { pageSize = 20, resetDeps = [] } = {}) => {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  // Reset pagination when dependencies change (e.g. search, filter)
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
