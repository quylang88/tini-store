const { performance } = require('perf_hooks');

const NUM_PRODUCTS = 5000;
const NUM_ITEMS = 50;

const products = Array.from({ length: NUM_PRODUCTS }, (_, i) => ({ id: `prod-${i}`, name: `Product ${i}` }));
const items = Array.from({ length: NUM_ITEMS }, (_, i) => ({
  productId: `prod-${Math.floor(Math.random() * NUM_PRODUCTS)}`,
  id: `item-${i}`,
  name: `Item ${i}`,
  quantity: 1,
  price: 100
}));

function baseline() {
  const start = performance.now();
  let result = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const product = products.find(
      (p) => p.id === item.productId || p.id === item.id,
    );
    result.push(product ? product.name : item.name);
  }
  const end = performance.now();
  return end - start;
}

function optimizedMap() {
  const start = performance.now();
  const productMap = new Map();
  if (products) {
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      productMap.set(p.id, p);
    }
  }

  let result = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const product = productMap.get(item.productId) || productMap.get(item.id);
    result.push(product ? product.name : item.name);
  }
  const end = performance.now();
  return end - start;
}

function optimizedMemo() {
  const start = performance.now();
  const productMap = React.useMemo(() => {
    const map = new Map();
    if (products) {
      for (const p of products) {
        map.set(p.id, p);
      }
    }
    return map;
  }, [products]);

  let result = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const product = productMap.get(item.productId) || productMap.get(item.id);
    result.push(product ? product.name : item.name);
  }
  const end = performance.now();
  return end - start;
}

let baseTime = 0;
let optMapTime = 0;
const ITERATIONS = 1000;

// warmup
for (let i=0; i<10; i++) {
  baseline();
  optimizedMap();
}

for (let i = 0; i < ITERATIONS; i++) {
  baseTime += baseline();
  optMapTime += optimizedMap();
}

console.log(`Baseline (products.find inside loop): ${(baseTime / ITERATIONS).toFixed(4)} ms`);
console.log(`Optimized (Map lookup): ${(optMapTime / ITERATIONS).toFixed(4)} ms`);
console.log(`Speedup (Map lookup): ${(baseTime / optMapTime).toFixed(2)}x`);
