const fs = require('fs');
const assert = require('assert');

// 1. Load the original content to compare logic visually
const content = fs.readFileSync('src/hooks/dashboard/useDashboardLogic.js', 'utf-8');

// The file exports a React hook. Instead of mocking the entire React environment,
// let's extract the core logic to verify the mathematics.

function testCalculations() {
  const filteredPaidOrders = [
    {
      total: 100,
      shippingFee: 10,
      items: [
        { productId: 'p1', name: 'Product 1', price: 50, quantity: 2, cost: 20 }, // profit: (50-20)*2 = 60
      ]
    },
    {
      total: 200,
      shippingFee: 0,
      items: [
        { productId: 'p2', name: 'Product 2', price: 100, quantity: 1, cost: 40 }, // profit: 60
        { productId: 'p1', name: 'Product 1', price: 50, quantity: 2 }, // cost fallback. profit: (50-30)*2 = 40. Note: cost 30 from costMap
      ]
    }
  ];

  const costMap = new Map([
    ['p1', 30],
    ['p2', 50]
  ]);

  const productMeta = new Map([
    ['p1', { name: 'P1', image: 'i1' }],
    ['p2', { name: 'P2', image: 'i2' }]
  ]);

  // Original Logic Equivalent
  let origTotalRevenue = filteredPaidOrders.reduce((sum, order) => sum + order.total, 0);

  let origTotalProfit = filteredPaidOrders.reduce((sum, order) => {
    const orderProfit = order.items.reduce((itemSum, item) => {
      const cost = Number.isFinite(item.cost) ? item.cost : costMap.get(item.productId) || 0;
      return itemSum + (item.price - cost) * item.quantity;
    }, 0);
    const shippingFee = order.shippingFee || 0;
    return sum + orderProfit - shippingFee;
  }, 0);

  const origStats = new Map();
  filteredPaidOrders.forEach((order) => {
    order.items.forEach((item) => {
      const product = productMeta.get(item.productId);
      const key = item.productId || item.name;
      if (!origStats.has(key)) {
        origStats.set(key, {
          id: item.productId,
          name: product?.name || item.name || "Sản phẩm khác",
          image: product?.image || "",
          quantity: 0,
          profit: 0,
        });
      }
      const entry = origStats.get(key);
      const cost = Number.isFinite(item.cost)
        ? item.cost
        : costMap.get(item.productId) || 0;
      entry.quantity += item.quantity;
      entry.profit += (item.price - cost) * item.quantity;
    });
  });
  const origProductStats = Array.from(origStats.values());

  // Refactored Logic Equivalent
  let newTotalRevenue = 0;
  let newTotalProfit = 0;
  const newStats = new Map();

  for (const order of filteredPaidOrders) {
    newTotalRevenue += order.total;

    let orderProfit = 0;
    for (const item of order.items) {
      const cost = Number.isFinite(item.cost)
        ? item.cost
        : costMap.get(item.productId) || 0;

      const itemProfit = (item.price - cost) * item.quantity;
      orderProfit += itemProfit;

      const product = productMeta.get(item.productId);
      const key = item.productId || item.name;

      if (!newStats.has(key)) {
        newStats.set(key, {
          id: item.productId,
          name: product?.name || item.name || "Sản phẩm khác",
          image: product?.image || "",
          quantity: 0,
          profit: 0,
        });
      }
      const entry = newStats.get(key);
      entry.quantity += item.quantity;
      entry.profit += itemProfit;
    }

    const shippingFee = order.shippingFee || 0;
    newTotalProfit += orderProfit - shippingFee;
  }
  const newProductStats = Array.from(newStats.values());


  // Assertions
  assert.strictEqual(origTotalRevenue, newTotalRevenue, 'Total revenue mismatch');
  assert.strictEqual(origTotalProfit, newTotalProfit, 'Total profit mismatch');
  assert.deepStrictEqual(origProductStats, newProductStats, 'Product stats mismatch');

  console.log('All tests passed successfully!');
  console.log({
      revenue: newTotalRevenue,
      profit: newTotalProfit,
      stats: newProductStats
  });
}

testCalculations();
