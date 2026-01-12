import { normalizeWarehouseStock } from './warehouseUtils';

// Chuẩn hoá lô nhập: nếu dữ liệu cũ chưa có lô thì tạo lô "legacy" từ tồn kho hiện tại.
export const normalizePurchaseLots = (product = {}) => {
  if (Array.isArray(product.purchaseLots) && product.purchaseLots.length > 0) {
    return product.purchaseLots;
  }

  const stockByWarehouse = normalizeWarehouseStock(product);
  const fallbackCost = Number(product.cost) || 0;
  const createdAt = product.createdAt || new Date().toISOString();
  const lots = [];

  if (stockByWarehouse.daLat > 0) {
    lots.push({
      id: `legacy-daLat-${product.id || 'item'}`,
      cost: fallbackCost,
      quantity: stockByWarehouse.daLat,
      warehouse: 'daLat',
      createdAt,
      isLegacy: true,
    });
  }

  if (stockByWarehouse.vinhPhuc > 0) {
    lots.push({
      id: `legacy-vinhPhuc-${product.id || 'item'}`,
      cost: fallbackCost,
      quantity: stockByWarehouse.vinhPhuc,
      warehouse: 'vinhPhuc',
      createdAt,
      isLegacy: true,
    });
  }

  return lots;
};

export const getLatestPurchaseCost = (purchaseLots = []) => {
  if (!purchaseLots.length) return 0;
  const sorted = [...purchaseLots].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return Number(sorted[0]?.cost) || 0;
};

export const getAveragePurchaseCost = (purchaseLots = []) => {
  if (!purchaseLots.length) return 0;
  const totals = purchaseLots.reduce(
    (acc, lot) => {
      acc.quantity += Number(lot.quantity) || 0;
      acc.cost += (Number(lot.quantity) || 0) * (Number(lot.cost) || 0);
      return acc;
    },
    { quantity: 0, cost: 0 },
  );
  if (!totals.quantity) return 0;
  return Math.round(totals.cost / totals.quantity);
};
