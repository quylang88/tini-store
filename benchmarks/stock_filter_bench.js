
import { performance } from 'perf_hooks';

// --- Mocks & Utilities from src/utils/inventory/warehouseUtils.js ---

const WAREHOUSES = [
  { key: "vinhPhuc", label: "Vĩnh Phúc", isDefault: true },
  { key: "lamDong", label: "Lâm Đồng" },
  { key: "khoTong", label: "Kho Tổng" },
  { key: "khoHcm", label: "Kho HCM" },
];

const WAREHOUSE_KEY_MAP = (() => {
  const map = {};
  WAREHOUSES.forEach((w) => {
    map[w.key] = w.key;
  });
  return map;
})();

const resolveWarehouseKey = (key) => {
  if (!key) return null;
  return WAREHOUSE_KEY_MAP[key] || key;
};

const getSpecificWarehouseStock = (product, targetWarehouseKey) => {
  if (!product.stockByWarehouse || !targetWarehouseKey) return 0;

  let total = 0;
  for (const sourceKey in product.stockByWarehouse) {
    if (Object.prototype.hasOwnProperty.call(product.stockByWarehouse, sourceKey)) {
      if (resolveWarehouseKey(sourceKey) === targetWarehouseKey) {
        total += Number(product.stockByWarehouse[sourceKey]) || 0;
      }
    }
  }
  return total;
};

const getTotalStock = (product = {}) => {
  if (!product.stockByWarehouse) return 0;
  let total = 0;
  for (const key in product.stockByWarehouse) {
    if (Object.prototype.hasOwnProperty.call(product.stockByWarehouse, key)) {
      total += Number(product.stockByWarehouse[key]) || 0;
    }
  }
  return total;
};

// --- Data Generation ---

const generateProducts = (count) => {
  const products = [];
  for (let i = 0; i < count; i++) {
    products.push({
      id: `prod_${i}`,
      name: `Product ${i}`,
      stockByWarehouse: {
        vinhPhuc: Math.floor(Math.random() * 100),
        lamDong: Math.floor(Math.random() * 100),
        khoTong: Math.floor(Math.random() * 50),
        khoHcm: Math.floor(Math.random() * 50),
        other: Math.floor(Math.random() * 10),
      }
    });
  }
  return products;
};

// --- Baseline Logic ---
const filterProductsBaseline = (products, selectedWarehouse) => {
  const resolvedKey = resolveWarehouseKey(selectedWarehouse);
  return products.filter(product => {
    let baseStock = 0;
    if (selectedWarehouse === "all") {
      baseStock = getTotalStock(product);
    } else {
      baseStock = getSpecificWarehouseStock(product, resolvedKey);
    }
    return baseStock > 0;
  });
};

const runBenchmark = () => {
  const PRODUCT_COUNT = 50000;
  const FILTER_PASSES = 50;

  const products = generateProducts(PRODUCT_COUNT);
  const selectedWarehouse = "vinhPhuc";

  console.log(`Running benchmark with ${PRODUCT_COUNT} products.`);

  // --- Baseline Measurement ---
  const startBaseline = performance.now();
  for (let i = 0; i < FILTER_PASSES; i++) {
     filterProductsBaseline(products, selectedWarehouse);
  }
  const endBaseline = performance.now();
  const baselineTotal = endBaseline - startBaseline;
  console.log(`Baseline (Total for ${FILTER_PASSES} passes): ${baselineTotal.toFixed(2)} ms`);
  console.log(`Baseline (Avg per pass): ${(baselineTotal / FILTER_PASSES).toFixed(4)} ms`);

  // --- Optimized Setup Cost ---
  const startSetup = performance.now();
  const resolvedKey = resolveWarehouseKey(selectedWarehouse);
  const isAll = selectedWarehouse === 'all';
  const stockMap = new Map();
  for (const product of products) {
    let stock = 0;
    if (isAll) {
      stock = getTotalStock(product);
    } else {
      stock = getSpecificWarehouseStock(product, resolvedKey);
    }
    stockMap.set(product.id, stock);
  }
  const endSetup = performance.now();
  const setupCost = endSetup - startSetup;
  console.log(`Optimized Setup Cost (Map Creation): ${setupCost.toFixed(2)} ms`);

  // --- Optimized Filter Cost ---
  const startOptimizedFilter = performance.now();
  for (let i = 0; i < FILTER_PASSES; i++) {
      products.filter(product => {
        const availableStock = stockMap.get(product.id);
        return availableStock > 0;
      });
  }
  const endOptimizedFilter = performance.now();
  const optimizedTotal = endOptimizedFilter - startOptimizedFilter;

  console.log(`Optimized Filter (Total for ${FILTER_PASSES} passes): ${optimizedTotal.toFixed(2)} ms`);
  console.log(`Optimized Filter (Avg per pass): ${(optimizedTotal / FILTER_PASSES).toFixed(4)} ms`);

  // --- Analysis ---
  console.log(`\nAnalysis:`);
  console.log(`Latency Improvement per search keystroke: ${(baselineTotal / FILTER_PASSES) - (optimizedTotal / FILTER_PASSES)} ms`);
  console.log(`Break-even point (passes): ${(setupCost / ((baselineTotal / FILTER_PASSES) - (optimizedTotal / FILTER_PASSES))).toFixed(2)}`);
};

runBenchmark();
