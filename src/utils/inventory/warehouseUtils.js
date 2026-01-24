export const WAREHOUSES = [
  {
    key: "vinhPhuc",
    label: "Vĩnh Phúc",
    shortLabel: "Kho VP",
    isDefault: true,
    defaultCustomerName: "Mẹ Hương",
    legacyKeys: [], // Add legacy keys here if this warehouse is renamed in the future
  },
  {
    key: "lamDong",
    label: "Lâm Đồng",
    shortLabel: "Kho LĐ",
    defaultCustomerName: "Mẹ Nguyệt",
    legacyKeys: [],
  },
];

export const getWarehouses = () => WAREHOUSES;

export const getDefaultWarehouse = () => {
  return WAREHOUSES.find((w) => w.isDefault) || WAREHOUSES[0];
};

export const getAllWarehouseKeys = () => WAREHOUSES.map((w) => w.key);

// Helper to map any key (current or legacy) to the current primary key
export const resolveWarehouseKey = (key) => {
  if (!key) return null;
  const match = WAREHOUSES.find(
    (w) => w.key === key || (w.legacyKeys && w.legacyKeys.includes(key)),
  );
  return match ? match.key : key; // Return resolved key, or original if not found (fallback)
};

export const getWarehouseLabel = (key) => {
  const resolvedKey = resolveWarehouseKey(key);
  const warehouse = WAREHOUSES.find((item) => item.key === resolvedKey);
  return warehouse ? warehouse.label : key;
};

export const getWarehouseShortLabel = (key) => {
  const resolvedKey = resolveWarehouseKey(key);
  const warehouse = WAREHOUSES.find((item) => item.key === resolvedKey);
  return warehouse?.shortLabel || warehouse?.label || key;
};

export const normalizeWarehouseStock = (product = {}) => {
  const stock = {};
  const primaryKeys = getAllWarehouseKeys();

  // Initialize all primary keys to 0
  primaryKeys.forEach((key) => {
    stock[key] = 0;
  });

  if (product.stockByWarehouse) {
    Object.keys(product.stockByWarehouse).forEach((sourceKey) => {
      const value = Number(product.stockByWarehouse[sourceKey]) || 0;
      const targetKey = resolveWarehouseKey(sourceKey);

      // Only accumulate if the target key is valid in our config
      if (stock.hasOwnProperty(targetKey)) {
        stock[targetKey] += value;
      } else {
        // If we have data for a key not in config (and not aliased),
        // we could either ignore it or keep it.
        // For safety/visibility, we keep it in the object, but it won't be in primaryKeys list.
        stock[targetKey] = (stock[targetKey] || 0) + value;
      }
    });
  }
  // Removed legacy fallback logic for product.stock

  return stock;
};

export const getTotalStock = (product = {}) => {
  const stockByWarehouse = normalizeWarehouseStock(product);
  return Object.values(stockByWarehouse).reduce((sum, val) => sum + val, 0);
};
