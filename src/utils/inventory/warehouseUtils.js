export const WAREHOUSES = [
  { key: "lamDong", label: "Lâm Đồng" },
  { key: "vinhPhuc", label: "Vĩnh Phúc" },
];

export const getWarehouseLabel = (key) => {
  // Support legacy key 'daLat' by mapping it to 'lamDong' label logic
  if (key === "daLat") key = "lamDong";

  const warehouse = WAREHOUSES.find((item) => item.key === key);
  return warehouse ? warehouse.label : key;
};

export const normalizeWarehouseStock = (product = {}) => {
  if (product.stockByWarehouse) {
    return {
      // Prioritize new key 'lamDong', fallback to legacy 'daLat'
      lamDong: Number(product.stockByWarehouse.lamDong || product.stockByWarehouse.daLat) || 0,
      vinhPhuc: Number(product.stockByWarehouse.vinhPhuc) || 0,
    };
  }

  const fallbackStock = Number(product.stock) || 0;
  return {
    lamDong: fallbackStock,
    vinhPhuc: 0,
  };
};

export const getTotalStock = (product = {}) => {
  const { lamDong, vinhPhuc } = normalizeWarehouseStock(product);
  return lamDong + vinhPhuc;
};
