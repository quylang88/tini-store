import { useMemo } from "react";
import { normalizeString } from "../../utils/formatters/formatUtils";
import { getProductDate } from "../../utils/common/sortingUtils";

const useProductFilterSort = ({
  products,
  filterConfig = {},
  sortConfig = { key: "date", direction: "desc" },
  customFilterFn,
}) => {
  const { searchTerm = "", activeCategory = "Tất cả" } = filterConfig;

  const filteredProducts = useMemo(() => {
    // 1. Filtering
    let result = products.filter((product) => {
      // Search Filter
      if (searchTerm) {
        const keyword = normalizeString(searchTerm);
        const name = normalizeString(product.name);
        const barcode = product.barcode ? String(product.barcode) : "";
        if (!name.includes(keyword) && !barcode.includes(keyword)) {
          return false;
        }
      }

      // Category Filter
      if (activeCategory && activeCategory !== "Tất cả") {
        if (product.category !== activeCategory) {
          return false;
        }
      }

      // Custom Filter (e.g. Warehouse Stock)
      if (customFilterFn && !customFilterFn(product)) {
        return false;
      }

      return true;
    });

    // 2. Sorting
    if (sortConfig) {
      // Schwartzian transform optimization
      // Pre-calculate sort keys to avoid expensive recalculations (e.g. getProductDate) during sort.
      // This reduces complexity from O(n * log n * cost_of_get) to O(n * cost_of_get + n * log n).

      const getSortValue = (product) => {
        if (sortConfig.key === "date") {
          return getProductDate(product);
        }
        if (sortConfig.key === "price") {
          return Number(product.price) || 0;
        }
        return 0;
      };

      const withValues = result.map((product) => ({
        product,
        value: getSortValue(product),
      }));

      withValues.sort((a, b) => {
        if (sortConfig.direction === "asc") {
          return a.value - b.value;
        } else {
          return b.value - a.value;
        }
      });

      // Unwrap
      result = withValues.map((item) => item.product);
    }

    return result;
  }, [products, searchTerm, activeCategory, sortConfig, customFilterFn]);

  return filteredProducts;
};

export default useProductFilterSort;
