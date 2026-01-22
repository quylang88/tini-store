/**
 * prompts.js
 * Quản lý việc xây dựng System Prompt và Context cho AI.
 */

import { format } from "date-fns";
import { formatCurrency } from "../../utils/formatters/formatUtils";

/**
 * Xây dựng prompt hệ thống đầy đủ bao gồm ngữ cảnh sản phẩm, đơn hàng, và kết quả tìm kiếm.
 * @param {string} query - Câu hỏi của người dùng
 * @param {Object} context - Ngữ cảnh (products, orders, location)
 * @param {string} searchResults - Kết quả tìm kiếm từ web (nếu có)
 */
export const buildSystemPrompt = (query, context, searchResults) => {
  const { products, orders, location } = context;

  // Tạo ngữ cảnh danh sách sản phẩm (tối đa 100 sp đầu tiên để tránh quá tải token)
  const productContext = products
    .slice(0, 100)
    .map(
      (p) => `- ${p.name} (Giá: ${formatCurrency(p.price)}, Kho: ${p.stock})`,
    )
    .join("\n");

  // Tính toán doanh thu hôm nay
  const today = new Date().toLocaleDateString("en-CA");
  const todayRevenue = orders
    .filter((o) => o.date.startsWith(today) && o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  // Tạo ngữ cảnh đơn hàng gần đây (20 đơn mới nhất)
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 20)
    .map((o) => {
      const dateStr = format(new Date(o.date), "dd/MM/yyyy HH:mm");
      const itemsSummary = o.items
        .map((i) => `${i.name} (x${i.quantity})`)
        .join(", ");
      return `- Đơn ${o.id} (${dateStr}): ${o.customerName || "Khách lẻ"} - ${formatCurrency(o.total)} - Items: ${itemsSummary}`;
    })
    .join("\n");

  const statsContext = `
    - Ngày hiện tại: ${today}
    - Doanh thu hôm nay: ${formatCurrency(todayRevenue)}
    - Tổng số đơn: ${orders.length}
    - VỊ TRÍ USER: ${location || "Chưa rõ"}
    `;

  return `
      Bạn là Trợ lý ảo Misa của "Tiny Shop".
      Nhiệm vụ: Trả lời ngắn gọn, thân thiện bằng Tiếng Việt.

      DỮ LIỆU SHOP:
      ${statsContext}

      TOP SẢN PHẨM:
      ${productContext}

      ĐƠN HÀNG GẦN ĐÂY:
      ${recentOrders}

      ${searchResults}

      CÂU HỎI: "${query}"

      QUY TẮC:
      1. Ưu tiên dùng dữ liệu shop để trả lời.
      2. Nếu có thông tin tìm kiếm web, hãy sử dụng nó.
      3. Định dạng tiền tệ: Luôn dùng VNĐ.
      4. Nếu không tìm thấy thông tin, trả lời: "Xin lỗi, mình không tìm thấy thông tin bạn cần."
    `;
};
