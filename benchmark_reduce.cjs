const stockByWarehouse = {
  vinhPhuc: 10,
  lamDong: 5,
  haNoi: 15,
  hoChiMinh: 20
};

function usingReduce(stock) {
  return Object.values(stock).reduce((sum, val) => sum + val, 0);
}

function usingForIn(stock) {
  let total = 0;
  for (const key in stock) {
    if (Object.prototype.hasOwnProperty.call(stock, key)) {
      total += Number(stock[key]) || 0;
    }
  }
  return total;
}

const iterations = 1000000;

console.time('Object.values().reduce');
for (let i = 0; i < iterations; i++) {
  usingReduce(stockByWarehouse);
}
console.timeEnd('Object.values().reduce');

console.time('for...in loop');
for (let i = 0; i < iterations; i++) {
  usingForIn(stockByWarehouse);
}
console.timeEnd('for...in loop');
