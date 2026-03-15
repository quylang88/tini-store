const assert = require('assert');

// Hàm mô phỏng logic cũ (reduce)
function oldOrderListItem(order) {
    return order.items.reduce((sum, item) => {
        const cost = item.cost || 0;
        return sum + (item.price - cost) * item.quantity;
    }, 0) - (order.shippingFee || 0);
}

// Hàm mô phỏng logic mới (for...of)
function newOrderListItem(order) {
    let itemsProfit = 0;
    for (const item of order.items) {
      const cost = item.cost || 0;
      itemsProfit += (item.price - cost) * item.quantity;
    }
    return itemsProfit - (order.shippingFee || 0);
}

function oldOrderDetailModal(cachedOrder) {
    const estimatedProfit = cachedOrder.items.reduce((sum, item) => {
      const cost = item.cost || 0;
      return sum + (item.price - cost) * item.quantity;
    }, 0) - (cachedOrder.shippingFee || 0);

    const totalQuantity = cachedOrder.items.reduce(
        (sum, item) => sum + item.quantity,
        0,
    );
    return { estimatedProfit, totalQuantity };
}

function newOrderDetailModal(cachedOrder) {
    let itemsProfit = 0;
    let totalQuantity = 0;
    for (const item of cachedOrder.items) {
        const cost = item.cost || 0;
        itemsProfit += (item.price - cost) * item.quantity;
        totalQuantity += item.quantity;
    }
    const estimatedProfit = itemsProfit - (cachedOrder.shippingFee || 0);
    return { estimatedProfit, totalQuantity };
}


const testOrder = {
    shippingFee: 15,
    items: [
        { price: 100, cost: 50, quantity: 2 }, // profit: 100, q: 2
        { price: 200, cost: undefined, quantity: 1 }, // profit: 200, q: 1
        { price: 50, cost: 60, quantity: 5 } // profit: -50, q: 5
    ]
};
// total profit = 100 + 200 - 50 = 250
// shipping = 15 => final profit = 235
// total q = 8

console.log("Testing OrderListItem logic...");
assert.strictEqual(oldOrderListItem(testOrder), newOrderListItem(testOrder));
console.log("OrderListItem logic is consistent.");

console.log("Testing OrderDetailModal logic...");
const oldModalResult = oldOrderDetailModal(testOrder);
const newModalResult = newOrderDetailModal(testOrder);
assert.deepStrictEqual(oldModalResult, newModalResult);
console.log("OrderDetailModal logic is consistent.");
