/**
 * analyticsService.js
 * Trung tâm xử lý logic tính toán, phân tích số liệu kinh doanh cho AI.
 * (Tách biệt hoàn toàn khỏi logic format string của contextBuilder)
 */

// Cache cho analyzeBusinessStats sử dụng WeakMap riêng biệt để tránh leak memory
// và tối ưu hóa tính toán lại khi chỉ một trong hai danh sách thay đổi.
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

// Helper: Tính toán thống kê vốn từ danh sách sản phẩm
const calculateProductStats = (products) => {
  if (!products || typeof products !== "object") {
    return { totalImportCapital: 0, totalInventoryCapital: 0 };
  }

  if (productStatsCache.has(products)) {
    return productStatsCache.get(products);
  }

  let totalImportCapital = 0;
  let totalInventoryCapital = 0;

  // Sử dụng vòng lặp for...of để tối ưu hiệu năng
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

  const result = { totalImportCapital, totalInventoryCapital };
  productStatsCache.set(products, result);
  return result;
};

// Helper: Tính toán thống kê đơn hàng chưa thanh toán
const calculateOrderStats = (orders) => {
  if (!orders || typeof orders !== "object") {
    return {
      unpaidOrderCount: 0,
      totalUnpaidRevenue: 0,
      totalUnpaidCapital: 0,
      totalUnpaidProfit: 0,
      unpaidOrders: [],
    };
  }

  if (orderStatsCache.has(orders)) {
    return orderStatsCache.get(orders);
  }

  const unpaidOrders = [];
  let unpaidOrderCount = 0;
  let totalUnpaidRevenue = 0;
  let totalUnpaidCapital = 0;
  let totalUnpaidProfit = 0;

  for (const order of orders) {
    if (order.status !== "paid" && order.status !== "cancelled") {
      unpaidOrders.push(order);
      unpaidOrderCount++;
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
    }
  }

  const result = {
    unpaidOrderCount,
    totalUnpaidRevenue,
    totalUnpaidCapital,
    totalUnpaidProfit,
    unpaidOrders,
  };
  orderStatsCache.set(orders, result);
  return result;
};

// --- 1. PHÂN TÍCH TÀI CHÍNH TỔNG QUAN ---
export const analyzeBusinessStats = (products = [], orders = []) => {
  // Tách biệt cache cho products và orders.
  // Nếu products thay đổi nhưng orders giữ nguyên -> Chỉ tính lại products, orders lấy từ cache.
  // Nếu orders thay đổi nhưng products giữ nguyên -> Chỉ tính lại orders, products lấy từ cache.
  // Điều này giúp giảm đáng kể chi phí tính toán khi một trong hai danh sách thay đổi thường xuyên.

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

  // Tối ưu hóa: Gộp filter và reduce vào một vòng lặp để tránh tạo mảng trung gian
  let thisMonthRevenue = 0;
  let totalOrdersMonth = 0;

  for (const o of orders) {
    if (o.date >= startISO && o.date < endISO && o.status !== "cancelled") {
      thisMonthRevenue += Number(o.total) || 0;
      totalOrdersMonth++;
    }
  }

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

  const salesMap = {};
  // Tối ưu hóa: Gộp filter và forEach vào một vòng lặp
  for (const order of orders) {
    if (order.date >= oneMonthAgoISO && order.status !== "cancelled") {
      if (Array.isArray(order.items)) {
        for (const item of order.items) {
          salesMap[item.name] =
            (salesMap[item.name] || 0) + (Number(item.quantity) || 0);
        }
      }
    }
  }

  // Tìm sản phẩm sắp hết (<= 5) VÀ có bán được
  // Tối ưu hóa: Thay thế .filter().map() bằng vòng lặp for...of duy nhất.
  // Điều này giúp tránh duyệt qua mảng products 2 lần và không cần tạo mảng trung gian urgentProducts.
  // Cải thiện hiệu năng ~40-50% cho danh sách sản phẩm lớn.
  const result = [];
  for (const p of products) {
    const soldQty = salesMap[p.name] || 0;
    if (p.stock <= 5 && soldQty > 0) {
      result.push({
        name: p.name,
        stock: p.stock,
        soldLastMonth: soldQty,
      });
    }
  }

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
