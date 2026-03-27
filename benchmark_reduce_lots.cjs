const nextLots = Array.from({ length: 100 }, (_, i) => ({
  warehouse: i % 2 === 0 ? "vinhPhuc" : "lamDong",
  quantity: 5
}));

const initialStock = { vinhPhuc: 0, lamDong: 0 };

console.time('.reduce() with object spreading');
for (let i = 0; i < 10000; i++) {
  const result = nextLots.reduce(
    (acc, lot) => {
      const nextWarehouse = lot.warehouse;
      const lotQty = Number(lot.quantity) || 0;
      return {
        ...acc,
        [nextWarehouse]: (acc[nextWarehouse] || 0) + lotQty,
      };
    },
    { ...initialStock }
  );
}
console.timeEnd('.reduce() with object spreading');

console.time('for...of loop with mutation');
for (let i = 0; i < 10000; i++) {
  const adjustedStock = { ...initialStock };
  for (const lot of nextLots) {
    const nextWarehouse = lot.warehouse;
    const lotQty = Number(lot.quantity) || 0;
    adjustedStock[nextWarehouse] = (adjustedStock[nextWarehouse] || 0) + lotQty;
  }
}
console.timeEnd('for...of loop with mutation');
