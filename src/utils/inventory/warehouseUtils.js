export const WAREHOUSES = [
  {
    key: "vinhPhuc",
    label: "Vĩnh Phúc",
    shortLabel: "Kho VP",
    isDefault: true,
    defaultCustomerName: "Mẹ Hương",
  },
  {
    key: "lamDong",
    label: "Lâm Đồng",
    shortLabel: "Kho LĐ",
    defaultCustomerName: "Mẹ Nguyệt",
  },
];

export const getWarehouses = () => WAREHOUSES;

export const getDefaultWarehouse = () => {
  return WAREHOUSES.find((w) => w.isDefault) || WAREHOUSES[0];
};

export const getAllWarehouseKeys = () => WAREHOUSES.map((w) => w.key);

export const getWarehouseLabel = (key) => {
  const warehouse = WAREHOUSES.find((item) => item.key === key);
  return warehouse ? warehouse.label : key;
};

export const getWarehouseShortLabel = (key) => {
  const warehouse = WAREHOUSES.find((item) => item.key === key);
  return warehouse?.shortLabel || warehouse?.label || key;
};

export const normalizeWarehouseStock = (product = {}) => {
  const stock = {};
  const keys = getAllWarehouseKeys();

  if (product.stockByWarehouse) {
    keys.forEach((key) => {
      stock[key] = Number(product.stockByWarehouse[key]) || 0;
    });
    return stock;
  }

  // Fallback for legacy data (assuming it belongs to the second warehouse 'lamDong'
  // based on previous hardcoded logic, or the non-default one).
  // Ideally, this should be the 'Legacy' warehouse.
  // Previous logic: lamDong = stock, vinhPhuc = 0.
  // We will replicate this by finding 'lamDong' if it exists, otherwise use default.
  // Note: We access 'lamDong' string here ONLY to preserve legacy behavior within the config context.
  // If 'lamDong' is removed from config, this falls back to the first warehouse.
  const fallbackKey =
    WAREHOUSES.find((w) => w.key === "lamDong")?.key || WAREHOUSES[0].key;
  const fallbackStock = Number(product.stock) || 0;

  keys.forEach((key) => {
    stock[key] = key === fallbackKey ? fallbackStock : 0;
  });

  return stock;
};

export const getTotalStock = (product = {}) => {
  const stockByWarehouse = normalizeWarehouseStock(product);
  return Object.values(stockByWarehouse).reduce((sum, val) => sum + val, 0);
};
