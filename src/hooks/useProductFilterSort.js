import { useMemo } from "react";
import { normalizeString } from "../utils/helpers";
import { getProductDate } from "../utils/sortingUtils";

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
      result.sort((a, b) => {
        if (sortConfig.key === "date") {
          const dateA = getProductDate(a);
          const dateB = getProductDate(b);
          if (sortConfig.direction === "desc") {
            return dateB - dateA;
          } else {
            return dateA - dateB;
          }
        }
        if (sortConfig.key === "price") {
          const priceA = Number(a.price) || 0;
          const priceB = Number(b.price) || 0;
          if (sortConfig.direction === "asc") {
            return priceA - priceB;
          } else {
            return priceB - priceA;
          }
        }
        return 0;
      });
    }

    return result;
  }, [products, searchTerm, activeCategory, sortConfig, customFilterFn]);

  return filteredProducts;
};

export default useProductFilterSort;
