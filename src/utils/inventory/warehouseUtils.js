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

export const getAllWarehouseKeys = () => WAREHOUSES.map((w) => w.key);

// Helper để map bất kỳ key nào (hiện tại hoặc cũ) sang key chính hiện tại
export const resolveWarehouseKey = (key) => {
  if (!key) return null;
  const match = WAREHOUSES.find(
    (w) => w.key === key || (w.legacyKeys && w.legacyKeys.includes(key)),
  );
  return match ? match.key : key; // Trả về key đã resolve, hoặc key gốc nếu không tìm thấy (fallback)
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

  // Khởi tạo tất cả key chính bằng 0
  primaryKeys.forEach((key) => {
    stock[key] = 0;
  });

  if (product.stockByWarehouse) {
    Object.keys(product.stockByWarehouse).forEach((sourceKey) => {
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
    });
  }
  // Đã bỏ logic fallback cho product.stock (dữ liệu cũ)

  return stock;
};

export const getTotalStock = (product = {}) => {
  const stockByWarehouse = normalizeWarehouseStock(product);
  return Object.values(stockByWarehouse).reduce((sum, val) => sum + val, 0);
};
