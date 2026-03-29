const { performance } = require('perf_hooks');

// Mock data
const paidOrders = Array.from({ length: 10000 }, (_, i) => ({
  id: `order-${i}`,
  date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
  total: 500000 + Math.random() * 1000000,
  shippingFee: 30000,
  items: Array.from({ length: 5 }, (_, j) => ({
    productId: `prod-${j}`,
    price: 100000 + Math.random() * 200000,
    cost: 80000,
    quantity: 1 + Math.floor(Math.random() * 3)
  }))
}));

const costMap = new Map();
for (let i = 0; i < 100; i++) {
  costMap.set(`prod-${i}`, 80000);
}

const rangeStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
const rangeEndDate = new Date();

// Original calcStats
const calcStatsOriginal = (rangeStartDate, rangeEndDate) => {
  const rangeOrders = paidOrders.filter((order) => {
    const orderDate = new Date(order.date);
    return orderDate >= rangeStartDate && orderDate <= rangeEndDate;
  });

  const revenue = rangeOrders.reduce((sum, order) => sum + order.total, 0);
  const profit = rangeOrders.reduce((sum, order) => {
    const orderProfit = order.items.reduce((itemSum, item) => {
      const cost = Number.isFinite(item.cost)
        ? item.cost
        : costMap.get(item.productId) || 0;
      return itemSum + (item.price - cost) * item.quantity;
    }, 0);
    const shippingFee = order.shippingFee || 0;
    return sum + orderProfit - shippingFee;
  }, 0);

  return { revenue, profit, count: rangeOrders.length };
};

// Optimized calcStats
const calcStatsOptimized = (rangeStartDate, rangeEndDate) => {
  let revenue = 0;
  let profit = 0;
  let count = 0;
  const startMs = rangeStartDate.getTime();
  const endMs = rangeEndDate.getTime();

  for (const order of paidOrders) {
    const orderTime = Date.parse(order.date);

    if (orderTime >= startMs && orderTime <= endMs) {
      count++;
      revenue += order.total;

      let orderProfit = 0;
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          const cost = Number.isFinite(item.cost)
            ? item.cost
            : costMap.get(item.productId) || 0;
          orderProfit += (item.price - cost) * item.quantity;
        }
      }

      const shippingFee = order.shippingFee || 0;
      profit += orderProfit - shippingFee;
    }
  }

  return { revenue, profit, count };
};

// Warmup
for (let i = 0; i < 10; i++) {
  calcStatsOriginal(rangeStartDate, rangeEndDate);
  calcStatsOptimized(rangeStartDate, rangeEndDate);
}

// Benchmark
const iterations = 100;

const startOriginal = performance.now();
for (let i = 0; i < iterations; i++) {
  calcStatsOriginal(rangeStartDate, rangeEndDate);
}
const endOriginal = performance.now();
const timeOriginal = endOriginal - startOriginal;

const startOptimized = performance.now();
for (let i = 0; i < iterations; i++) {
  calcStatsOptimized(rangeStartDate, rangeEndDate);
}
const endOptimized = performance.now();
const timeOptimized = endOptimized - startOptimized;

console.log(`Original: ${timeOriginal.toFixed(2)} ms`);
console.log(`Optimized: ${timeOptimized.toFixed(2)} ms`);
console.log(`Improvement: ${((timeOriginal - timeOptimized) / timeOriginal * 100).toFixed(2)}% faster`);
