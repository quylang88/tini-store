const ITERATIONS = 1000000;

const WAREHOUSES = [
  {
    key: "vinhPhuc",
    label: "Vĩnh Phúc",
    shortLabel: "Kho VP",
    isDefault: true,
    defaultCustomerName: "Mẹ Hương",
    legacyKeys: [],
  },
  {
    key: "lamDong",
    label: "Lâm Đồng",
    shortLabel: "Kho LĐ",
    defaultCustomerName: "Mẹ Nguyệt",
    legacyKeys: [],
  },
];

function getWarehouses() {
  return WAREHOUSES;
}

// Unoptimized (current implementation in useMemo)
function finalWarehouseTabsCurrent() {
    const warehouses = getWarehouses();
    const hasAll = warehouses.some((w) => w.key === "all");

    const tabs = new Array(
      hasAll ? warehouses.length : warehouses.length + 1,
    );
    let offset = 0;

    if (!hasAll) {
      tabs[0] = { key: "all", label: "Tất cả" };
      offset = 1;
    }

    for (let i = 0; i < warehouses.length; i++) {
      const w = warehouses[i];
      tabs[i + offset] = { key: w.key, label: w.label };
    }

    return tabs;
}

// Optimized implementation
// Cấu hình kho mặc định (nếu không được cung cấp)
// Tối ưu hóa: Khởi tạo tĩnh mảng tabs một lần để tránh tái cấp phát bộ nhớ.
const DEFAULT_WAREHOUSE_TABS = (() => {
  const warehouses = getWarehouses();
  const hasAll = warehouses.some((w) => w.key === "all");

  const tabs = new Array(
    hasAll ? warehouses.length : warehouses.length + 1,
  );
  let offset = 0;

  if (!hasAll) {
    tabs[0] = { key: "all", label: "Tất cả" };
    offset = 1;
  }

  for (let i = 0; i < warehouses.length; i++) {
    const w = warehouses[i];
    tabs[i + offset] = { key: w.key, label: w.label };
  }

  return tabs;
})();

function finalWarehouseTabsOptimized() {
    return DEFAULT_WAREHOUSE_TABS;
}


const start1 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  finalWarehouseTabsCurrent();
}
const end1 = performance.now();
const time1 = end1 - start1;

const start2 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  finalWarehouseTabsOptimized();
}
const end2 = performance.now();
const time2 = end2 - start2;

console.log(`Current: ${time1.toFixed(2)}ms`);
console.log(`Optimized: ${time2.toFixed(2)}ms`);
console.log(`Improvement: ${(((time1) - (time2)) / (time1) * 100).toFixed(2)}%`);
