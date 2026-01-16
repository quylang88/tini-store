import { normalizeWarehouseStock } from "./warehouseUtils";

const generateLotId = () =>
  `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

export const normalizePurchaseLots = (product = {}) => {
  if (Array.isArray(product.purchaseLots)) {
    const normalizedLots = product.purchaseLots.map((lot) => {
      if (!lot?.shipping || lot.shipping?.perUnitVnd) {
        return lot;
      }
      const feeVnd = Number(lot.shipping.feeVnd) || 0;
      return {
        ...lot,
        shipping: {
          ...lot.shipping,
          perUnitVnd: feeVnd,
        },
      };
    });
    return { ...product, purchaseLots: normalizedLots };
  }
  const { daLat, vinhPhuc } = normalizeWarehouseStock(product);
  const baseCost = Number(product.cost) || 0;
  const createdAt = product.createdAt || new Date().toISOString();
  const lots = [];

  if (daLat > 0) {
    lots.push({
      id: generateLotId(),
      cost: baseCost,
      quantity: daLat,
      warehouse: "daLat",
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
  const nextLot = {
    id: lot.id || generateLotId(),
    cost: Number(lot.cost) || 0,
    quantity,
    warehouse: lot.warehouse || "daLat",
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
  let remaining = Math.max(0, Number(quantity) || 0);
  if (remaining === 0) return product;

  // Clone lots để tránh mutation trực tiếp
  const lots = (product.purchaseLots || []).map((lot) => ({ ...lot }));

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
  }

  // Lọc bỏ các lot đã hết hàng (quantity <= 0)
  const filteredLots = lots.filter((lot) => (Number(lot.quantity) || 0) > 0);

  return {
    ...product,
    purchaseLots: filteredLots,
  };
};

export const restockPurchaseLots = (product, warehouseKey, quantity, cost) => {
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
