/**
 * analyticsService.js
 * Trung tâm xử lý logic tính toán, phân tích số liệu kinh doanh cho AI.
 * (Tách biệt hoàn toàn khỏi logic format string của contextBuilder)
 */

// Cache riêng biệt cho product stats và order stats sử dụng WeakMap
// Giúp tối ưu hiệu năng: Nếu chỉ products thay đổi, không cần tính lại orders và ngược lại.
const productStatsCache = new WeakMap();
const orderStatsCache = new WeakMap();

// Cache cho analyzeMonthlySales: WeakMap<orders, { month, year, data }>
// Giúp tránh tính toán lại doanh thu tháng hiện tại khi user chat liên tục.
const salesCache = new WeakMap();

// Cache cho analyzeInventory: WeakMap<products, WeakMap<orders, { timestamp, data }>>
// Giúp tránh quét lại danh sách orders (O(N)) mỗi lần user chat để tìm hàng sắp hết.
// Có TTL 5 phút để xử lý cửa sổ thời gian "30 ngày gần nhất".
const inventoryCache = new WeakMap();
const INVENTORY_CACHE_TTL = 5 * 60 * 1000; // 5 phút

// Hàm helper tính toán product stats (totalImportCapital, totalInventoryCapital)
const calculateProductStats = (products) => {
  if (
    products &&
    typeof products === "object" &&
    productStatsCache.has(products)
  ) {
    return productStatsCache.get(products);
  }

  let totalImportCapital = 0;
  let totalInventoryCapital = 0;

  if (Array.isArray(products)) {
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
  }

  const result = { totalImportCapital, totalInventoryCapital };

  if (products && typeof products === "object") {
    productStatsCache.set(products, result);
  }

  return result;
};

// Hàm helper tính toán order stats (unpaidOrders, unpaidOrderCount, revenue/capital/profit)
const calculateOrderStats = (orders) => {
  if (orders && typeof orders === "object" && orderStatsCache.has(orders)) {
    return orderStatsCache.get(orders);
  }

  const unpaidOrders = Array.isArray(orders)
    ? orders.filter((o) => o.status !== "paid" && o.status !== "cancelled")
    : [];

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

  const result = {
    unpaidOrderCount,
    totalUnpaidRevenue,
    totalUnpaidCapital,
    totalUnpaidProfit,
    unpaidOrders,
  };

  if (orders && typeof orders === "object") {
    orderStatsCache.set(orders, result);
  }

  return result;
};

// --- 1. PHÂN TÍCH TÀI CHÍNH TỔNG QUAN ---
export const analyzeBusinessStats = (products = [], orders = []) => {
  // Tính toán độc lập và merge kết quả
  // Tối ưu hóa: Nếu products thay đổi nhưng orders giữ nguyên, ta chỉ tính lại products (và ngược lại).
  const productStats = calculateProductStats(products);
  const orderStats = calculateOrderStats(orders);

  return {
    ...productStats,
    ...orderStats,
  };
};

// --- 2. PHÂN TÍCH DOANH SỐ THÁNG HIỆN TẠI ---
export const analyzeMonthlySales = (orders = []) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Kiểm tra cache: Nếu danh sách đơn hàng không đổi (reference) và vẫn trong tháng/năm hiện tại
  // thì trả về kết quả cũ.
  if (orders && typeof orders === "object" && salesCache.has(orders)) {
    const cached = salesCache.get(orders);
    if (cached.month === currentMonth && cached.year === currentYear) {
      return cached.data;
    }
  }

  // Tối ưu hóa: Tính toán trước các mốc thời gian ISO để so sánh chuỗi
  // Thay vì new Date() trong vòng lặp (chậm ~145x), ta so sánh chuỗi ISO trực tiếp.
  // Lưu ý: new Date(year, month, 1) tạo ngày theo giờ địa phương (00:00:00 Local).
  // toISOString() chuyển về UTC, đúng chuẩn để so sánh với order.date (ISO UTC).
  const startOfMonth = new Date(currentYear, currentMonth, 1);
  const startOfNextMonth = new Date(currentYear, currentMonth + 1, 1);

  const startISO = startOfMonth.toISOString();
  const endISO = startOfNextMonth.toISOString();

  const thisMonthOrders = orders.filter((o) => {
    // So sánh chuỗi trực tiếp nhanh hơn rất nhiều
    return o.date >= startISO && o.date < endISO && o.status !== "cancelled";
  });

  const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrdersMonth = thisMonthOrders.length;

  const result = {
    thisMonthRevenue,
    totalOrdersMonth,
    currentMonth: currentMonth + 1,
    currentYear,
  };

  // Cập nhật cache
  if (orders && typeof orders === "object") {
    salesCache.set(orders, {
      month: currentMonth,
      year: currentYear,
      data: result,
    });
  }

  return result;
};

// --- 3. PHÂN TÍCH TỒN KHO CẦN NHẬP (RESTOCK) ---
export const analyzeInventory = (products = [], orders = []) => {
  // Kiểm tra cache
  const canCache =
    products &&
    typeof products === "object" &&
    orders &&
    typeof orders === "object";

  if (canCache) {
    const ordersMap = inventoryCache.get(products);
    if (ordersMap && ordersMap.has(orders)) {
      const cached = ordersMap.get(orders);
      // Chỉ dùng cache nếu chưa quá thời gian TTL (5 phút)
      // Vì "30 ngày gần nhất" là cửa sổ trượt, cache lâu quá sẽ sai số liệu.
      if (Date.now() - cached.timestamp < INVENTORY_CACHE_TTL) {
        return cached.data;
      }
    }
  }

  // Tính Sales Map (30 ngày gần nhất)
  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

  // Tối ưu hóa: Chuyển về ISO string để so sánh chuỗi
  const oneMonthAgoISO = oneMonthAgo.toISOString();

  const recentOrders = orders.filter(
    (o) => o.date >= oneMonthAgoISO && o.status !== "cancelled",
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
  const result = urgentProducts.map((p) => ({
    name: p.name,
    stock: p.stock,
    soldLastMonth: salesMap[p.name] || 0,
  }));

  // Cập nhật cache
  if (canCache) {
    let ordersMap = inventoryCache.get(products);
    if (!ordersMap) {
      ordersMap = new WeakMap();
      inventoryCache.set(products, ordersMap);
    }
    ordersMap.set(orders, { timestamp: Date.now(), data: result });
  }

  return result;
};
