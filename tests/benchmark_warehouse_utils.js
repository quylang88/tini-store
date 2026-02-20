import {
  getSpecificWarehouseStock,
  getTotalStock
} from "../src/utils/inventory/warehouseUtils.js";

// Mock data
const product1 = {
  id: "p1",
  stockByWarehouse: {
    vinhPhuc: 10,
    lamDong: 5
  }
};

const product2 = {
  id: "p2",
  stockByWarehouse: {
    vinhPhuc: "20", // String
    lamDong: 0
  }
};

const product3 = {
  id: "p3",
  stockByWarehouse: {
    unknownKey: 100, // Should be ignored or preserved?
    vinhPhuc: 5
  }
};

const product4 = {
    id: "p4",
    // No stockByWarehouse
};

// Verification
console.log("Verifying correctness...");

const assert = (actual, expected, msg) => {
  if (actual !== expected) {
    console.error(`FAIL: ${msg}. Expected ${expected}, got ${actual}`);
    throw new Error(`FAIL: ${msg}`);
  }
};

assert(getSpecificWarehouseStock(product1, "vinhPhuc"), 10, "p1 vinhPhuc");
assert(getSpecificWarehouseStock(product1, "lamDong"), 5, "p1 lamDong");
assert(getTotalStock(product1), 15, "p1 total");

assert(getSpecificWarehouseStock(product2, "vinhPhuc"), 20, "p2 vinhPhuc");
assert(getTotalStock(product2), 20, "p2 total");

// Unknown key logic:
// normalizeWarehouseStock preserves unknown keys if they map to themselves via resolveWarehouseKey.
// resolveWarehouseKey returns key if not found in map.
// So unknownKey remains.
// getTotalStock sums ALL keys in stockByWarehouse.
// So 100 + 5 = 105.
assert(getTotalStock(product3), 105, "p3 total");
assert(getSpecificWarehouseStock(product3, "vinhPhuc"), 5, "p3 vinhPhuc");
// Note: getSpecificWarehouseStock checks if resolveWarehouseKey(sourceKey) === targetKey.
// If targetKey is "unknownKey", resolveWarehouseKey("unknownKey") is "unknownKey".
// So it matches.
assert(getSpecificWarehouseStock(product3, "unknownKey"), 100, "p3 unknownKey");

assert(getTotalStock(product4), 0, "p4 total");

console.log("All assertions passed.");

// Benchmark
console.log("Benchmarking...");
const iterations = 1000000;
const products = [product1, product2, product3, product4];

const start = performance.now();

for (let i = 0; i < iterations; i++) {
  const p = products[i % products.length];
  getTotalStock(p);
  getSpecificWarehouseStock(p, "vinhPhuc");
  getSpecificWarehouseStock(p, "lamDong");
}

const end = performance.now();
console.log(`Execution time for ${iterations} iterations: ${(end - start).toFixed(2)}ms`);
