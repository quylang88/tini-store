import { normalizeWarehouseStock } from "../inventory/warehouseUtils";
import {
  consumePurchaseLots,
  normalizePurchaseLots,
  restockPurchaseLots,
  restorePurchaseLots,
} from "../inventory/purchaseUtils";

// Helper to calculate which lots to restore when quantity decreases
const getRestorationAllocations = (originalAllocations, amountToRestore) => {
  if (!originalAllocations || originalAllocations.length === 0) return [];

  let remaining = amountToRestore;
  const toRestore = [];

  // Clone to avoid mutating original order data during calculation
  // We process in reverse order (LIFO) or just linear?
  // User Requirement: "trả lại sản phẩm về kho để tăng lại tồn theo giá trị user trả đơn"
  // If we assume we want to fill up the lots we took from.
  // We can just iterate.
  for (const alloc of originalAllocations) {
    if (remaining <= 0) break;
    // We can restore up to alloc.quantity
    // But wait, originalAllocations tells us what we TOOK.
    // If we return, we put it back.
    // We should treat originalAllocations as the "source of truth" for what this item holds.
    // Logic: We took 5 from Lot A. Now we return 3. We put 3 back to Lot A.
    // If we took 2 from Lot A, 3 from Lot B. Return 4.
    // Put 3 back to Lot B, 1 back to Lot A. (Reverse order of consumption is usually best).

    // Let's assume originalAllocations is ordered by consumption.
    // We reverse it to restore.
  }

  // Work on a reversed copy
  const reversed = [...originalAllocations].reverse();

  for (const alloc of reversed) {
    if (remaining <= 0) break;
    const canRestore = Number(alloc.quantity) || 0;
    const amount = Math.min(remaining, canRestore);

    toRestore.push({
      lotId: alloc.lotId,
      quantity: amount
    });
    remaining -= amount;
  }

  return toRestore;
};

// Helper to remove restored quantities from the Order's allocation list
// (Because the Order now holds LESS items, so it should hold LESS allocations)
const reduceOrderAllocations = (originalAllocations, restoredList) => {
  if (!originalAllocations) return [];

  // Clone original
  let currentAllocations = originalAllocations.map(a => ({...a}));

  for (const restored of restoredList) {
    const target = currentAllocations.find(a => a.lotId === restored.lotId);
    if (target) {
      target.quantity -= restored.quantity;
    }
  }

  // Filter out zero quantity allocations
  return currentAllocations.filter(a => a.quantity > 0);
};


const updateWarehouseStock = (product, warehouseKey, delta, restockCost, allocationsToRestore = []) => {
  const current = normalizeWarehouseStock(product);
  const nextStock = { ...current };

  // Fix key if legacy
  const safeWarehouseKey = warehouseKey === "daLat" ? "lamDong" : warehouseKey;

  if (safeWarehouseKey === "vinhPhuc") {
    nextStock.vinhPhuc = Math.max(0, current.vinhPhuc + delta);
  } else {
    nextStock.lamDong = Math.max(0, current.lamDong + delta);
  }

  let resultProduct = {
    ...product,
    stockByWarehouse: nextStock,
    stock: nextStock.lamDong + nextStock.vinhPhuc,
  };

  let newAllocations = [];
  let historyEvent = null; // { mode, allocations }

  if (delta < 0) {
    // Consume
    const res = consumePurchaseLots(
      normalizePurchaseLots(resultProduct),
      safeWarehouseKey,
      Math.abs(delta),
    );
    resultProduct = res.nextProduct;
    newAllocations = res.allocations;
    historyEvent = { mode: 'consume', allocations: newAllocations };
  } else if (delta > 0) {
    // Restore
    if (allocationsToRestore.length > 0) {
       resultProduct = restorePurchaseLots(
         normalizePurchaseLots(resultProduct),
         allocationsToRestore
       );
       historyEvent = { mode: 'restore', allocations: allocationsToRestore };
    } else {
      // Legacy/Generic Restock (Not tracked in History as "Restore" because no lot ID?)
      // Or maybe we treat it as a new import?
      // User says: "hiểu là user trả lại sản phẩm về kho để tăng lại tồn theo giá trị user trả đơn chứ không được hiểu là thêm lần nhập mới"
      // If we lack lot info (legacy), we can't update history record.
      // So we do nothing for history in this legacy branch.
      resultProduct = restockPurchaseLots(
        normalizePurchaseLots(resultProduct),
        safeWarehouseKey,
        delta,
        restockCost,
      );
    }
  }

  // Recalculate totals from lots to be safe
  const finalLots = resultProduct.purchaseLots || [];
  const finalStock = finalLots.reduce((acc, lot) => {
      const w = lot.warehouse === "daLat" ? "lamDong" : lot.warehouse;
      acc[w] = (acc[w] || 0) + (Number(lot.quantity) || 0);
      return acc;
  }, { lamDong: 0, vinhPhuc: 0 });

  resultProduct = {
      ...resultProduct,
      stockByWarehouse: finalStock,
      stock: finalStock.lamDong + finalStock.vinhPhuc
  };

  return { nextProduct: resultProduct, newAllocations, historyEvent };
};

