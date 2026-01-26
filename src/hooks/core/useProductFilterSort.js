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

  // Tối ưu hóa: Tính toán trước các trường tìm kiếm đã được chuẩn hóa.
  // Việc này giúp tránh gọi hàm normalizeString (sử dụng regex tốn kém) trong vòng lặp lọc.
  // Thay vì độ phức tạp O(N * M) với M là số ký tự gõ, ta chỉ tốn O(N) một lần khi danh sách sản phẩm thay đổi.
  const searchableProducts = useMemo(() => {
    return products.map((product) => ({
      original: product,
      normalizedName: normalizeString(product.name),
      searchableBarcode: product.barcode ? String(product.barcode) : "",
    }));
  }, [products]);

  const filteredProducts = useMemo(() => {
    // 1. Lọc dữ liệu
    const keyword = normalizeString(searchTerm);

    // Lọc dựa trên các trường đã tính toán trước
    let result = searchableProducts.filter((item) => {
      // Lọc theo từ khóa tìm kiếm
      if (keyword) {
        if (
          !item.normalizedName.includes(keyword) &&
          !item.searchableBarcode.includes(keyword)
        ) {
          return false;
        }
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

    // Trả về danh sách sản phẩm gốc để sắp xếp và hiển thị
    let resultProducts = result.map((item) => item.original);

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

      const withValues = resultProducts.map((product) => ({
        product,
        value: getSortValue(product),
      }));

      withValues.sort((a, b) => {
        const valA = a.value;
        const valB = b.value;

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

      // Unwrap
      resultProducts = withValues.map((item) => item.product);
    }

    return resultProducts;
  }, [
    searchableProducts,
    searchTerm,
    activeCategory,
    sortConfig,
    customFilterFn,
  ]);

  return filteredProducts;
};

export default useProductFilterSort;
