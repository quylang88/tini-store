import { normalizeWarehouseStock } from "../inventory/warehouseUtils";
import {
  consumePurchaseLots,
  normalizePurchaseLots,
  restockPurchaseLots,
} from "../inventory/purchaseUtils";

const updateWarehouseStock = (product, warehouseKey, delta, restockCost) => {
  const current = normalizeWarehouseStock(product);
  const nextStock = { ...current };
  if (warehouseKey === "vinhPhuc") {
    nextStock.vinhPhuc = Math.max(0, current.vinhPhuc + delta);
  } else {
    nextStock.daLat = Math.max(0, current.daLat + delta);
  }
  const nextProduct = {
    ...product,
    stockByWarehouse: nextStock,
    stock: nextStock.daLat + nextStock.vinhPhuc,
  };

  if (delta < 0) {
    return consumePurchaseLots(
      normalizePurchaseLots(nextProduct),
      warehouseKey,
      Math.abs(delta),
    );
  }
  if (delta > 0) {
    return restockPurchaseLots(
      normalizePurchaseLots(nextProduct),
      warehouseKey,
      delta,
      restockCost,
    );
  }
  return nextProduct;
};

export const syncProductsStock = (
  products,
  orderItems,
  previousItems = [],
  nextWarehouseKey,
  previousWarehouseKey = nextWarehouseKey,
) => {
  const nextMap = new Map(
    orderItems.map((item) => [item.productId, item.quantity]),
  );
  const previousItemMap = new Map(
    previousItems.map((item) => [item.productId, item]),
  );

  return products.map((product) => {
    const previousItem = previousItemMap.get(product.id);
    const previousQty = previousItem?.quantity || 0;
    const nextQty = nextMap.get(product.id) || 0;
    if (!previousQty && !nextQty) return product;

    if (previousWarehouseKey === nextWarehouseKey) {
      const delta = previousQty - nextQty;
      if (!delta) return product;
      const previousCost = previousItem?.cost;
      return updateWarehouseStock(
        product,
        nextWarehouseKey,
        delta,
        previousCost,
      );
    }

    let nextProduct = product;
    if (previousQty) {
      const previousCost = previousItem?.cost;
      nextProduct = updateWarehouseStock(
        nextProduct,
        previousWarehouseKey,
        previousQty,
        previousCost,
      );
    }
    if (nextQty) {
      nextProduct = updateWarehouseStock(
        nextProduct,
        nextWarehouseKey,
        -nextQty,
      );
    }
    return nextProduct;
  });
};
