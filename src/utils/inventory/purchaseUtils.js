import {
  normalizeWarehouseStock,
  getAllWarehouseKeys,
  getDefaultWarehouse,
  resolveWarehouseKey,
} from "./warehouseUtils.js";

const generateLotId = () =>
  `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

// Hàm hỗ trợ chuẩn hóa một lô hàng (lot). Trả về tham chiếu gốc nếu không cần thay đổi.
const normalizeLot = (lot) => {
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

  if (!warehouseChanged && !needsOriginalQtyUpdate && !needsShippingUpdate) {
    return lot;
  }

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
};

// Helper function to check if array is sorted by createdAt
const isSortedByDate = (lots) => {
  for (let i = 0; i < lots.length - 1; i++) {
    const d1 = lots[i].createdAt || "";
    const d2 = lots[i + 1].createdAt || "";
    if (d1 > d2) return false;
  }
  return true;
};

// Helper to insert a lot into a sorted array while maintaining order
const insertSorted = (lots, newLot) => {
  const newDate = newLot.createdAt || "";
  // Optimization: check if it belongs at the end (common case for new lots)
  if (lots.length === 0 || (lots[lots.length - 1].createdAt || "") <= newDate) {
    return [...lots, newLot];
  }

  // Find insertion index
  const index = lots.findIndex(l => (l.createdAt || "") > newDate);
  if (index === -1) {
    // Should be covered by optimization above, but safe fallback
    return [...lots, newLot];
  }

  const newLots = [...lots];
  newLots.splice(index, 0, newLot);
  return newLots;
};

export const normalizePurchaseLots = (product = {}) => {
  if (Array.isArray(product.purchaseLots)) {
    const lots = product.purchaseLots;
    let changeIndex = -1;

    // Tối ưu hóa: Kiểm tra thay đổi trước để tránh cấp phát mảng mới nếu không cần thiết.
    // Điều này nhanh hơn đáng kể với dữ liệu "sạch" (trường hợp phổ biến khi load).
    for (let i = 0; i < lots.length; i++) {
      const lot = lots[i];
      // Kiểm tra xem normalizeLot có trả về tham chiếu mới không
      if (normalizeLot(lot) !== lot) {
        changeIndex = i;
        break;
      }
    }

    let normalizedLots = lots;

    // Nếu có thay đổi, xây dựng mảng mới
    if (changeIndex !== -1) {
      // Bắt đầu với phần mảng không thay đổi.
      normalizedLots = lots.slice(0, changeIndex);
      // Xử lý phần còn lại bắt đầu từ item đầu tiên bị thay đổi.
      for (let i = changeIndex; i < lots.length; i++) {
        normalizedLots.push(normalizeLot(lots[i]));
      }
    }

    // Ensure sorted order
    if (!isSortedByDate(normalizedLots)) {
      // If we haven't cloned yet (changeIndex === -1), we must clone now
      if (normalizedLots === lots) {
        normalizedLots = [...lots];
      }
      normalizedLots.sort((a, b) => {
        const d1 = a.createdAt || "";
        const d2 = b.createdAt || "";
        if (d1 < d2) return -1;
        if (d1 > d2) return 1;
        return 0;
      });
    }

    // If nothing changed (no normalize changes AND already sorted), return original product
    if (normalizedLots === lots) return product;

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

  // Lots generated here have same createdAt, so they are sorted by default.

  return {
    ...product,
    purchaseLots: lots,
  };
};

export const getLatestLot = (product = {}) => {
  const lots = product.purchaseLots;
  if (!lots || !Array.isArray(lots) || lots.length === 0) return null;

  // Assuming lots are sorted by createdAt ASC due to normalizePurchaseLots and insertSorted.
  // We can just take the last element. O(1).
  return lots[lots.length - 1];
};

export const getOldestActiveLot = (product = {}) => {
  const lots = product.purchaseLots;
  if (!lots || !Array.isArray(lots) || lots.length === 0) return null;

  // Assuming lots are sorted by createdAt ASC.
  // We find the first lot with quantity > 0.
  // This avoids scanning the whole array if we find one early.
  for (const lot of lots) {
    if ((Number(lot.quantity) || 0) > 0) {
      return lot;
    }
  }

  return null;
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

  // Insert while maintaining sort order
  const nextLots = insertSorted(product.purchaseLots || [], nextLot);

  return {
    ...product,
    purchaseLots: nextLots,
    cost: nextLot.cost || product.cost || 0,
  };
};

export const consumePurchaseLots = (product, warehouseKey, quantity) => {
  let remaining = Math.max(0, Number(quantity) || 0);
  if (remaining === 0) return { product, allocations: [] };

  // Shallow copy mảng lots. Chỉ deep copy từng item KHI cần sửa đổi (Structural Sharing).
  // Điều này tránh O(N) object allocation cho toàn bộ danh sách lot.
  const lots = [...(product.purchaseLots || [])];
  const allocations = [];

  // Lọc các lot thuộc kho cần xuất
  const targetKey = resolveWarehouseKey(warehouseKey);

  // Tìm candidate mà không clone object.
  // Lưu index gốc để cập nhật lại mảng lots.
  const candidates = [];
  for (let i = 0; i < lots.length; i++) {
    const lot = lots[i];
    const lotWarehouse = resolveWarehouseKey(lot.warehouse);
    if (lotWarehouse === targetKey && (Number(lot.quantity) || 0) > 0) {
      candidates.push({ lot, index: i });
    }
  }

  // Sắp xếp theo giá nhập (cost) TĂNG DẦN (thấp nhất xuất trước)
  // Nếu giá bằng nhau, ưu tiên lô cũ hơn (createdAt hoặc index nhỏ hơn)
  candidates.sort((a, b) => {
    const costA = Number(a.lot.cost) || 0;
    const costB = Number(b.lot.cost) || 0;
    if (costA !== costB) {
      return costA - costB;
    }
    // Nếu giá bằng nhau, ưu tiên nhập trước (FIFO theo thời gian)
    return a.index - b.index;
  });

  // Trừ tồn kho từ các lot đã sắp xếp
  for (const candidate of candidates) {
    if (remaining <= 0) break;
    const lot = candidate.lot;
    const available = Number(lot.quantity) || 0;
    const used = Math.min(available, remaining);

    // Cập nhật lại số lượng: Clone object lot tại index cụ thể.
    // Các lot khác giữ nguyên reference.
    lots[candidate.index] = {
      ...lot,
      quantity: available - used,
    };

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

  // Shallow copy
  const lots = [...(product.purchaseLots || [])];

  for (const alloc of allocations) {
    const lotIndex = lots.findIndex((l) => l.id === alloc.lotId);
    if (lotIndex !== -1) {
      // Clone only the modified lot
      lots[lotIndex] = {
        ...lots[lotIndex],
        quantity:
          (Number(lots[lotIndex].quantity) || 0) +
          (Number(alloc.quantity) || 0),
      };
    }
    // Nếu không tìm thấy lot, ta có thể bỏ qua hoặc log error.
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

  const nextLots = insertSorted(product.purchaseLots || [], nextLot);

  return {
    ...product,
    purchaseLots: nextLots,
  };
};
