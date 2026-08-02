import { useMemo } from "react";
import { normalizeString } from "../../utils/formatters/formatUtils";
import { getProductDate } from "../../utils/common/sortingUtils";
import {
  matchesAnySearchTerms,
  parseSearchTerms,
} from "../../utils/common/searchUtils";

// Cache cấp module để tái sử dụng các object wrapper khi sản phẩm (reference) không đổi.
// Giúp giảm thiểu việc tạo object mới (GC pressure) và gọi normalizeString khi danh sách sản phẩm cập nhật (ví dụ: edit 1 item).
// WeakMap tự động dọn dẹp khi object product gốc bị xóa khỏi bộ nhớ.
const searchableProductCache = new WeakMap();

const useProductFilterSort = ({
  products = [],
  filterConfig = {},
  sortConfig = { key: "date", direction: "desc" },
  customFilterFn,
}) => {
  const { searchTerm = "", activeCategory = "Tất cả" } = filterConfig;

  // Tối ưu hóa: Tính toán trước các trường tìm kiếm đã được chuẩn hóa.
  // Sử dụng useMemo kết hợp WeakMap cache để tránh tạo object không cần thiết và tránh side-effect khi render.
  const searchableProducts = useMemo(() => {
    const list = products || [];
    return list.map((product) => {
      if (searchableProductCache.has(product)) {
        return searchableProductCache.get(product);
      }
      const searchable = {
        original: product,
        normalizedName: normalizeString(product?.name || ""),
        searchableProductCode: normalizeString(product?.productCode || ""),
        // Pre-calculate sort values (date is expensive O(N) due to lot traversal)
        sortDate: getProductDate(product),
        sortPrice: Number(product?.price) || 0,
      };

      searchableProductCache.set(product, searchable);
      return searchable;
    });
  }, [products]);

  const searchTerms = useMemo(() => parseSearchTerms(searchTerm), [searchTerm]);

  const filteredProducts = useMemo(() => {
    // 1. Lọc dữ liệu
    // Lọc dựa trên các trường đã tính toán trước
    let result = searchableProducts.filter((item) => {
      // Lọc theo từ khóa tìm kiếm
      if (
        searchTerms.length &&
        !matchesAnySearchTerms(
          [item.normalizedName, item.searchableProductCode],
          searchTerms,
        )
      ) {
          return false;
      }

      const product = item.original;

      // Lọc theo danh mục
      if (activeCategory && activeCategory !== "Tất cả") {
        if (product.category !== activeCategory) {
          return false;
        }
      }

      // Bộ lọc tùy chỉnh (ví dụ: Tồn kho)
      if (customFilterFn && !customFilterFn(product)) {
        return false;
      }

      return true;
    });

    // 2. Sorting (trực tiếp trên wrapper, sử dụng giá trị đã cache)
    if (sortConfig) {
      result.sort((a, b) => {
        const valA =
          sortConfig.key === "date"
            ? a.sortDate
            : sortConfig.key === "price"
              ? a.sortPrice
              : 0;
        const valB =
          sortConfig.key === "date"
            ? b.sortDate
            : sortConfig.key === "price"
              ? b.sortPrice
              : 0;

        // Handle string comparison (for dates)
        if (typeof valA === "string" && typeof valB === "string") {
          if (valA === valB) return 0;
          if (sortConfig.direction === "asc") {
            return valA > valB ? 1 : -1;
          } else {
            return valB > valA ? 1 : -1;
          }
        }

        if (sortConfig.direction === "asc") {
          return valA - valB;
        } else {
          return valB - valA;
        }
      });
    }

    // 3. Map về sản phẩm gốc sau khi đã lọc và sắp xếp
    return result.map((item) => item.original);
  }, [
    searchableProducts,
    searchTerms,
    activeCategory,
    sortConfig,
    customFilterFn,
  ]);

  return filteredProducts;
};

export default useProductFilterSort;
