import { normalizeWarehouseStock } from "./warehouseUtils";

const generateLotId = () =>
  `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

export const normalizePurchaseLots = (product = {}) => {
  if (Array.isArray(product.purchaseLots)) {
    const normalizedLots = product.purchaseLots.map((lot) => {
      // Migration: Ensure ID exists
      const lotId = lot.id || generateLotId();

      // Migration: daLat -> lamDong
      let warehouse = lot.warehouse;
      if (warehouse === "daLat") {
        warehouse = "lamDong";
      }

      // Normalization: Shipping Fee
      let shipping = lot.shipping;
      if (shipping && !shipping.perUnitVnd) {
        const feeVnd = Number(shipping.feeVnd) || 0;
        shipping = {
          ...shipping,
          perUnitVnd: feeVnd,
        };
      }

      return {
        ...lot,
        id: lotId,
        warehouse,
        shipping,
        // Ensure costJpy persists if exists
        costJpy: lot.costJpy ? Number(lot.costJpy) : undefined
      };
    });
    return { ...product, purchaseLots: normalizedLots };
  }

  // Legacy conversion: stock -> purchaseLots
  const { lamDong, vinhPhuc } = normalizeWarehouseStock(product);
  const baseCost = Number(product.cost) || 0;
  const createdAt = product.createdAt || new Date().toISOString();
  const lots = [];

  if (lamDong > 0) {
    lots.push({
      id: generateLotId(),
      cost: baseCost,
      quantity: lamDong,
      warehouse: "lamDong",
      createdAt,
      shipping: null,
    });
  }

  if (vinhPhuc > 0) {
    lots.push({
      id: generateLotId(),
      cost: baseCost,
      quantity: vinhPhuc,
      warehouse: "vinhPhuc",
      createdAt,
      shipping: null,
    });
  }

  return {
    ...product,
    purchaseLots: lots,
  };
};

export const getLatestLot = (product = {}) => {
  const lots = product.purchaseLots || [];
  if (lots.length > 0) {
    return lots[lots.length - 1];
  }
  return null;
};

export const getLatestCost = (product = {}) => {
  const latestLot = getLatestLot(product);
  if (latestLot) {
    return Number(latestLot.cost) || 0;
  }
  return Number(product.cost) || 0;
};

export const getLatestUnitCost = (product = {}) => {
  const latestLot = getLatestLot(product);
  if (latestLot) {
    const baseCost = Number(latestLot.cost) || 0;
    const shippingPerUnit = Number(latestLot.shipping?.perUnitVnd) || 0;
    return baseCost + shippingPerUnit;
  }
  return Number(product.cost) || 0;
};

export const addPurchaseLot = (product, lot) => {
  const quantity = Number(lot.quantity) || 0;
  const shippingFeeVnd = Number(lot.shipping?.feeVnd) || 0;

  let warehouse = lot.warehouse || "lamDong";
  if (warehouse === "daLat") warehouse = "lamDong";

  const nextLot = {
    id: lot.id || generateLotId(),
    cost: Number(lot.cost) || 0,
    costJpy: lot.costJpy ? Number(lot.costJpy) : undefined, // Save JPY cost
    quantity,
    warehouse,
    createdAt: lot.createdAt || new Date().toISOString(),
    priceAtPurchase: Number(lot.priceAtPurchase) || 0,
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
  // Fix warehouse key if legacy
  if (warehouseKey === "daLat") warehouseKey = "lamDong";

  let remaining = Math.max(0, Number(quantity) || 0);
  if (remaining === 0) return { nextProduct: product, allocations: [] };

  // Clone lots để tránh mutation trực tiếp
  const lots = (product.purchaseLots || []).map((lot) => ({ ...lot }));
  const allocations = [];

  // Lọc các lot thuộc kho cần xuất
  const availableLots = lots
    .map((lot, index) => ({ ...lot, originalIndex: index })) // Giữ index gốc để cập nhật lại
    .filter(
      (lot) => lot.warehouse === warehouseKey && (Number(lot.quantity) || 0) > 0
    );

  // Sắp xếp theo giá nhập (cost) TĂNG DẦN (thấp nhất xuất trước)
  // Nếu giá bằng nhau, ưu tiên lô cũ hơn (createdAt hoặc index nhỏ hơn)
  availableLots.sort((a, b) => {
    const costA = Number(a.cost) || 0;
    const costB = Number(b.cost) || 0;
    if (costA !== costB) {
      return costA - costB;
    }
    // Nếu giá bằng nhau, ưu tiên nhập trước (FIFO theo thời gian)
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

    // Track allocation
    allocations.push({
      lotId: lot.id,
      quantity: used
    });
  }

  const nextProduct = {
    ...product,
    purchaseLots: lots,
  };

  return { nextProduct, allocations };
};

export const restorePurchaseLots = (product, allocations = []) => {
    if (!allocations || allocations.length === 0) return product;

    const lots = (product.purchaseLots || []).map(lot => ({...lot}));

    allocations.forEach(alloc => {
        const index = lots.findIndex(l => l.id === alloc.lotId);
        if (index !== -1) {
            lots[index].quantity = (Number(lots[index].quantity) || 0) + (Number(alloc.quantity) || 0);
        } else {
            console.warn(`Restore failed: Lot ID ${alloc.lotId} not found.`);
        }
    });

    return {
        ...product,
        purchaseLots: lots
    };
};


export const restockPurchaseLots = (product, warehouseKey, quantity, cost) => {
  if (warehouseKey === "daLat") warehouseKey = "lamDong";

  const restockQty = Math.max(0, Number(quantity) || 0);
  if (restockQty === 0) return product;

  const nextLot = {
    id: generateLotId(),
    cost: Number(cost) || Number(product.cost) || 0,
    quantity: restockQty,
    warehouse: warehouseKey,
    createdAt: new Date().toISOString(),
    shipping: null,
  };

  return {
    ...product,
    purchaseLots: [...(product.purchaseLots || []), nextLot],
  };
};
