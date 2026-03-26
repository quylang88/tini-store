export const WAREHOUSES = [
  {
    key: "vinhPhuc",
    label: "Vĩnh Phúc",
    shortLabel: "Kho VP",
    isDefault: true,
    defaultCustomerName: "Mẹ Hương",
    legacyKeys: [], // Thêm các key cũ vào đây nếu kho này được đổi tên trong tương lai
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

// Initialize caches via a single pass for optimal performance
const {
  ALL_WAREHOUSE_KEYS,
  WAREHOUSE_KEY_MAP,
  WAREHOUSE_LABEL_MAP,
  WAREHOUSE_SHORT_LABEL_MAP,
  EMPTY_STOCK,
} = (() => {
  const keys = new Array(WAREHOUSES.length);
  const keyMap = {};
  const labelMap = {};
  const shortLabelMap = {};
  const emptyStock = {};

  for (let i = 0; i < WAREHOUSES.length; i++) {
    const w = WAREHOUSES[i];
    keys[i] = w.key;
    keyMap[w.key] = w.key;
    labelMap[w.key] = w.label;
    shortLabelMap[w.key] = w.shortLabel || w.label;
    emptyStock[w.key] = 0;

    if (w.legacyKeys && w.legacyKeys.length > 0) {
      for (const legacyKey of w.legacyKeys) {
        keyMap[legacyKey] = w.key;
      }
    }
  }
  return {
    ALL_WAREHOUSE_KEYS: keys,
    WAREHOUSE_KEY_MAP: keyMap,
    WAREHOUSE_LABEL_MAP: labelMap,
    WAREHOUSE_SHORT_LABEL_MAP: shortLabelMap,
    EMPTY_STOCK: emptyStock,
  };
})();

export const getAllWarehouseKeys = () => ALL_WAREHOUSE_KEYS;

// Helper để map bất kỳ key nào (hiện tại hoặc cũ) sang key chính hiện tại
export const resolveWarehouseKey = (key) => {
  if (!key) return null;
  // Sử dụng map lookup O(1) thay vì find O(N)
  return WAREHOUSE_KEY_MAP[key] || key;
};

export const getWarehouseLabel = (key) => {
  const resolvedKey = resolveWarehouseKey(key);
  // O(1) lookup instead of O(N) array find
  return WAREHOUSE_LABEL_MAP[resolvedKey] || key;
};

export const getWarehouseShortLabel = (key) => {
  const resolvedKey = resolveWarehouseKey(key);
  // O(1) lookup instead of O(N) array find
  return WAREHOUSE_SHORT_LABEL_MAP[resolvedKey] || key;
};

export const normalizeWarehouseStock = (product = {}) => {
  // Use pre-allocated static object instead of dynamically generating keys array
  const stock = { ...EMPTY_STOCK };

  if (product.stockByWarehouse) {
    // Tối ưu hóa: Sử dụng vòng lặp for...in để tránh tạo mảng các key
    for (const sourceKey in product.stockByWarehouse) {
      if (
        Object.prototype.hasOwnProperty.call(
          product.stockByWarehouse,
          sourceKey,
        )
      ) {
        const value = Number(product.stockByWarehouse[sourceKey]) || 0;
        const targetKey = resolveWarehouseKey(sourceKey);

        // Chỉ cộng dồn nếu key đích hợp lệ trong config
        if (Object.prototype.hasOwnProperty.call(stock, targetKey)) {
          stock[targetKey] += value;
        } else {
          // Nếu có dữ liệu cho key không có trong config (và không được alias),
          // ta có thể bỏ qua hoặc giữ lại.
          // Để an toàn/dễ kiểm tra, ta giữ lại trong object, nhưng nó sẽ không nằm trong danh sách primaryKeys.
          stock[targetKey] = (stock[targetKey] || 0) + value;
        }
      }
    }
  }
  // Đã bỏ logic fallback cho product.stock (dữ liệu cũ)

  return stock;
};

// Tối ưu hóa: Tính tồn kho cho một kho cụ thể mà không cần tạo object mới.
// Giúp giảm áp lực GC khi lọc danh sách lớn.
export const getSpecificWarehouseStock = (product, targetWarehouseKey) => {
  if (!product.stockByWarehouse || !targetWarehouseKey) return 0;

  let total = 0;
  for (const sourceKey in product.stockByWarehouse) {
    if (
      Object.prototype.hasOwnProperty.call(product.stockByWarehouse, sourceKey)
    ) {
      if (resolveWarehouseKey(sourceKey) === targetWarehouseKey) {
        total += Number(product.stockByWarehouse[sourceKey]) || 0;
      }
    }
  }
  return total;
};

export const getTotalStock = (product = {}) => {
  if (!product.stockByWarehouse) return 0;

  // Tối ưu hóa: Tránh tạo mảng trung gian từ Object.values và reduce
  let sum = 0;
  for (const key in product.stockByWarehouse) {
    if (
      Object.prototype.hasOwnProperty.call(product.stockByWarehouse, key)
    ) {
      sum += Number(product.stockByWarehouse[key]) || 0;
    }
  }
  return sum;
};
