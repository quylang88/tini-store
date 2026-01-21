import { useMemo, useCallback } from "react";
import { normalizeString } from "../../utils/formatters/formatters";
import { normalizeWarehouseStock } from "../../utils/inventory/warehouseUtils";
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
  // Define custom filter function for Warehouse availability
  const checkWarehouseStock = useCallback(
    (product) => {
      const stockByWarehouse = normalizeWarehouseStock(product);
      return (
        warehouseFilter === "all" ||
        (warehouseFilter === "daLat" && stockByWarehouse.daLat > 0) ||
        (warehouseFilter === "vinhPhuc" && stockByWarehouse.vinhPhuc > 0)
      );
    },
    [warehouseFilter],
  );

  // Use shared hook for logic
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
