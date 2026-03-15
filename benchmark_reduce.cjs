const items = Array.from({ length: 50 }, (_, i) => ({
  price: Math.random() * 1000,
  cost: Math.random() * 500,
  quantity: Math.floor(Math.random() * 10) + 1,
}));

function benchmark(name, fn, iterations = 1000000) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  console.log(`${name}: ${(end - start).toFixed(2)}ms`);
}

benchmark('reduce', () => {
  return items.reduce((sum, item) => {
    const cost = item.cost || 0;
    return sum + (item.price - cost) * item.quantity;
  }, 0) - 100;
});

benchmark('for...of', () => {
  let itemsProfit = 0;
  for (const item of items) {
    const cost = item.cost || 0;
    itemsProfit += (item.price - cost) * item.quantity;
  }
  return itemsProfit - 100;
});

benchmark('reduce 2 loops (OrderDetailModal)', () => {
  const estimatedProfit = items.reduce((sum, item) => {
    const cost = item.cost || 0;
    return sum + (item.price - cost) * item.quantity;
  }, 0) - 100;

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  return { estimatedProfit, totalQuantity };
});

benchmark('for...of 1 loop (OrderDetailModal)', () => {
  let itemsProfit = 0;
  let totalQuantity = 0;
  for (const item of items) {
    const cost = item.cost || 0;
    itemsProfit += (item.price - cost) * item.quantity;
    totalQuantity += item.quantity;
  }
  return { estimatedProfit: itemsProfit - 100, totalQuantity };
});
