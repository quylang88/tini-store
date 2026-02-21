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

// Cache kết quả normalizeWarehouseStock để tránh tạo object lặp lại.
// Key là object reference stockByWarehouse.
const STOCK_CACHE = new WeakMap();

// Cache kết quả getTotalStock để tránh tính toán lại.
// Key là object reference stockByWarehouse.
const TOTAL_STOCK_CACHE = new WeakMap();

// Object mặc định (đóng băng) khi không có dữ liệu kho.
// Giúp tránh tạo object { vinhPhuc: 0, lamDong: 0 } mới mỗi lần gọi.
const EMPTY_STOCK = Object.freeze(
  ALL_WAREHOUSE_KEYS.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {}),
);

export const normalizeWarehouseStock = (product = {}) => {
  // Nếu không có stockByWarehouse hoặc không phải object, trả về object rỗng mặc định.
  // Check typeof để đảm bảo WeakMap không lỗi với primitive.
  if (
    !product ||
    !product.stockByWarehouse ||
    typeof product.stockByWarehouse !== "object"
  ) {
    return EMPTY_STOCK;
  }

  // Kiểm tra cache
  if (STOCK_CACHE.has(product.stockByWarehouse)) {
    return STOCK_CACHE.get(product.stockByWarehouse);
  }

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

  // Lưu vào cache trước khi trả về
  STOCK_CACHE.set(product.stockByWarehouse, stock);
  return stock;
};

// Tối ưu hóa: Sử dụng normalizeWarehouseStock (đã cache) để lấy tồn kho O(1).
// Thay thế vòng lặp O(K) bằng lookup O(1) từ cache.
export const getSpecificWarehouseStock = (product, targetWarehouseKey) => {
  const stock = normalizeWarehouseStock(product);
  const resolvedKey = resolveWarehouseKey(targetWarehouseKey);
  return stock[resolvedKey] || 0;
};

export const getTotalStock = (product = {}) => {
  // Check valid object for WeakMap key
  if (
    !product ||
    !product.stockByWarehouse ||
    typeof product.stockByWarehouse !== "object"
  ) {
    return 0;
  }

  if (TOTAL_STOCK_CACHE.has(product.stockByWarehouse)) {
    return TOTAL_STOCK_CACHE.get(product.stockByWarehouse);
  }

  // Sử dụng normalizeWarehouseStock để tận dụng cache object và xử lý key mapping
  const stock = normalizeWarehouseStock(product);
  const total = Object.values(stock).reduce((sum, val) => sum + val, 0);

  TOTAL_STOCK_CACHE.set(product.stockByWarehouse, total);
  return total;
};
