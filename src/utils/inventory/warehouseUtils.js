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

// Cache keys để tránh map() mỗi lần gọi
const ALL_WAREHOUSE_KEYS = WAREHOUSES.map((w) => w.key);

// Cache mapping key -> resolvedKey để tránh find() mỗi lần gọi
const WAREHOUSE_KEY_MAP = (() => {
  const map = {};
  WAREHOUSES.forEach((w) => {
    map[w.key] = w.key;
    if (w.legacyKeys) {
      w.legacyKeys.forEach((legacyKey) => {
        map[legacyKey] = w.key;
      });
    }
  });
  return map;
})();

// Cache label để lookup O(1) thay vì find()
const WAREHOUSE_LABEL_MAP = (() => {
  const map = {};
  WAREHOUSES.forEach((w) => {
    map[w.key] = w.label;
  });
  return map;
})();

// Cache short label để lookup O(1)
const WAREHOUSE_SHORT_LABEL_MAP = (() => {
  const map = {};
  WAREHOUSES.forEach((w) => {
    map[w.key] = w.shortLabel || w.label;
  });
  return map;
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
  // Sử dụng map lookup O(1) thay vì find O(N)
  return WAREHOUSE_LABEL_MAP[resolvedKey] || key;
};

export const getWarehouseShortLabel = (key) => {
  const resolvedKey = resolveWarehouseKey(key);
  // Sử dụng map lookup O(1) thay vì find O(N)
  return WAREHOUSE_SHORT_LABEL_MAP[resolvedKey] || key;
};

export const normalizeWarehouseStock = (product = {}) => {
  const stock = {};
  const primaryKeys = getAllWarehouseKeys();

  // Khởi tạo tất cả key chính bằng 0
  primaryKeys.forEach((key) => {
    stock[key] = 0;
  });

  if (product.stockByWarehouse) {
    // Tối ưu hóa: Sử dụng for...in thay vì Object.keys().forEach() để tránh tạo mảng keys.
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
  let total = 0;
  // Tối ưu hóa: Sử dụng vòng lặp for...in để tránh tạo mảng (Object.values) mỗi lần gọi.
  // Giúp giảm áp lực GC khi render danh sách dài.
  for (const key in product.stockByWarehouse) {
    if (Object.prototype.hasOwnProperty.call(product.stockByWarehouse, key)) {
      total += Number(product.stockByWarehouse[key]) || 0;
    }
  }
  return total;
};
