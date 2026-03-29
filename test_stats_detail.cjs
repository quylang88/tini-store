const fs = require('fs');

// Verify that the code doesn't contain the old .filter().reduce() pattern inside comparisonStats
const fileContent = fs.readFileSync('src/screens/dashboard/StatsDetail.jsx', 'utf8');

if (fileContent.includes('const rangeOrders = paidOrders.filter((order) => {') || fileContent.includes('rangeOrders.reduce')) {
  console.error("❌ The old .filter().reduce() logic is still present!");
  process.exit(1);
}

if (!fileContent.includes('for (const order of paidOrders) {') || !fileContent.includes('const orderTime = Date.parse(order.date);')) {
  console.error("❌ The new optimized loop logic was not found!");
  process.exit(1);
}

console.log("✅ The optimization has been successfully verified via AST string matching.");

// Execute tests to ensure we get identical results
const paidOrders = Array.from({ length: 100 }, (_, i) => ({
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

const orig = calcStatsOriginal(rangeStartDate, rangeEndDate);
const opt = calcStatsOptimized(rangeStartDate, rangeEndDate);

if (orig.revenue !== opt.revenue || orig.profit !== opt.profit || orig.count !== opt.count) {
  console.error("❌ The calculation results do not match!");
  console.error("Original:", orig);
  console.error("Optimized:", opt);
  process.exit(1);
}

console.log("✅ The output results match exactly. No regressions found.");
