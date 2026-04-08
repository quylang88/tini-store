const fs = require('fs');
const content = fs.readFileSync('src/screens/dashboard/StatsDetail.jsx', 'utf8');

if (content.includes('.reduce((sum, order) => sum + order.total, 0)')) {
  console.error("Error: reduce call still exists");
  process.exit(1);
}

if (!content.includes('const orderDateCache = new WeakMap();')) {
  console.error("Error: WeakMap not found");
  process.exit(1);
}

if (!content.includes('for (const order of paidOrders)')) {
  console.error("Error: for...of loop not found");
  process.exit(1);
}

console.log("AST structural verification passed.");
