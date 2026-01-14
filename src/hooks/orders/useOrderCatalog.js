import { useCallback, useMemo } from 'react';
import { normalizeWarehouseStock } from '../../utils/warehouseUtils';
import { getLatestUnitCost } from '../../utils/purchaseUtils';

const DEFAULT_WAREHOUSE = 'daLat';

// Gom xử lý lọc sản phẩm + tổng hợp đơn vào 1 hook phụ để file chính ngắn hơn.
const useOrderCatalog = ({
  products,
  cart,
  searchTerm,
  activeCategory,
  selectedWarehouse,
  orderBeingEdited,
}) => {
  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const orderItemsQuantityMap = useMemo(() => {
    if (!orderBeingEdited?.items) return new Map();
    return new Map(orderBeingEdited.items.map(item => [item.productId, item.quantity]));
  }, [orderBeingEdited]);

  const getAvailableStock = useCallback((product, warehouseKey) => {
    const warehouseStock = normalizeWarehouseStock(product);
    const baseStock = warehouseKey === 'vinhPhuc' ? warehouseStock.vinhPhuc : warehouseStock.daLat;
    if (!orderBeingEdited) return baseStock;
    const orderWarehouse = orderBeingEdited.warehouse || DEFAULT_WAREHOUSE;
    if (orderWarehouse !== warehouseKey) return baseStock;
    const previousQty = orderItemsQuantityMap.get(product.id) || 0;
    return baseStock + previousQty;
  }, [orderBeingEdited, orderItemsQuantityMap]);

  const filteredProducts = useMemo(
    () => products.filter((product) => {
      const matchSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.barcode && product.barcode.includes(searchTerm));
      const matchCategory = activeCategory === 'Tất cả' || product.category === activeCategory;
      const availableStock = getAvailableStock(product, selectedWarehouse);
      return matchSearch && matchCategory && availableStock > 0;
    }),
    [products, searchTerm, activeCategory, selectedWarehouse, getAvailableStock],
  );

  const reviewItems = useMemo(() => Object.entries(cart)
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
    .filter(Boolean), [cart, productMap]);

  const totalAmount = useMemo(
    () => reviewItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
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
