import { normalizeWarehouseStock } from "../inventory/warehouseUtils";
import {
  consumePurchaseLots,
  normalizePurchaseLots,
  restockPurchaseLots,
  restorePurchaseLots,
} from "../inventory/purchaseUtils";

const updateWarehouseStock = (
  product,
  warehouseKey,
  delta,
  restockCost,
  allocationsToRestore = [],
) => {
  const current = normalizeWarehouseStock(product);
  const nextStock = { ...current };
  if (warehouseKey === "vinhPhuc") {
    nextStock.vinhPhuc = Math.max(0, current.vinhPhuc + delta);
  } else {
    nextStock.lamDong = Math.max(0, current.lamDong + delta);
  }
  const nextProduct = {
    ...product,
    stockByWarehouse: nextStock,
    stock: nextStock.lamDong + nextStock.vinhPhuc,
  };

  if (delta < 0) {
    // consumePurchaseLots now returns { product, allocations }
    return consumePurchaseLots(
      normalizePurchaseLots(nextProduct),
      warehouseKey,
      Math.abs(delta),
    );
  }
  if (delta > 0) {
    // Nếu có allocations để restore (Trả hàng từ đơn)
    if (allocationsToRestore.length > 0) {
      const p = restorePurchaseLots(
        normalizePurchaseLots(nextProduct),
        allocationsToRestore,
      );
      return { product: p, allocations: [] };
    }

    // Fallback: Nếu không có allocations (Nhập mới / Restock thường)
    const p = restockPurchaseLots(
      normalizePurchaseLots(nextProduct),
      warehouseKey,
      delta,
      restockCost,
    );
    return { product: p, allocations: [] };
  }
  return { product: nextProduct, allocations: [] };
};

const splitAllocations = (sourceAllocations, amountToRemove) => {
  const kept = (sourceAllocations || []).map((a) => ({ ...a }));
  const returned = [];
  let remaining = amountToRemove;

  // Iterate from end (LIFO return)
  for (let i = kept.length - 1; i >= 0; i--) {
    if (remaining <= 0) break;
    const alloc = kept[i];
    const available = alloc.quantity;

    if (available <= remaining) {
      // Remove entire allocation
      returned.push({ lotId: alloc.lotId, quantity: available });
      remaining -= available;
      kept.splice(i, 1);
    } else {
      // Partial remove
      alloc.quantity -= remaining;
      returned.push({ lotId: alloc.lotId, quantity: remaining });
      remaining = 0;
    }
  }
  return { kept, returned };
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
    // Store the item object to mutate it with allocations
    nextMap.set(item.productId, { qty: item.quantity, itemRef: item });
  }

  const previousItemMap = new Map();
  for (const item of previousItems) {
    previousItemMap.set(item.productId, item);
  }

  return products.map((product) => {
    const previousItem = previousItemMap.get(product.id);
    const previousQty = previousItem?.quantity || 0;
    const nextEntry = nextMap.get(product.id);
    const nextQty = nextEntry?.qty || 0;
    const nextItemRef = nextEntry?.itemRef;

    if (!previousQty && !nextQty) return product;

    let resultProduct = product;

    if (previousWarehouseKey === nextWarehouseKey) {
      const delta = previousQty - nextQty;
      if (delta !== 0) {
        const previousCost = previousItem?.cost;
        let allocationsToRestore = [];

        // If returning stock (delta > 0), calculate what to restore
        if (delta > 0) {
          const { kept, returned } = splitAllocations(
            previousItem?.lotAllocations,
            delta,
          );
          allocationsToRestore = returned;
          // Update the next item (which is staying) with the kept allocations
          if (nextItemRef) {
            nextItemRef.lotAllocations = kept;
          }
        }

        const { product: p, allocations } = updateWarehouseStock(
          product,
          nextWarehouseKey,
          delta,
          previousCost,
          allocationsToRestore,
        );
        resultProduct = p;

        // If we consumed stock (delta < 0), add allocations to the new item
        // We need to merge with existing allocations of previous item (which became the base for next item)
        // Actually, logic: nextItem starts fresh?
        // No, nextItem IS previousItem modified.
        // If delta < 0: we kept ALL previous allocations, and ADDED new ones.
        if (delta < 0 && nextItemRef) {
          const baseAllocations = previousItem?.lotAllocations || [];
          nextItemRef.lotAllocations = [...baseAllocations, ...allocations];
        }
      } else {
        // Delta = 0, no stock change, but preserve allocations
        if (nextItemRef) {
          nextItemRef.lotAllocations = previousItem?.lotAllocations || [];
        }
      }
    } else {
      // Different warehouses: Restock old (delta > 0), Consume new (delta < 0 implied by logic)
      if (previousQty) {
        // Returning ALL previousQty
        const previousCost = previousItem?.cost;
        const { kept, returned } = splitAllocations(
          previousItem?.lotAllocations,
          previousQty,
        );
        // kept should be empty ideally, returned = all
        const { product: p } = updateWarehouseStock(
          resultProduct,
          previousWarehouseKey,
          previousQty,
          previousCost,
          returned,
        );
        resultProduct = p;
      }
      if (nextQty) {
        // Consume new quantity from new warehouse
        const { product: p, allocations } = updateWarehouseStock(
          resultProduct,
          nextWarehouseKey,
          -nextQty,
        );
        resultProduct = p;
        if (nextItemRef) {
          nextItemRef.lotAllocations = allocations;
        }
      }
    }

    return resultProduct;
  });
};
