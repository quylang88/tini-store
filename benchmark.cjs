const { performance } = require('perf_hooks');

const NUM_PRODUCTS = 10000;
const NUM_ITEMS = 100;

const products = Array.from({ length: NUM_PRODUCTS }, (_, i) => ({ id: `prod-${i}`, name: `Product ${i}` }));
const items = Array.from({ length: NUM_ITEMS }, (_, i) => ({
  productId: `prod-${Math.floor(Math.random() * NUM_PRODUCTS)}`,
  name: `Item ${i}`,
  quantity: 1,
  price: 100
}));

function baseline() {
  const start = performance.now();
  const result = items.map((item) => {
    const product = products.find(
      (p) => p.id === item.productId || p.id === item.id,
    );
    return {
      name: product ? product.name : item.name,
      quantity: item.quantity,
      price: item.price,
    };
  });
  const end = performance.now();
  return end - start;
}

function optimized() {
  const start = performance.now();
  const productMap = new Map();
  for (const p of products) {
    productMap.set(p.id, p);
  }

  const result = items.map((item) => {
    const product = productMap.get(item.productId) || productMap.get(item.id);
    return {
      name: product ? product.name : item.name,
      quantity: item.quantity,
      price: item.price,
    };
  });
  const end = performance.now();
  return end - start;
}

let baseTime = 0;
let optTime = 0;
const ITERATIONS = 100;

// warmup
for (let i=0; i<10; i++) {
  baseline();
  optimized();
}

for (let i = 0; i < ITERATIONS; i++) {
  baseTime += baseline();
  optTime += optimized();
}

console.log(`Baseline (products.find inside map): ${(baseTime / ITERATIONS).toFixed(4)} ms`);
console.log(`Optimized (Map lookup): ${(optTime / ITERATIONS).toFixed(4)} ms`);
console.log(`Speedup: ${(baseTime / optTime).toFixed(2)}x`);
