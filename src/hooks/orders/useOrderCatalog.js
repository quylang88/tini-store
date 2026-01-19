import { useCallback, useMemo } from "react";
import { normalizeWarehouseStock } from "../../utils/warehouseUtils";
import { getLatestUnitCost } from "../../utils/purchaseUtils";
import useProductFilterSort from "../useProductFilterSort";

const DEFAULT_WAREHOUSE = "all";

// Gom xử lý lọc sản phẩm + tổng hợp đơn vào 1 hook phụ để file chính ngắn hơn.
const useOrderCatalog = ({
  products,
  cart,
  searchTerm,
  activeCategory,
  selectedWarehouse,
  orderBeingEdited,
  priceOverrides = {},
  sortConfig = { key: "date", direction: "desc" },
}) => {
  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const orderItemsQuantityMap = useMemo(() => {
    if (!orderBeingEdited?.items) return new Map();
    return new Map(
      orderBeingEdited.items.map((item) => [item.productId, item.quantity]),
    );
  }, [orderBeingEdited]);

  const getAvailableStock = useCallback(
    (product, warehouseKey) => {
      const warehouseStock = normalizeWarehouseStock(product);
      let baseStock = 0;
      if (warehouseKey === "all") {
        baseStock = warehouseStock.vinhPhuc + warehouseStock.daLat;
      } else if (warehouseKey === "vinhPhuc") {
        baseStock = warehouseStock.vinhPhuc;
      } else {
        baseStock = warehouseStock.daLat;
      }

      if (!orderBeingEdited) return baseStock;
      const orderWarehouse = orderBeingEdited.warehouse || DEFAULT_WAREHOUSE;
      // Nếu đang sửa đơn, và kho hiện tại trùng với kho của đơn cũ, thì cộng lại số lượng cũ để tính available
      // Nếu warehouseKey là "all", ta hiển thị tổng stock, không cần cộng previousQty (hoặc có thể cộng nếu muốn hiển thị chính xác những gì available nếu edit?)
      // Tuy nhiên logic edit thường gắn với 1 kho cụ thể.
      if (orderWarehouse !== warehouseKey) return baseStock;
      const previousQty = orderItemsQuantityMap.get(product.id) || 0;
      return baseStock + previousQty;
    },
    [orderBeingEdited, orderItemsQuantityMap],
  );

  // Define custom filter for availability
  const checkAvailability = useCallback((product) => {
      const availableStock = getAvailableStock(product, selectedWarehouse);
      return availableStock > 0;
  }, [getAvailableStock, selectedWarehouse]);

  // Use shared hook for logic
  const filteredProducts = useProductFilterSort({
    products,
    filterConfig: { searchTerm, activeCategory },
    sortConfig,
    customFilterFn: checkAvailability
  });

  const reviewItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([productId, quantity]) => {
          const product = productMap.get(productId);
          if (!product) return null;
          // Ưu tiên giá override nếu user đã chỉnh sửa, nếu không thì dùng giá gốc.
          const overridePrice = priceOverrides[product.id];
          const effectivePrice =
            overridePrice !== undefined && overridePrice !== ""
              ? Number(overridePrice)
              : product.price;

          return {
            id: product.id,
            productId: product.id,
            name: product.name,
            price: effectivePrice,
            quantity,
            // Giá vốn dùng cho đơn hàng cần gồm cả phí gửi/đơn vị.
            cost: getLatestUnitCost(product),
          };
        })
        .filter((item) => item && item.quantity > 0), // Lọc bỏ item null hoặc số lượng <= 0 (bao gồm cả chuỗi rỗng)
    [cart, productMap, priceOverrides],
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
