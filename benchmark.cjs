const { performance } = require('perf_hooks');

const TOTAL_ORDERS = 10000;
const SELECTED_ORDERS = 5000;
const ITERATIONS = 1000;

// Setup mock data
const allOrderIds = Array.from({ length: TOTAL_ORDERS }, (_, i) => `order_${i}`);
const existingOrderIds = new Set(allOrderIds);

const initialSelectedIds = new Set(
  allOrderIds.slice(0, SELECTED_ORDERS).concat(
    Array.from({ length: 500 }, (_, i) => `deleted_order_${i}`)
  )
);

const orderIdToToggle = `order_${SELECTED_ORDERS + 1}`;

function testOriginal() {
  const prev = initialSelectedIds;
  const order = { id: orderIdToToggle };

  const next = new Set(
    Array.from(prev).filter((id) => existingOrderIds.has(id))
  );
  if (next.has(order.id)) {
    next.delete(order.id);
  } else {
    next.add(order.id);
  }
  return next;
}

function testOptimized() {
  const prev = initialSelectedIds;
  const order = { id: orderIdToToggle };

  const next = new Set();
  for (const id of prev) {
    if (existingOrderIds.has(id)) {
      next.add(id);
    }
  }

  if (next.has(order.id)) {
    next.delete(order.id);
  } else {
    next.add(order.id);
  }
  return next;
}

// Warmup
for (let i = 0; i < 100; i++) {
  testOriginal();
  testOptimized();
}

console.log(`Running benchmark with ${ITERATIONS} iterations, ${TOTAL_ORDERS} total orders, ${SELECTED_ORDERS} selected orders...`);

// Benchmark Original
let start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  testOriginal();
}
let end = performance.now();
const originalTime = end - start;
console.log(`Original Time: ${originalTime.toFixed(2)} ms`);

// Benchmark Optimized
start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  testOptimized();
}
end = performance.now();
const optimizedTime = end - start;
console.log(`Optimized Time: ${optimizedTime.toFixed(2)} ms`);

console.log(`Improvement: ${((originalTime - optimizedTime) / originalTime * 100).toFixed(2)}% faster`);
console.log(`Speedup multiplier: ${(originalTime / optimizedTime).toFixed(2)}x`);
