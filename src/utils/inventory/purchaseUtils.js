import {
  normalizeWarehouseStock,
  getAllWarehouseKeys,
  getDefaultWarehouse,
  resolveWarehouseKey,
} from "./warehouseUtils.js";

const generateLotId = () =>
  `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

export const normalizePurchaseLots = (product = {}) => {
  if (Array.isArray(product.purchaseLots)) {
    let hasChanges = false;
    const normalizedLots = product.purchaseLots.map((lot) => {
      // Ánh xạ các key kho cũ sang key hiện tại
      const currentWarehouse = resolveWarehouseKey(lot.warehouse);
      const warehouseChanged =
        currentWarehouse && currentWarehouse !== lot.warehouse;

      const needsOriginalQtyUpdate = !lot.originalQuantity && lot.quantity;

      let needsShippingUpdate = false;
      let feeVnd = 0;
      if (lot.shipping) {
        feeVnd = Number(lot.shipping.feeVnd) || 0;
        // Nếu chưa có perUnitVnd hoặc giá trị không khớp (ví dụ feeVnd thay đổi), cần update
        // Sử dụng loose equality để handle trường hợp string/number
        if (
          lot.shipping.perUnitVnd === undefined ||
          Number(lot.shipping.perUnitVnd) !== feeVnd
        ) {
          needsShippingUpdate = true;
        }
      }

      if (
        !warehouseChanged &&
        !needsOriginalQtyUpdate &&
        !needsShippingUpdate
      ) {
        return lot;
      }

      hasChanges = true;
      let newLot = lot;

      if (warehouseChanged) {
        newLot = { ...newLot, warehouse: currentWarehouse };
      }

      if (needsOriginalQtyUpdate) {
        newLot = {
          ...newLot,
          originalQuantity: newLot.originalQuantity || newLot.quantity,
        };
      }

      if (needsShippingUpdate) {
        newLot = {
          ...newLot,
          shipping: {
            ...newLot.shipping,
            perUnitVnd: feeVnd,
          },
        };
      }
      return newLot;
    });

    if (!hasChanges) return product;

    return { ...product, purchaseLots: normalizedLots };
  }

  const warehouseStock = normalizeWarehouseStock(product);
  const baseCost = Number(product.cost) || 0;
  const createdAt = product.createdAt || new Date().toISOString();
  const lots = [];

  const keys = getAllWarehouseKeys();
  keys.forEach((key) => {
    const qty = warehouseStock[key];
    if (qty > 0) {
      lots.push({
        id: generateLotId(),
        cost: baseCost,
        quantity: qty,
        originalQuantity: qty,
        warehouse: key,
        createdAt,
        shipping: null,
      });
    }
  });

  return {
    ...product,
    purchaseLots: lots,
  };
};

// Cache kết quả tìm kiếm lot mới nhất để tránh loop O(N) lặp lại.
// Key là reference của array purchaseLots.
const latestLotCache = new WeakMap();

export const getLatestLot = (product = {}) => {
  const lots = product.purchaseLots;
  if (!lots || !Array.isArray(lots) || lots.length === 0) return null;

  if (latestLotCache.has(lots)) {
    return latestLotCache.get(lots);
  }

  // Find lot with latest createdAt using string comparison (ISO format).
  // Note: We must scan the array (O(N)) because lots are not guaranteed to be sorted by date.
  // Using string comparison is faster than new Date() parsing.
  const latest = lots.reduce((latest, current) => {
    if (!latest) return current;
    const latestDate = latest.createdAt || "";
    const currentDate = current.createdAt || "";
    return currentDate > latestDate ? current : latest;
  }, lots[0]);

  latestLotCache.set(lots, latest);
  return latest;
};

// Cache lô hàng cũ nhất còn tồn kho (quantity > 0) để tránh loop O(N) lặp lại
// Lưu ý: Key là tham chiếu mảng purchaseLots. Đảm bảo dữ liệu được cập nhật kiểu immutable.
const oldestActiveLotCache = new WeakMap();

export const getOldestActiveLot = (product = {}) => {
  const lots = product.purchaseLots;
  if (!lots || !Array.isArray(lots) || lots.length === 0) return null;

  if (oldestActiveLotCache.has(lots)) {
    return oldestActiveLotCache.get(lots);
  }

  let oldest = null;
  for (const lot of lots) {
    if ((Number(lot.quantity) || 0) > 0) {
      if (!oldest) {
        oldest = lot;
      } else {
        const oldestDate = oldest.createdAt || "";
        const currentDate = lot.createdAt || "";
        if (currentDate < oldestDate) {
          oldest = lot;
        }
      }
    }
  }

  oldestActiveLotCache.set(lots, oldest);
  return oldest;
};

// Returns all stats in one pass to avoid multiple array scans
export const getProductStats = (product = {}) => {
  const latestLot = getLatestLot(product);
  const cost = latestLot
    ? Number(latestLot.cost) || 0
    : Number(product.cost) || 0;

  const shippingPerUnit = latestLot
    ? Number(latestLot.shipping?.perUnitVnd) || 0
    : 0;
  const unitCost = cost + shippingPerUnit;
  const isJpy = latestLot ? Number(latestLot.costJpy) > 0 : false;

  return { latestLot, cost, unitCost, isJpy };
};

export const addPurchaseLot = (product, lot) => {
  const quantity = Number(lot.quantity) || 0;
  const shippingFeeVnd = Number(lot.shipping?.feeVnd) || 0;
  // Sử dụng key đã resolve hoặc mặc định nếu không có
  const targetWarehouse =
    resolveWarehouseKey(lot.warehouse) || getDefaultWarehouse().key;

  const nextLot = {
    id: lot.id || generateLotId(),
    cost: Number(lot.cost) || 0,
    costJpy: Number(lot.costJpy) || 0,
    quantity,
    originalQuantity: quantity,
    warehouse: targetWarehouse,
    createdAt: lot.createdAt || new Date().toISOString(),
    priceAtPurchase: Number(lot.priceAtPurchase) || 0,
    expiryDate: lot.expiryDate || "",
    shipping: lot.shipping
      ? {
          ...lot.shipping,
          perUnitVnd: shippingFeeVnd,
        }
      : null,
  };
  const nextLots = [...(product.purchaseLots || []), nextLot];

  return {
    ...product,
    purchaseLots: nextLots,
    cost: nextLot.cost || product.cost || 0,
  };
};

export const consumePurchaseLots = (product, warehouseKey, quantity) => {
  let remaining = Math.max(0, Number(quantity) || 0);
  if (remaining === 0) return { product, allocations: [] };

  // Clone lots để tránh mutation trực tiếp
  const lots = (product.purchaseLots || []).map((lot) => ({ ...lot }));
  const allocations = [];

  // Lọc các lot thuộc kho cần xuất
  // Sử dụng resolveWarehouseKey để khớp cả key chính và key cũ
  const targetKey = resolveWarehouseKey(warehouseKey);

  const availableLots = lots
    .map((lot, index) => ({ ...lot, originalIndex: index })) // Giữ index gốc để cập nhật lại
    .filter((lot) => {
      const lotWarehouse = resolveWarehouseKey(lot.warehouse);
      return lotWarehouse === targetKey && (Number(lot.quantity) || 0) > 0;
    });

  // Sắp xếp theo giá nhập (cost) TĂNG DẦN (thấp nhất xuất trước)
  // Nếu giá bằng nhau, ưu tiên lô cũ hơn (createdAt hoặc index nhỏ hơn)
  availableLots.sort((a, b) => {
    const costA = Number(a.cost) || 0;
    const costB = Number(b.cost) || 0;
    if (costA !== costB) {
      return costA - costB;
    }
    // Nếu giá bằng nhau, ưu tiên nhập trước (FIFO theo thời gian)
    // Giả sử mảng gốc đã sắp xếp theo thời gian nhập
    return a.originalIndex - b.originalIndex;
  });

  // Trừ tồn kho từ các lot đã sắp xếp
  for (const lot of availableLots) {
    if (remaining <= 0) break;
    const available = Number(lot.quantity) || 0;
    const used = Math.min(available, remaining);

    // Cập nhật lại số lượng trong mảng gốc
    lots[lot.originalIndex].quantity = available - used;
    remaining -= used;
    allocations.push({ lotId: lot.id, quantity: used });
  }

  return {
    product: {
      ...product,
      purchaseLots: lots,
    },
    allocations,
  };
};

export const restorePurchaseLots = (product, allocations) => {
  if (!allocations || allocations.length === 0) return product;

  // Clone lots
  const lots = (product.purchaseLots || []).map((lot) => ({ ...lot }));

  for (const alloc of allocations) {
    const lotIndex = lots.findIndex((l) => l.id === alloc.lotId);
    if (lotIndex !== -1) {
      lots[lotIndex].quantity =
        (Number(lots[lotIndex].quantity) || 0) + (Number(alloc.quantity) || 0);
    }
    // Nếu không tìm thấy lot, ta có thể bỏ qua hoặc log error.
    // Theo yêu cầu "không tạo lot mới", ta chỉ restore vào lot cũ.
  }

  return {
    ...product,
    purchaseLots: lots,
  };
};

export const restockPurchaseLots = (product, warehouseKey, quantity, cost) => {
  const restockQty = Math.max(0, Number(quantity) || 0);
  if (restockQty === 0) return product;

  // Resolve warehouse key để đảm bảo dùng key chính hiện tại
  const targetKey =
    resolveWarehouseKey(warehouseKey) || getDefaultWarehouse().key;

  const nextLot = {
    id: generateLotId(),
    cost: Number(cost) || Number(product.cost) || 0,
    quantity: restockQty,
    originalQuantity: restockQty,
    warehouse: targetKey,
    createdAt: new Date().toISOString(),
    shipping: null,
  };

  return {
    ...product,
    purchaseLots: [...(product.purchaseLots || []), nextLot],
  };
};
