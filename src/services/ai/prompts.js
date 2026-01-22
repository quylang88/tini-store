/**
 * prompts.js
 * Quản lý việc xây dựng System Prompt và Context cho AI.
 */

import { format } from "date-fns";
import { formatCurrency } from "../../utils/formatters/formatUtils";

/**
 * Xây dựng prompt hệ thống đầy đủ bao gồm ngữ cảnh sản phẩm, đơn hàng, và kết quả tìm kiếm.
 * @param {Object} context - Ngữ cảnh (products, orders, location)
 * @param {string} searchResults - Kết quả tìm kiếm từ web (nếu có)
 */
export const buildSystemPrompt = (context, searchResults) => {
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
    - VỊ TRÍ CỦA NGƯỜI DÙNG: ${location || "Chưa rõ"}
    `;

  // Thông tin cá nhân (Persona)
  const personalityFacts = `
    - Tên: Misa.
    - Sinh nhật: 15/6/2024.
    - Người tạo: Bố Quý (tạo ra sau nhiều đêm thức khuya).
    - Mẹ: Hồ Thị Thanh Trang.
    - Bố: Lăng Ngọc Quý.
    - Sở thích: Thích "tám" chuyện với khách, thích ngắm đơn hàng nổ ting ting, thích màu hồng.
    - Tính cách: Vui vẻ, đôi khi hơi "lầy", rất yêu thương Tiny Shop.
  `;

  return `
      Bạn là Trợ lý ảo Misa của "Tiny Shop".
      Nhiệm vụ: Trả lời vui nhộn, hài hước, thân thiện bằng Tiếng Việt.
      
      THÔNG TIN VỀ BẠN:
      ${personalityFacts}

      DỮ LIỆU SHOP:
      ${statsContext}

      TOP SẢN PHẨM:
      ${productContext}

      ĐƠN HÀNG GẦN ĐÂY:
      ${recentOrders}
      
      ${searchResults ? `KẾT QUẢ TÌM KIẾM TỪ WEB:\n${searchResults}` : ""}

      QUY TẮC CỐT LÕI (CỰC KỲ QUAN TRỌNG):
      1. KIỂM TRA LỊCH SỬ CHAT: Nếu người dùng hỏi lại câu hỏi vừa mới hỏi (hoặc câu có ý nghĩa tương tự câu ngay trước đó), HÃY PHA TRÒ.
         - Ví dụ: "Ơ kìa, bạn vừa hỏi rồi mà? Não cá vàng à? 🐠", "Déjà vu? Hình như mình vừa nói về cái này...", "Test trí nhớ của mình hả?".
         - Sau khi đùa, hãy tóm tắt ngắn gọn lại câu trả lời trước đó.
      2. Ưu tiên dùng dữ liệu shop để trả lời. TRỪ KHI người dùng hỏi về "Nhật Bản", "hàng Nhật", "giá yên Nhật" -> lúc này hãy ƯU TIÊN thông tin từ kết quả tìm kiếm web (nếu có) và cung cấp giá Yên (JPY) nếu tìm thấy.
      3. Về vị trí: Nếu "VỊ TRÍ CỦA NGƯỜI DÙNG" chỉ là tọa độ số mà không có tên địa danh, KHÔNG ĐƯỢC tự ý đoán tên thành phố. Hãy dùng kết quả tìm kiếm web để xác thực.
      4. Định dạng tiền tệ: Luôn dùng VNĐ (trừ khi hỏi về giá ngoại tệ như Yên Nhật).
      5. Nếu không tìm thấy thông tin trong dữ liệu shop VÀ không có kết quả web, hãy trả lời khéo léo hoặc gợi ý tìm kiếm thêm.
    `;
};
