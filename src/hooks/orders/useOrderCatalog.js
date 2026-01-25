import { useCallback, useMemo } from "react";
import {
  normalizeWarehouseStock,
  getDefaultWarehouse,
  getTotalStock,
  resolveWarehouseKey,
} from "../../utils/inventory/warehouseUtils";
import { getLatestUnitCost } from "../../utils/inventory/purchaseUtils";
import useProductFilterSort from "../core/useProductFilterSort";

const DEFAULT_WAREHOUSE = "all";

// Gom xử lý lọc sản phẩm + tổng hợp đơn vào 1 hook phụ để file chính ngắn hơn.
const useOrderCatalog = ({
  products,
  cart,
  searchTerm,
  activeCategory,
  selectedWarehouse,
  orderBeingEdited,
  sortConfig = { key: "date", direction: "desc" },
}) => {
  const productMap = useMemo(() => {
    // Tối ưu hóa: Sử dụng vòng lặp for...of để tránh tạo mảng trung gian từ map()
    const map = new Map();
    for (const product of products) {
      map.set(product.id, product);
    }
    return map;
  }, [products]);

  const orderItemsQuantityMap = useMemo(() => {
    // Tối ưu hóa: Sử dụng vòng lặp for...of để tránh tạo mảng trung gian từ map()
    const map = new Map();
    if (orderBeingEdited?.items) {
      for (const item of orderBeingEdited.items) {
        map.set(item.productId, item.quantity);
      }
    }
    return map;
  }, [orderBeingEdited]);

  const getAvailableStock = useCallback(
    (product, warehouseKey) => {
      let baseStock = 0;
      // Resolve warehouse key
      const resolvedKey = resolveWarehouseKey(warehouseKey);

      if (warehouseKey === "all") {
        baseStock = getTotalStock(product);
      } else {
        const warehouseStock = normalizeWarehouseStock(product);
        baseStock = warehouseStock[resolvedKey] || 0;
      }

      if (!orderBeingEdited) return baseStock;
      const orderWarehouse =
        resolveWarehouseKey(orderBeingEdited.warehouse) ||
        getDefaultWarehouse().key;
      // Nếu đang sửa đơn, và kho hiện tại trùng với kho của đơn cũ, thì cộng lại số lượng cũ để tính số lượng khả dụng
      // Nếu warehouseKey là "all", ta hiển thị tổng tồn kho, không cần cộng previousQty (hoặc có thể cộng nếu muốn hiển thị chính xác những gì khả dụng nếu sửa?)
      // Tuy nhiên logic sửa thường gắn với 1 kho cụ thể.
      if (orderWarehouse !== resolvedKey) return baseStock;
      const previousQty = orderItemsQuantityMap.get(product.id) || 0;
      return baseStock + previousQty;
    },
    [orderBeingEdited, orderItemsQuantityMap],
  );

  // Định nghĩa bộ lọc tùy chỉnh cho tính khả dụng
  const checkAvailability = useCallback(
    (product) => {
      const availableStock = getAvailableStock(product, selectedWarehouse);
      return availableStock > 0;
    },
    [getAvailableStock, selectedWarehouse],
  );

  // Sử dụng hook chia sẻ cho logic
  const filteredProducts = useProductFilterSort({
    products,
    filterConfig: { searchTerm, activeCategory },
    sortConfig,
    customFilterFn: checkAvailability,
  });

  const reviewItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([productId, quantity]) => {
          const product = productMap.get(productId);
          if (!product) return null;

          return {
            id: product.id,
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity,
            // Giá vốn dùng cho đơn hàng cần gồm cả phí gửi/đơn vị.
            cost: getLatestUnitCost(product),
          };
        })
        .filter((item) => item && item.quantity > 0), // Lọc bỏ item null hoặc số lượng <= 0 (bao gồm cả chuỗi rỗng)
    [cart, productMap],
  );

  const totalAmount = useMemo(
    () =>
      reviewItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [reviewItems],
  );

  return {
    productMap,
    getAvailableStock,
    filteredProducts,
    reviewItems,
    totalAmount,
  };
};

export default useOrderCatalog;
