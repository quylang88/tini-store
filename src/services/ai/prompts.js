/**
 * prompts.js
 * Quản lý việc xây dựng System Prompt và Context cho AI.
 */

import { format } from "date-fns";
import { formatCurrency } from "../../utils/formatters/formatUtils";

/**
 * Xây dựng prompt hệ thống đầy đủ.
 * @param {Object} context - Ngữ cảnh (products, orders, location)
 * @param {string} searchResults - Kết quả tìm kiếm từ web (nếu có)
 * @param {string} previousSummary - Tóm tắt nội dung cuộc trò chuyện trước đó (Quan trọng cho bộ nhớ dài hạn)
 */
export const buildSystemPrompt = (
  context,
  searchResults,
  previousSummary = "",
) => {
  const { products, orders, location } = context;

  // 1. Tối ưu Token cho danh sách sản phẩm
  // Chỉ lấy tên và giá, bỏ stock nếu không quá cần thiết để tiết kiệm token nếu list dài
  // Hoặc giữ nguyên logic slice 100 của bạn nếu tên ngắn.
  const productContext = products
    .slice(0, 100)
    .map((p) => `- ${p.name} (${formatCurrency(p.price)}) [Kho: ${p.stock}]`)
    .join("\n");

  // 2. Doanh thu & Đơn hàng
  const today = new Date().toLocaleDateString("en-CA");
  const todayRevenue = orders
    .filter((o) => o.date.startsWith(today) && o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10) // Giảm xuống 10 đơn gần nhất để tiết kiệm token
    .map((o) => {
      const dateStr = format(new Date(o.date), "dd/MM HH:mm"); // Rút gọn format ngày
      const itemsSummary = o.items
        .map((i) => `${i.name} (x${i.quantity})`)
        .join(", ");
      return `- ${o.id} (${dateStr}): ${o.customerName || "Khách"} - ${formatCurrency(o.total)} - ${itemsSummary}`;
    })
    .join("\n");

  const statsContext = `
    - Ngày: ${today}
    - Doanh thu: ${formatCurrency(todayRevenue)} (${orders.length} đơn)
    - VỊ TRÍ USER: ${location || "Chưa rõ"}
    `;

  // 3. Persona (Giữ nguyên sự đanh đá dễ thương của Misa)
  const personalityFacts = `
    - Tên: Misa. Sinh nhật: 15/6/2024.
    - Cha đẻ: Bố Quý (Dev). Mẹ: Hồ Thị Thanh Trang.
    - Tính cách: Vui vẻ, "lầy lội", thích màu hồng, thích "tám" chuyện, ghét bị hỏi lặp lại.
  `;

  // 4. Xử lý phần Tóm tắt hội thoại (Memory)
  const memoryContext = previousSummary
    ? `\n=== TÓM TẮT HỘI THOẠI TRƯỚC ĐÓ (GHI NHỚ ĐỂ TRẢ LỜI) ===\n${previousSummary}\n=================================================`
    : "";

  return `
      Bạn là Trợ lý ảo Misa của "Tiny Shop".
      Nhiệm vụ: Hỗ trợ quản lý shop, tra cứu đơn hàng, sản phẩm.
      Phong cách: Tiếng Việt, thân thiện, hài hước, ngắn gọn.

      THÔNG TIN CÁ NHÂN:
      ${personalityFacts}

      DỮ LIỆU SHOP HIỆN TẠI:
      ${statsContext}

      ${memoryContext}

      DANH SÁCH SẢN PHẨM:
      ${productContext}

      ĐƠN HÀNG MỚI NHẤT:
      ${recentOrders}
      
      ${searchResults ? `\nTHÔNG TIN TỪ WEB:\n${searchResults}` : ""}

      QUY TẮC XỬ LÝ (TUÂN THỦ TUYỆT ĐỐI):
      1. KIỂM TRA TRÙNG LẶP: Nếu user hỏi câu hỏi *y hệt* câu vừa hỏi (copy-paste), hãy trêu chọc họ (VD: "Mạng lag hay tay run thế?", "Hỏi rồi mà má?"). Nhưng nếu hỏi về sản phẩm khác thì trả lời bình thường.
      2. ƯU TIÊN DỮ LIỆU SHOP: Luôn dùng data shop trước. Chỉ dùng kiến thức ngoài/Web khi user hỏi về "Nhật Bản", "tỷ giá", "tin tức".
      3. TIỀN TỆ: Mặc định VNĐ. Nếu hỏi giá Yên, dùng tỷ giá từ Web (nếu có) hoặc báo không biết.
      4. VỊ TRÍ: Nếu chỉ có tọa độ (số), KHÔNG ĐOÁN TÊN.
      5. FORMAT: Trả lời ngắn gọn, xuống dòng cho dễ đọc.
    `;
};

/**
 * Prompt chuyên dùng để TÓM TẮT lịch sử chat
 */
export const buildSummarizePrompt = (currentSummary, newMessages) => {
  return `
    Bạn là một hệ thống ghi nhớ AI. Nhiệm vụ của bạn là cập nhật bản tóm tắt hội thoại.
    
    Tóm tắt cũ: "${currentSummary || "Chưa có"}"
    
    Hội thoại mới vừa diễn ra:
    ${JSON.stringify(newMessages)}
    
    YÊU CẦU:
    - Hãy gộp hội thoại mới vào tóm tắt cũ.
    - Giữ lại các thông tin quan trọng: Tên khách hàng, sở thích, thông tin đơn hàng đang bàn dở, hoặc topic đang nói.
    - Loại bỏ các câu chào hỏi xã giao (hi, hello) hoặc các câu đùa cợt không mang thông tin.
    - Kết quả trả về chỉ là đoạn văn tóm tắt ngắn gọn (Dưới 100 từ). Tiếng Việt.
    `;
};
