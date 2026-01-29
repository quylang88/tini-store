/**
 * contextBuilder.js
 * Chuyên trách việc xử lý dữ liệu và định dạng chuỗi cho Prompt của AI.
 * Giúp prompts.js sạch sẽ hơn, chỉ chứa cấu trúc text.
 */

import { formatCurrency } from "../../utils/formatters/formatUtils.js";
import {
  analyzeBusinessStats,
  analyzeMonthlySales,
  analyzeInventory,
} from "./analyticsService.js";
import { getProductStats } from "../../utils/inventory/purchaseUtils.js";

// --- 1. XỬ LÝ SỐ LIỆU TÀI CHÍNH & KINH DOANH ---

export const generateFinancialReport = (orders, location, products = []) => {
  // Lấy số liệu phân tích từ Analytics Service
  const salesStats = analyzeMonthlySales(orders);
  const businessStats = analyzeBusinessStats(products, orders);

  return `
    - Báo cáo Tháng ${salesStats.currentMonth}/${salesStats.currentYear}:
    - Doanh thu: ${formatCurrency(salesStats.thisMonthRevenue)}
    - Tổng đơn: ${salesStats.totalOrdersMonth} đơn
    - Vị trí shop: ${location || "Văn phòng Tiny Shop"}
    
    TỔNG KẾT TÀI CHÍNH & KHO VẬN:
    - 💰 Vốn đã nhập (Tổng tích lũy): ${formatCurrency(businessStats.totalImportCapital)}
    - 📦 Vốn tồn kho (Hiện tại): ${formatCurrency(businessStats.totalInventoryCapital)}
    - ⏳ Đơn chưa thanh toán: ${businessStats.unpaidOrderCount} đơn
      + Vốn đang kẹt: ${formatCurrency(businessStats.totalUnpaidCapital)}
      + Tổng tiền khách nợ: ${formatCurrency(businessStats.totalUnpaidRevenue)}
      + Lợi nhuận dự kiến: ${formatCurrency(businessStats.totalUnpaidProfit)}
    `;
};

// --- 2. XỬ LÝ DANH SÁCH SẢN PHẨM ---

export const formatProductList = (products) => {
  // Giới hạn 150 sản phẩm để tránh tràn context window
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
  const urgentProducts = analyzeInventory(products, orders);

  if (!urgentProducts || urgentProducts.length === 0) {
    return "(Kho mình đang ổn áp mẹ nha, chưa có gì cháy hàng đâu!)";
  }

  return urgentProducts
    .map((p) => {
      return `- 🔥 [HOT - SẮP HẾT] ${p.name}: còn ${p.stock} (Tháng rồi bay ${p.soldLastMonth} cái) -> Nhập gấp mẹ Trang ơi!`;
    })
    .join("\n");
};

// --- 4. XỬ LÝ HƯỚNG DẪN TRÙNG LẶP (DUPLICATE) ---

export const generateDuplicateInstruction = (isDuplicate) => {
  if (!isDuplicate) return "";

  return `
    1. [MISA NHẮC NHẸ] VD: "Câu này mẹ vừa hỏi rồi mà? Cá vàng thế? Thôi trả lời lại nè:", ...
    2. Sau câu đùa, hãy nhắc lại câu trả lời cũ một cách NGẮN GỌN nhất có thể.
  `;
};
