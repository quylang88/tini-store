import { useMemo, useCallback } from "react";
import { normalizeString } from "../../utils/formatters/formatUtils";
import {
  getSpecificWarehouseStock,
  resolveWarehouseKey,
} from "../../utils/inventory/warehouseUtils";
import useProductFilterSort from "../core/useProductFilterSort";

const useInventoryFilters = ({
  products,
  searchTerm,
  activeCategory,
  warehouseFilter,
  editingProduct,
  formDataName,
  sortConfig = { key: "date", direction: "desc" },
}) => {
  const resolvedFilterKey = useMemo(
    () => resolveWarehouseKey(warehouseFilter),
    [warehouseFilter],
  );

  // Định nghĩa hàm lọc tùy chỉnh cho tính khả dụng của kho
  const checkWarehouseStock = useCallback(
    (product) => {
      // Tối ưu hóa: Kiểm tra "Tất cả" trước để tránh tính toán không cần thiết
      if (warehouseFilter === "all") return true;
      // Tối ưu hóa: Sử dụng getSpecificWarehouseStock để tránh cấp phát object mới (normalizeWarehouseStock)
      return getSpecificWarehouseStock(product, resolvedFilterKey) > 0;
    },
    [warehouseFilter, resolvedFilterKey],
  );

  // Sử dụng hook chia sẻ cho logic
  const filteredProducts = useProductFilterSort({
    products,
    filterConfig: { searchTerm, activeCategory },
    sortConfig,
    customFilterFn: checkWarehouseStock,
  });

  const nameSuggestions = useMemo(() => {
    if (editingProduct) return [];
    const keyword = normalizeString(formDataName);
    if (!keyword) return [];
    return products
      .filter((product) => normalizeString(product.name).includes(keyword))
      .slice(0, 5);
  }, [products, formDataName, editingProduct]);

  return { filteredProducts, nameSuggestions };
};

export default useInventoryFilters;