export const syncProductsStock = (
  products,
  orderItems,
  previousItems = [],
  nextWarehouseKey,
  previousWarehouseKey = nextWarehouseKey,
) => {
  const nextMap = new Map();
  for (const item of orderItems) {
    nextMap.set(item.productId, item.quantity);
  }

  const previousItemMap = new Map();
  for (const item of previousItems) {
    previousItemMap.set(item.productId, item);
  }

  const orderAllocationsMap = new Map(); // productId -> allocations Array
  const historyEvents = []; // Array of { productId, mode, allocations }

  const nextProducts = products.map((product) => {
    const previousItem = previousItemMap.get(product.id);
    const previousQty = previousItem?.quantity || 0;
    const nextQty = nextMap.get(product.id) || 0;

    // If product not involved, return as is
    if (!previousQty && !nextQty) return product;

    let currentProduct = product;
    let currentItemAllocations = previousItem?.lotAllocations || [];

    // CASE 1: Same Warehouse (Simple Edit)
    if (previousWarehouseKey === nextWarehouseKey) {
      const delta = previousQty - nextQty; // + means Restore, - means Consume
      if (delta === 0) {
          orderAllocationsMap.set(product.id, currentItemAllocations);
          return product;
      }

      let allocationsToRestore = [];
      if (delta > 0) {
          allocationsToRestore = getRestorationAllocations(currentItemAllocations, delta);
          currentItemAllocations = reduceOrderAllocations(currentItemAllocations, allocationsToRestore);
      }

      const previousCost = previousItem?.cost;
      const { nextProduct, newAllocations, historyEvent } = updateWarehouseStock(
        currentProduct,
        nextWarehouseKey,
        delta,
        previousCost,
        allocationsToRestore
      );

      if (historyEvent) {
          historyEvents.push({ ...historyEvent, productId: product.id });
      }

      if (delta < 0) {
          currentItemAllocations = [...currentItemAllocations, ...newAllocations];
      }

      orderAllocationsMap.set(product.id, currentItemAllocations);
      return nextProduct;
    }

    // CASE 2: Switch Warehouse (Full Restore + Full Consume)
    if (previousQty > 0) {
      const allocationsToRestore = getRestorationAllocations(currentItemAllocations, previousQty);
      const previousCost = previousItem?.cost;
      const res = updateWarehouseStock(
        currentProduct,
        previousWarehouseKey,
        previousQty, // delta > 0
        previousCost,
        allocationsToRestore
      );
      currentProduct = res.nextProduct;
      if (res.historyEvent) {
          historyEvents.push({ ...res.historyEvent, productId: product.id });
      }
      currentItemAllocations = [];
    }

    if (nextQty > 0) {
      const res = updateWarehouseStock(
        currentProduct,
        nextWarehouseKey,
        -nextQty, // delta < 0
      );
      currentProduct = res.nextProduct;
      currentItemAllocations = res.newAllocations;
      if (res.historyEvent) {
          historyEvents.push({ ...res.historyEvent, productId: product.id });
      }
    }

    orderAllocationsMap.set(product.id, currentItemAllocations);
    return currentProduct;
  });

  return { nextProducts, orderAllocationsMap, historyEvents };
};
