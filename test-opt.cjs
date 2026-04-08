const { performance } = require('perf_hooks');

const orderDateCache = new WeakMap();

// Mock data
const mockProducts = Array.from({ length: 100 }, (_, i) => ({ id: `p${i}` }));
const mockOrders = Array.from({ length: 5000 }, (_, i) => {
  return {
    id: `o${i}`,
    date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
    total: 100000,
    shippingFee: 10000,
    items: [
      { productId: `p${i % 100}`, price: 50000, cost: 30000, quantity: 2 },
      { productId: `p${(i + 1) % 100}`, price: 20000, cost: 10000, quantity: 1 }
    ]
  };
});

const paidOrders = mockOrders;
const costMap = new Map(mockProducts.map(p => [p.id, 20000]));

function calcStatsOld(rangeStartDate, rangeEndDate) {
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
}

function calcStatsNew(rangeStartDate, rangeEndDate) {
  let revenue = 0;
  let profit = 0;
  let count = 0;
  const startMs = rangeStartDate.getTime();
  const endMs = rangeEndDate.getTime();

  for (const order of paidOrders) {
    let orderTime = orderDateCache.get(order);
    if (orderTime === undefined) {
      orderTime = new Date(order.date).getTime();
      orderDateCache.set(order, orderTime);
    }

    if (orderTime >= startMs && orderTime <= endMs) {
      count++;
      revenue += order.total;

      let orderProfit = 0;
      for (const item of order.items) {
        const cost = Number.isFinite(item.cost)
          ? item.cost
          : costMap.get(item.productId) || 0;
        orderProfit += (item.price - cost) * item.quantity;
      }
      const shippingFee = order.shippingFee || 0;
      profit += orderProfit - shippingFee;
    }
  }

  return { revenue, profit, count };
}

const rangeStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
const rangeEnd = new Date();

// Warm up
calcStatsOld(rangeStart, rangeEnd);
calcStatsNew(rangeStart, rangeEnd);

let t0 = performance.now();
for(let i=0; i<100; i++) {
    calcStatsOld(rangeStart, rangeEnd);
}
let t1 = performance.now();
console.log(`Old: ${t1 - t0}ms`);

let t2 = performance.now();
for(let i=0; i<100; i++) {
    calcStatsNew(rangeStart, rangeEnd);
}
let t3 = performance.now();
console.log(`New: ${t3 - t2}ms`);

console.log("Old Result", calcStatsOld(rangeStart, rangeEnd));
console.log("New Result", calcStatsNew(rangeStart, rangeEnd));
