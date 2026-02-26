import { useMemo, useState } from "react";
import { normalizeString } from "../../utils/formatters/formatUtils";
import { getProductDate } from "../../utils/common/sortingUtils";

// Cache cấp module để tái sử dụng các object wrapper khi sản phẩm (reference) không đổi.
// Giúp giảm thiểu việc tạo object mới (GC pressure) và gọi normalizeString khi danh sách sản phẩm cập nhật (ví dụ: edit 1 item).
// WeakMap tự động dọn dẹp khi object product gốc bị xóa khỏi bộ nhớ.
const searchableProductCache = new WeakMap();

const useProductFilterSort = ({
  products,
  filterConfig = {},
  sortConfig = { key: "date", direction: "desc" },
  customFilterFn,
}) => {
  const { searchTerm = "", activeCategory = "Tất cả" } = filterConfig;

  const [cache, setCache] = useState({
    products: [],
    searchableProducts: [],
  });

  // Tối ưu hóa: Tính toán trước các trường tìm kiếm đã được chuẩn hóa.
  // Sử dụng state để lưu trữ cache và cập nhật ngay trong render (Derived State pattern).
  // Pattern này tránh lỗi "access refs during render" và vẫn đảm bảo hiệu năng cao nhờ O(N) diffing.
  if (products !== cache.products) {
    const prevProducts = cache.products;
    const prevSearchable = cache.searchableProducts;
    const prevLength = prevProducts.length;

    const newSearchable = new Array(products.length);

    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      // Optimization: Kiểm tra nếu sản phẩm tại index này giống hệt phiên bản trước (reference equality)
      // thì tái sử dụng wrapper cũ luôn, tránh cả việc lookup WeakMap.
      if (i < prevLength && product === prevProducts[i]) {
        newSearchable[i] = prevSearchable[i];
        continue;
      }

      // Fallback: Kiểm tra WeakMap cache (trường hợp reorder hoặc insert/delete làm lệch index)
      if (searchableProductCache.has(product)) {
        newSearchable[i] = searchableProductCache.get(product);
      } else {
        const searchable = {
          original: product,
          normalizedName: normalizeString(product.name),
          searchableProductCode: product.productCode
            ? String(product.productCode)
            : "",
          // Pre-calculate sort values (date is expensive O(N) due to lot traversal)
          sortDate: getProductDate(product),
          sortPrice: Number(product.price) || 0,
        };

        searchableProductCache.set(product, searchable);
        newSearchable[i] = searchable;
      }
    }

    setCache({
      products: products,
      searchableProducts: newSearchable,
    });
  }

  const searchableProducts = cache.searchableProducts;

  const filteredProducts = useMemo(() => {
    // 1. Lọc dữ liệu
    const keyword = normalizeString(searchTerm);

    // Lọc dựa trên các trường đã tính toán trước
    let result = searchableProducts.filter((item) => {
      // Lọc theo từ khóa tìm kiếm
      if (keyword) {
        if (
          !item.normalizedName.includes(keyword) &&
          !item.searchableProductCode.includes(keyword)
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
    searchTerm,
    activeCategory,
    sortConfig,
    customFilterFn,
  ]);

  return filteredProducts;
};

export default useProductFilterSort;
