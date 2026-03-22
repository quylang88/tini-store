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

// Initialize all caches in a single pass to avoid multiple O(N) iterations
const ALL_WAREHOUSE_KEYS = [];
const WAREHOUSE_KEY_MAP = {};
const WAREHOUSE_LABEL_MAP = {};
const WAREHOUSE_SHORT_LABEL_MAP = {};
const _emptyStockAcc = {};

for (const w of WAREHOUSES) {
  const key = w.key;
  const label = w.label;

  ALL_WAREHOUSE_KEYS.push(key);

  // Cache mapping key -> resolvedKey để tránh find() mỗi lần gọi
  WAREHOUSE_KEY_MAP[key] = key;
  const legacyKeys = w.legacyKeys;
  if (legacyKeys) {
    for (const legacyKey of legacyKeys) {
      WAREHOUSE_KEY_MAP[legacyKey] = key;
    }
  }

  // Cache label để lookup O(1) thay vì find()
  WAREHOUSE_LABEL_MAP[key] = label;

  // Cache short label để lookup O(1)
  WAREHOUSE_SHORT_LABEL_MAP[key] = w.shortLabel || label;

  // Prepare object for EMPTY_STOCK
  _emptyStockAcc[key] = 0;
}

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
const EMPTY_STOCK = Object.freeze(_emptyStockAcc);

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

// Helper tính tổng số lượng tồn kho sử dụng vòng lặp for...in để tránh cấp phát mảng
// từ Object.values và callback từ reduce. Tránh tạo mảng key tĩnh để cộng gộp đúng
// các key extra (không có trong config).
export const calculateTotalStock = (stockObj) => {
  let total = 0;
  for (const key in stockObj) {
    if (Object.prototype.hasOwnProperty.call(stockObj, key)) {
      total += stockObj[key];
    }
  }
  return total;
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
  const total = calculateTotalStock(stock);

  TOTAL_STOCK_CACHE.set(product.stockByWarehouse, total);
  return total;
};
