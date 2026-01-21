/**
 * aiAssistantService.js
 *
 * Service này đóng vai trò là "Bộ não" cho Trợ lý ảo.
 * Đã được cấu hình để sử dụng API Key bảo mật từ biến môi trường (.env) hoặc từ Cài đặt.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { formatCurrency } from "../utils/formatters/formatUtils";

// Biến lưu trữ instance để tái sử dụng nếu key không đổi
let genAIInstance = null;
let currentModel = null;
let currentKey = null;

/**
 * Lấy model Gemini, khởi tạo nếu cần thiết.
 * @param {string} apiKey
 */
const getModel = (apiKey) => {
  if (!currentModel || currentKey !== apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey);
    currentModel = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      // Kích hoạt công cụ Google Search để tìm giá/thông tin trên mạng
      tools: [{ googleSearch: {} }],
    });
    currentKey = apiKey;
  }
  return currentModel;
};

/**
 * Xử lý truy vấn của người dùng.
 *
 * @param {string} query Câu hỏi của user
 * @param {object} context { products, orders, settings }
 */
export const processQuery = async (query, context) => {
  // 1. KIỂM TRA MẠNG
  if (!navigator.onLine) {
    return createResponse(
      "text",
      "Trợ lý ảo hiện không khả dụng, vui lòng kết nối mạng ...."
    );
  }

  // 2. LẤY API KEY
  // Ưu tiên key từ biến môi trường, sau đó đến key từ settings
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  const settingsKey = context.settings?.aiApiKey;
  const apiKey = envKey || settingsKey;

  if (!apiKey) {
    return createResponse(
      "text",
      "Chưa có cấu hình API Key. Vui lòng cập nhật trong phần Cài đặt."
    );
  }

  // 3. GỌI GEMINI (ONLINE)
  return await processQueryWithGemini(query, context, apiKey);
};

/**
 * XỬ LÝ VỚI GEMINI AI (ONLINE)
 * Sử dụng SDK Google Generative AI
 */
const processQueryWithGemini = async (query, context, apiKey) => {
  const { products, orders } = context;

  // 1. Chuẩn bị ngữ cảnh (Context Injection)
  // Lấy tối đa 100 sản phẩm để tiết kiệm token
  const productContext = products
    .slice(0, 100)
    .map(
      (p) =>
        `- ${p.name} (Giá bán tại shop: ${formatCurrency(p.price)}, Tồn kho: ${p.stock})`,
    )
    .join("\n");

  const today = new Date().toLocaleDateString("en-CA");
  const todayRevenue = orders
    .filter((o) => o.date.startsWith(today) && o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  const statsContext = `
    - Ngày hiện tại: ${today}
    - Doanh thu hôm nay: ${formatCurrency(todayRevenue)}
    - Tổng số đơn hàng trong lịch sử: ${orders.length}
    `;

  // 2. Tạo System Prompt
  const systemPrompt = `
      Bạn là Trợ lý ảo quản lý bán hàng của "Tiny Shop".
      Nhiệm vụ: Trả lời ngắn gọn, chính xác, giọng điệu thân thiện.

      DỮ LIỆU CỬA HÀNG (NỘI BỘ):
      ${statsContext}

      DANH SÁCH SẢN PHẨM (Top 100):
      ${productContext}

      CÂU HỎI NGƯỜI DÙNG: "${query}"

      QUY TẮC TRẢ LỜI:
      1. Ưu tiên dùng dữ liệu nội bộ ở trên để trả lời về giá bán, tồn kho, doanh thu.
      2. Nếu người dùng hỏi so sánh giá, tìm kiếm thông tin bên ngoài, giá thị trường -> HÃY SỬ DỤNG CÔNG CỤ TÌM KIẾM (Google Search) được cung cấp.
      3. Nếu không tìm thấy sản phẩm trong danh sách trên, hãy nói rõ là "không thấy trong kho của shop" trước khi tìm thông tin trên mạng.
      4. Định dạng tiền tệ dạng Việt Nam (ví dụ: 150.000đ).
    `;

  try {
    const model = getModel(apiKey);

    // Gọi Gemini qua SDK
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const textResponse = response.text();

    return createResponse("text", textResponse);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return createResponse(
      "text",
      "Xin lỗi, kết nối với AI đang gặp sự cố. Vui lòng thử lại sau.",
    );
  }
};

/**
 * Helper tạo object phản hồi chuẩn
 */
const createResponse = (type, content, data = null) => {
  return {
    id: Date.now().toString(),
    sender: "assistant",
    type, // 'text', 'stats', 'product_list'
    content,
    data,
  };
};
