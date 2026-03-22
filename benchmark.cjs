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

// Unoptimized
function generateWarehouseTabs() {
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

// Optimized
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

function getOptimizedTabs() {
  return DEFAULT_WAREHOUSE_TABS;
}

console.log("Warming up...");
for (let i = 0; i < 100000; i++) {
  generateWarehouseTabs();
  getOptimizedTabs();
}

console.log("Benchmarking unoptimized...");
const start1 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  generateWarehouseTabs();
}
const end1 = performance.now();
console.log(`Unoptimized: ${(end1 - start1).toFixed(2)}ms`);

console.log("Benchmarking optimized...");
const start2 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  getOptimizedTabs();
}
const end2 = performance.now();
console.log(`Optimized: ${(end2 - start2).toFixed(2)}ms`);

console.log(`Improvement: ${(((end1 - start1) - (end2 - start2)) / (end1 - start1) * 100).toFixed(2)}%`);
