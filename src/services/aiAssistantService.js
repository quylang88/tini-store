/**
 * aiAssistantService.js
 *
 * Service này đóng vai trò là "Bộ não" cho Trợ lý ảo.
 */

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { formatCurrency } from "../utils/formatters/formatUtils";

// --- BIẾN CACHE (Singleton) ---
// Lưu trữ instance để tái sử dụng, tránh khởi tạo lại nhiều lần
let cachedKey = null;
let cachedModelWithSearch = null; // Model có Google Search
let cachedModelBasic = null; // Model thường (Fallback)

// Cấu hình an toàn (Block None để tránh bị chặn nhầm)
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

/**
 * Hàm lấy Model thông minh (có Cache)
 * @param {string} apiKey
 * @param {boolean} useSearch
 */
const getModel = (apiKey, useSearch = true) => {
  // 1. Nếu Key thay đổi (hoặc lần đầu chạy), reset toàn bộ cache
  if (apiKey !== cachedKey) {
    cachedKey = apiKey;
    cachedModelWithSearch = null;
    cachedModelBasic = null;
  }

  // 2. Trả về model từ cache nếu đã có
  if (useSearch && cachedModelWithSearch) return cachedModelWithSearch;
  if (!useSearch && cachedModelBasic) return cachedModelBasic;

  // 3. Nếu chưa có trong cache, khởi tạo mới
  const genAI = new GoogleGenerativeAI(apiKey);

  const modelConfig = {
    model: "gemini-2.5-flash",
    safetySettings: safetySettings,
  };

  if (useSearch) {
    modelConfig.tools = [{ googleSearch: {} }];
    // Lưu vào cache search
    cachedModelWithSearch = genAI.getGenerativeModel(modelConfig);
    return cachedModelWithSearch;
  } else {
    // Lưu vào cache thường
    cachedModelBasic = genAI.getGenerativeModel(modelConfig);
    return cachedModelBasic;
  }
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
    if (!navigator.onLine) {
      return createResponse(
        "text",
        "Bạn đang Offline. Vui lòng kiểm tra kết nối mạng.",
      );
    }
  }

  // 2. LẤY API KEY
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return createResponse(
      "text",
      "Chưa có cấu hình API Key. Vui lòng cập nhật lại.",
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

  // --- CHUẨN BỊ DATA ---
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

  const systemPrompt = `
      Bạn là Trợ lý ảo, tên là Misa. Quản lý bán hàng của "Tiny Shop".
      Nhiệm vụ: Trả lời ngắn gọn, chính xác, giọng điệu thân thiện.

      DỮ LIỆU SHOP (NỘI BỘ):
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

  // LOGIC GỌI API ĐÃ NÂNG CẤP ĐỂ BÁO LỖI CHÍNH XÁC:
  try {
    // LẦN 1: Thử gọi có Search
    const model = getModel(apiKey, true);
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    return createResponse("text", response.text());
  } catch (error1) {
    console.warn("Lần 1 (Search) thất bại:", error1.message);

    // LẦN 2: Thử gọi không Search
    try {
      const modelBasic = getModel(apiKey, false);
      const retryPrompt =
        systemPrompt + "\n(Trả lời dựa trên kiến thức có sẵn)";
      const result = await modelBasic.generateContent(retryPrompt);
      const response = await result.response;

      return createResponse(
        "text",
        response.text() + "\n\n(⚠️ Lưu ý: Không thể tìm kiếm Google lúc này)",
      );
    } catch (error2) {
      console.error("Lần 2 (Basic) cũng thất bại:", error2);

      // --- PHÂN TÍCH LỖI ĐỂ BÁO CHO USER ---
      let errorMsg = "Lỗi không xác định.";

      if (error2.message.includes("400")) {
        errorMsg =
          "Lỗi 400: API Key không hợp lệ. Hãy kiểm tra xem Key có bị thừa dấu cách hoặc copy thiếu không.";
      } else if (error2.message.includes("403")) {
        errorMsg =
          "Lỗi 403: API Key đúng nhưng bị chặn. (Có thể do hết hạn ngạch Free hoặc IP bị chặn).";
      } else if (error2.message.includes("Failed to fetch")) {
        errorMsg =
          "Lỗi mạng: Không thể kết nối đến Google. (Kiểm tra Wifi hoặc tắt VPN/Adblock).";
      } else {
        errorMsg = `Chi tiết lỗi: ${error2.message}`;
      }

      return createResponse(
        "text",
        `🚫 KHÔNG THỂ KẾT NỐI AI:\n${errorMsg}\n\n👉 Hãy thử Restart lại server (npm run dev) nếu vừa đổi Key.`,
      );
    }
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
