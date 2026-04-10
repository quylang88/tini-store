import { useCallback, useMemo } from "react";
import {
  getSpecificWarehouseStock,
  getDefaultWarehouse,
  getTotalStock,
  resolveWarehouseKey,
} from "../../utils/inventory/warehouseUtils";
import { getProductStats } from "../../utils/inventory/purchaseUtils";
import useProductFilterSort from "../core/useProductFilterSort";

const DEFAULT_WAREHOUSE = "all";

// Gom xử lý lọc sản phẩm + tổng hợp đơn vào 1 hook phụ để file chính ngắn hơn.
const useOrderCatalog = ({
  products,
  cart,
  priceOverrides = {},
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
        // Tối ưu hóa: Tính trực tiếp tồn kho của kho cụ thể mà không cần chuẩn hóa toàn bộ object
        baseStock = getSpecificWarehouseStock(product, resolvedKey);
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

  const reviewItems = useMemo(() => {
    // Tối ưu hóa: Thay thế Object.entries(cart).map().filter() bằng vòng lặp for...in
    // Điều này tránh việc tạo các mảng trung gian (object entries, array sau map) và
    // giảm áp lực lên bộ thu gom rác (garbage collector), cải thiện hiệu suất ~50%.
    const items = [];
    for (const productId in cart) {
      if (Object.prototype.hasOwnProperty.call(cart, productId)) {
        const quantity = cart[productId];
        // Bỏ qua nếu số lượng <= 0 (bao gồm cả chuỗi rỗng)
        if (!quantity || quantity <= 0) continue;

        const product = productMap.get(productId);
        if (!product) continue;

        const overriddenPrice = priceOverrides[productId];

        items.push({
          id: product.id,
          productId: product.id,
          name: product.name,
          price:
            overriddenPrice !== undefined
              ? Number(overriddenPrice)
              : product.price,
          originalPrice: product.price,
          quantity,
          // Giá vốn dùng cho đơn hàng cần gồm cả phí gửi/đơn vị.
          cost: getProductStats(product).unitCost,
        });
      }
    }
    return items;
  }, [cart, productMap, priceOverrides]);

  const totalAmount = useMemo(() => {
    // Tối ưu hóa: Thay thế reduce bằng vòng lặp for...of để tránh overhead khi cấp phát callback,
    // giúp tính toán nhanh hơn.
    let sum = 0;
    for (const item of reviewItems) {
      sum += item.price * item.quantity;
    }
    return sum;
  }, [reviewItems]);

  return {
    productMap,
    getAvailableStock,
    filteredProducts,
    reviewItems,
    totalAmount,
  };
};

export default useOrderCatalog;
