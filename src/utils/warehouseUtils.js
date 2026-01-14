export const WAREHOUSES = [
  { key: 'daLat', label: 'Lâm Đồng' },
  { key: 'vinhPhuc', label: 'Vĩnh Phúc' },
];

export const getWarehouseLabel = (key) => {
  const warehouse = WAREHOUSES.find((item) => item.key === key);
  return warehouse ? warehouse.label : key;
};

export const normalizeWarehouseStock = (product = {}) => {
  if (product.stockByWarehouse) {
    return {
      daLat: Number(product.stockByWarehouse.daLat) || 0,
      vinhPhuc: Number(product.stockByWarehouse.vinhPhuc) || 0,
    };
  }
  
  const fallbackStock = Number(product.stock) || 0;
  return {
    daLat: fallbackStock,
    vinhPhuc: 0,
  };
};

export const getTotalStock = (product = {}) => {
  const { daLat, vinhPhuc } = normalizeWarehouseStock(product);
  return daLat + vinhPhuc;
};
