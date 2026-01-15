import { useMemo } from "react";
import { normalizeWarehouseStock } from "../../utils/warehouseUtils";

// Tách riêng phần lọc + gợi ý để code chính dễ đọc hơn.
const useInventoryFilters = ({
  products,
  searchTerm,
  activeCategories,
  warehouseFilter,
  editingProduct,
  formDataName,
}) => {
  // LỌC SẢN PHẨM: Theo Tìm kiếm + Theo Danh mục
  const filteredProducts = useMemo(
    () =>
      products.filter((p) => {
        const matchSearch =
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.barcode && p.barcode.includes(searchTerm));
        const matchCategory =
          activeCategories.length === 0 ||
          activeCategories.includes(p.category);
        const stockByWarehouse = normalizeWarehouseStock(p);
        const matchWarehouse =
          warehouseFilter === "all" ||
          (warehouseFilter === "daLat" && stockByWarehouse.daLat > 0) ||
          (warehouseFilter === "vinhPhuc" && stockByWarehouse.vinhPhuc > 0);

        return matchSearch && matchCategory && matchWarehouse;
      }),
    [products, searchTerm, activeCategories, warehouseFilter]
  );

  const nameSuggestions = useMemo(() => {
    if (editingProduct) return [];
    const keyword = formDataName.trim().toLowerCase();
    if (!keyword) return [];
    return products
      .filter((product) => product.name.toLowerCase().includes(keyword))
      .slice(0, 5);
  }, [products, formDataName, editingProduct]);

  return { filteredProducts, nameSuggestions };
};

export default useInventoryFilters;
