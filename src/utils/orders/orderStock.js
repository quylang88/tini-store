import {
  normalizeWarehouseStock,
  getAllWarehouseKeys,
  resolveWarehouseKey,
} from "../inventory/warehouseUtils";
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

  // Cập nhật động đảm bảo key tồn tại
  const resolvedKey = resolveWarehouseKey(warehouseKey);
  const currentVal = nextStock[resolvedKey] || 0;
  nextStock[resolvedKey] = Math.max(0, currentVal + delta);

  // Đảm bảo tất cả các key cấu hình đều tồn tại (tuỳ chọn nhưng tốt cho tính nhất quán)
  getAllWarehouseKeys().forEach((key) => {
    if (nextStock[key] === undefined) nextStock[key] = 0;
  });

  const nextProduct = {
    ...product,
    stockByWarehouse: nextStock,
    stock: Object.values(nextStock).reduce((sum, val) => sum + val, 0),
  };

  if (delta < 0) {
    // consumePurchaseLots hiện trả về { product, allocations }
    return consumePurchaseLots(
      normalizePurchaseLots(nextProduct),
      resolvedKey,
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
      resolvedKey,
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

  // Duyệt từ cuối (trả về LIFO)
  for (let i = kept.length - 1; i >= 0; i--) {
    if (remaining <= 0) break;
    const alloc = kept[i];
    const available = alloc.quantity;

    if (available <= remaining) {
      // Xoá toàn bộ allocation
      returned.push({ lotId: alloc.lotId, quantity: available });
      remaining -= available;
      kept.splice(i, 1);
    } else {
      // Xoá một phần
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
    // Lưu object item để mutate nó với allocations
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

    // Resolve keys để so sánh chính xác
    const rPrevKey = resolveWarehouseKey(previousWarehouseKey);
    const rNextKey = resolveWarehouseKey(nextWarehouseKey);

    if (rPrevKey === rNextKey) {
      const delta = previousQty - nextQty;
      if (delta !== 0) {
        const previousCost = previousItem?.cost;
        let allocationsToRestore = [];

        // Nếu trả hàng (delta > 0), tính toán phần cần restore
        if (delta > 0) {
          const { kept, returned } = splitAllocations(
            previousItem?.lotAllocations,
            delta,
          );
          allocationsToRestore = returned;
          // Cập nhật item tiếp theo (item giữ lại) với các allocation được giữ
          if (nextItemRef) {
            nextItemRef.lotAllocations = kept;
          }
        }

        const { product: p, allocations } = updateWarehouseStock(
          product,
          rNextKey,
          delta,
          previousCost,
          allocationsToRestore,
        );
        resultProduct = p;

        // Nếu tiêu thụ hàng (delta < 0), thêm allocations vào item mới
        // Chúng ta cần gộp với các allocation hiện có của item trước đó (đã trở thành nền tảng cho item tiếp theo)
        // Thực tế, logic: nextItem bắt đầu mới?
        // Không, nextItem LÀ previousItem được sửa đổi.
        // Nếu delta < 0: ta giữ TẤT CẢ allocations trước đó, và THÊM allocations mới.
        if (delta < 0 && nextItemRef) {
          const baseAllocations = previousItem?.lotAllocations || [];
          nextItemRef.lotAllocations = [...baseAllocations, ...allocations];
        }
      } else {
        // Delta = 0, không thay đổi tồn kho, nhưng bảo toàn allocations
        if (nextItemRef) {
          nextItemRef.lotAllocations = previousItem?.lotAllocations || [];
        }
      }
    } else {
      // Khác kho: Restock kho cũ (delta > 0), Consume kho mới (delta < 0 theo logic)
      if (previousQty) {
        // Trả lại TOÀN BỘ previousQty
        const previousCost = previousItem?.cost;
        const { returned } = splitAllocations(
          previousItem?.lotAllocations,
          previousQty,
        );
        // kept nên rỗng, returned = all
        const { product: p } = updateWarehouseStock(
          resultProduct,
          rPrevKey,
          previousQty,
          previousCost,
          returned,
        );
        resultProduct = p;
      }
      if (nextQty) {
        // Tiêu thụ số lượng mới từ kho mới
        const { product: p, allocations } = updateWarehouseStock(
          resultProduct,
          rNextKey,
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
