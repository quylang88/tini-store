const stockByWarehouse = {
  vinhPhuc: 10,
  lamDong: 5,
  haNoi: 15,
  hoChiMinh: 20
};

// Original reduce logic
const reduceResult = Object.values(stockByWarehouse).reduce((sum, val) => sum + val, 0);

// New for...in logic
let forInResult = 0;
for (const key in stockByWarehouse) {
  if (Object.prototype.hasOwnProperty.call(stockByWarehouse, key)) {
    forInResult += stockByWarehouse[key];
  }
}

console.log('--- Test Object.values().reduce() vs for...in ---');
console.log('Original Reduce result:', reduceResult);
console.log('New for...in result:', forInResult);
console.log('Matches:', reduceResult === forInResult ? '✅ YES' : '❌ NO');
console.log('');

// Test adjustedStock logic
const initialStock = { vinhPhuc: 0, lamDong: 0 };
const nextLots = [
  { warehouse: 'vinhPhuc', quantity: '5' },
  { warehouse: 'lamDong', quantity: 10 },
  { warehouse: 'vinhPhuc', quantity: 15 }
];

const resolveWarehouseKey = key => key;
const defaultWarehouseKey = 'vinhPhuc';

// Original object spreading reduce logic
const reduceAdjustedStock = nextLots.reduce(
  (acc, lot) => {
    const nextWarehouse =
      resolveWarehouseKey(lot.warehouse) || defaultWarehouseKey;
    const lotQty = Number(lot.quantity) || 0;
    return {
      ...acc,
      [nextWarehouse]: (acc[nextWarehouse] || 0) + lotQty,
    };
  },
  { ...initialStock },
);

// New for...of with mutation logic
const forOfAdjustedStock = { ...initialStock };
for (const lot of nextLots) {
  const nextWarehouse =
    resolveWarehouseKey(lot.warehouse) || defaultWarehouseKey;
  const lotQty = Number(lot.quantity) || 0;
  forOfAdjustedStock[nextWarehouse] = (forOfAdjustedStock[nextWarehouse] || 0) + lotQty;
}

console.log('--- Test {...acc} reduce vs for...of mutation ---');
console.log('Original AdjustedStock:', reduceAdjustedStock);
console.log('New AdjustedStock:', forOfAdjustedStock);
console.log('Matches:', JSON.stringify(reduceAdjustedStock) === JSON.stringify(forOfAdjustedStock) ? '✅ YES' : '❌ NO');
