export const WAREHOUSES = [
  { key: 'daLat', label: 'Đà Lạt' },
  { key: 'vinhPhuc', label: 'Vĩnh Phúc' },
];

export const getWarehouseLabel = (key) => {
  const warehouse = WAREHOUSES.find((item) => item.key === key);
  return warehouse ? warehouse.label : key;
};

export const normalizeWarehouseStock = (product = {}) => {
  const fallbackStock = Number(product.stock) || 0;
  const stockByWarehouse = product.stockByWarehouse ?? { daLat: fallbackStock, vinhPhuc: 0 };
  return {
    daLat: Number(stockByWarehouse.daLat) || 0,
    vinhPhuc: Number(stockByWarehouse.vinhPhuc) || 0,
  };
};

export const getTotalStock = (product = {}) => {
  const { daLat, vinhPhuc } = normalizeWarehouseStock(product);
  return daLat + vinhPhuc;
};
