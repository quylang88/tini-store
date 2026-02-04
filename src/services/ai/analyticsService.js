/**
 * analyticsService.js
 * Trung tâm xử lý logic tính toán, phân tích số liệu kinh doanh cho AI.
 * (Tách biệt hoàn toàn khỏi logic format string của contextBuilder)
 */

// --- 1. PHÂN TÍCH TÀI CHÍNH TỔNG QUAN ---
export const analyzeBusinessStats = (products = [], orders = []) => {
  // TỔNG VỐN NHẬP (Lũy kế) & VỐN TỒN KHO (Hiện tại)
  // Gộp vòng lặp để tối ưu hiệu năng (tránh duyệt mảng products và purchaseLots 2 lần)
  let totalImportCapital = 0;
  let totalInventoryCapital = 0;

  for (const product of products) {
    if (!product.purchaseLots || !Array.isArray(product.purchaseLots)) {
      continue;
    }

    for (const lot of product.purchaseLots) {
      const cost = Number(lot.cost) || 0;
      const shippingPerUnit = Number(lot.shipping?.perUnitVnd) || 0;
      const unitCost = cost + shippingPerUnit;

      // Tính cho vốn nhập (dựa trên số lượng nhập ban đầu)
      const originalQty =
        Number(lot.originalQuantity) || Number(lot.quantity) || 0;
      totalImportCapital += unitCost * originalQty;

      // Tính cho vốn tồn (dựa trên số lượng hiện tại)
      const currentQty = Number(lot.quantity) || 0;
      totalInventoryCapital += unitCost * currentQty;
    }
  }

  // PHÂN TÍCH ĐƠN HÀNG CHƯA THANH TOÁN
  const unpaidOrders = orders.filter(
    (o) => o.status !== "paid" && o.status !== "cancelled",
  );
  const unpaidOrderCount = unpaidOrders.length;

  let totalUnpaidRevenue = 0;
  let totalUnpaidCapital = 0;
  let totalUnpaidProfit = 0;

  unpaidOrders.forEach((order) => {
    totalUnpaidRevenue += Number(order.total) || 0;

    let orderCost = 0;
    let orderProfit = 0;

    if (Array.isArray(order.items)) {
      const itemsProfit = order.items.reduce((sum, item) => {
        const itemQty = Number(item.quantity) || 0;
        const itemPrice = Number(item.price) || 0;
        const itemCost = Number(item.cost) || 0;

        orderCost += itemCost * itemQty;
        return sum + (itemPrice - itemCost) * itemQty;
      }, 0);

      orderProfit = itemsProfit - (Number(order.shippingFee) || 0);
    }

    totalUnpaidCapital += orderCost;
    totalUnpaidProfit += orderProfit;
  });

  return {
    totalImportCapital,
    totalInventoryCapital,
    unpaidOrderCount,
    totalUnpaidRevenue,
    totalUnpaidCapital,
    totalUnpaidProfit,
    unpaidOrders,
  };
};

// --- 2. PHÂN TÍCH DOANH SỐ THÁNG HIỆN TẠI ---
export const analyzeMonthlySales = (orders = []) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthOrders = orders.filter((o) => {
    const d = new Date(o.date);
    return (
      d.getMonth() === currentMonth &&
      d.getFullYear() === currentYear &&
      o.status !== "cancelled"
    );
  });

  const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrdersMonth = thisMonthOrders.length;

  return {
    thisMonthRevenue,
    totalOrdersMonth,
    currentMonth: currentMonth + 1,
    currentYear,
  };
};

// --- 3. PHÂN TÍCH TỒN KHO CẦN NHẬP (RESTOCK) ---
export const analyzeInventory = (products = [], orders = []) => {
  // Tính Sales Map (30 ngày gần nhất)
  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

  const recentOrders = orders.filter(
    (o) => new Date(o.date) >= oneMonthAgo && o.status !== "cancelled",
  );

  const salesMap = {};
  recentOrders.forEach((order) => {
    if (Array.isArray(order.items)) {
      order.items.forEach((item) => {
        salesMap[item.name] = (salesMap[item.name] || 0) + item.quantity;
      });
    }
  });

  // Tìm sản phẩm sắp hết (<= 5) VÀ có bán được
  const urgentProducts = products.filter((p) => {
    const soldQty = salesMap[p.name] || 0;
    return p.stock <= 5 && soldQty > 0;
  });

  // Trả về danh sách kèm thông tin bán hàng để contextBuilder format
  return urgentProducts.map((p) => ({
    name: p.name,
    stock: p.stock,
    soldLastMonth: salesMap[p.name] || 0,
  }));
};
