export const WAREHOUSES = [
  { key: "lamDong", label: "Lâm Đồng" },
  { key: "vinhPhuc", label: "Vĩnh Phúc" },
];

export const getWarehouseLabel = (key) => {
  const warehouse = WAREHOUSES.find((item) => item.key === key);
  return warehouse ? warehouse.label : key;
};

export const normalizeWarehouseStock = (product = {}) => {
  if (product.stockByWarehouse) {
    return {
      lamDong: Number(product.stockByWarehouse.lamDong) || 0,
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
