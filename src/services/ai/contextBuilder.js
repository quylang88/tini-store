/**
 * contextBuilder.js
 * Chuyên trách việc xử lý dữ liệu và định dạng chuỗi cho Prompt của AI.
 * Giúp prompts.js sạch sẽ hơn, chỉ chứa cấu trúc text.
 */

import { formatCurrency } from "../../utils/formatters/formatUtils.js";
import { analyzeBusinessStats } from "./analysisUtils.js";
import { getProductStats } from "../../utils/inventory/purchaseUtils.js";

// --- 1. XỬ LÝ SỐ LIỆU TÀI CHÍNH & KINH DOANH ---

export const generateFinancialReport = (orders, location, products = []) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter orders for current month
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

  // Phân tích sâu
  const stats = analyzeBusinessStats(products, orders);

  return `
    - Báo cáo Tháng ${currentMonth + 1}/${currentYear}:
    - Doanh thu: ${formatCurrency(thisMonthRevenue)}
    - Tổng đơn: ${totalOrdersMonth} đơn
    - Vị trí shop: ${location || "Văn phòng Tiny Shop"}

    TỔNG KẾT TÀI CHÍNH & KHO VẬN:
    - 💰 Vốn đã nhập (Tổng tích lũy): ${formatCurrency(stats.totalImportCapital)}
    - 📦 Vốn tồn kho (Hiện tại): ${formatCurrency(stats.totalInventoryCapital)}
    - ⏳ Đơn chưa thanh toán: ${stats.unpaidOrderCount} đơn
      + Vốn đang kẹt: ${formatCurrency(stats.totalUnpaidCapital)}
      + Tổng tiền khách nợ: ${formatCurrency(stats.totalUnpaidRevenue)}
      + Lợi nhuận dự kiến: ${formatCurrency(stats.totalUnpaidProfit)}
    `;
};

// --- 2. XỬ LÝ DANH SÁCH SẢN PHẨM ---

export const formatProductList = (products) => {
  // Giới hạn 150 sản phẩm để tránh tràn context window
  // (Trong thực tế có thể cần logic rank sản phẩm hay bán/quan trọng để đưa vào trước)
  return products
    .slice(0, 150)
    .map((p) => {
      const { unitCost } = getProductStats(p);
      return `- ${p.name} | Giá bán: ${formatCurrency(p.price)} | Giá nhập: ${formatCurrency(unitCost)} | Kho: ${p.stock}`;
    })
    .join("\n");
};

// --- 3. XỬ LÝ CẢNH BÁO NHẬP KHO (RESTOCK) ---

export const generateRestockAlerts = (products, orders) => {
  // Tính toán Sales Map (số lượng bán ra trong 30 ngày gần nhất)
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

  // Tìm sản phẩm sắp hết (<= 5) VÀ có bán được trong tháng qua
  const urgentProducts = products.filter((p) => {
    const soldQty = salesMap[p.name] || 0;
    return p.stock <= 5 && soldQty > 0;
  });

  if (urgentProducts.length === 0) {
    return "(Kho mình đang ổn áp mẹ nha, chưa có gì cháy hàng đâu!)";
  }

  return urgentProducts
    .map((p) => {
      const sold = salesMap[p.name];
      return `- 🔥 [HOT - SẮP HẾT] ${p.name}: còn ${p.stock} (Tháng rồi bay ${sold} cái) -> Nhập gấp mẹ Trang ơi!`;
    })
    .join("\n");
};
