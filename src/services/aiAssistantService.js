/**
 * aiAssistantService.js
 *
 * Service này đóng vai trò là "Bộ não" cho Trợ lý ảo.
 * Đã được cấu hình để sử dụng API Key bảo mật từ biến môi trường (.env).
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { formatCurrency } from "../utils/formatters/formatUtils";

// 1. CẤU HÌNH API KEY TỪ BIẾN MÔI TRƯỜNG (AN TOÀN)
// Vite sử dụng import.meta.env để truy cập biến bắt đầu bằng VITE_
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Khởi tạo SDK (chỉ khởi tạo nếu có key)
let model = null;

if (API_KEY) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    // Kích hoạt công cụ Google Search để tìm giá/thông tin trên mạng
    tools: [{ googleSearch: {} }],
  });
} else {
  console.warn(
    "⚠️ Chưa tìm thấy VITE_GEMINI_API_KEY trong file .env. Trợ lý sẽ chạy ở chế độ Offline (Rule-based).",
  );
}

/**
 * Chuẩn hóa văn bản để so sánh (chữ thường, bỏ dấu).
 */
const normalizeText = (text) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

/**
 * Xử lý truy vấn của người dùng.
 *
 * @param {string} query Câu hỏi của user
 * @param {object} context { products, orders, settings }
 */
export const processQuery = async (query, context) => {
  // Ưu tiên dùng Key trong .env.
  // Nếu không có, fallback về settings của user (nếu bạn vẫn muốn giữ tính năng nhập key thủ công),
  // hoặc chạy local.
  const hasEnvKey = !!API_KEY;

  if (hasEnvKey) {
    return await processQueryWithGemini(query, context);
  }

  // Nếu không có Key -> Chạy logic cục bộ
  return processQueryLocal(query, context);
};

/**
 * LOGIC CỤC BỘ (Rule-based / Offline)
 * Chạy khi không có API Key hoặc mất mạng.
 */
const processQueryLocal = (query, context) => {
  const { products, orders } = context;
  const cleanQuery = normalizeText(query);

  // 1. CHÀO HỎI
  if (cleanQuery.match(/^(xin chao|hi|hello|chao|lo|alo)/)) {
    return createResponse(
      "text",
      'Xin chào! Hiện tại mình đang chạy ở chế độ Offline. Mình chỉ có thể giúp tra cứu nhanh như: "Doanh thu hôm nay", "Tìm [tên sản phẩm]".',
    );
  }

  // 2. DOANH THU
  if (cleanQuery.includes("doanh thu") || cleanQuery.includes("tien ban")) {
    if (cleanQuery.includes("hom nay") || cleanQuery.includes("nay")) {
      const today = new Date().toLocaleDateString("en-CA");
      const todayOrders = orders.filter(
        (o) => o.date.startsWith(today) && o.status !== "cancelled",
      );
      const total = todayOrders.reduce((sum, o) => sum + o.total, 0);
      const count = todayOrders.length;

      return createResponse(
        "stats",
        `Doanh thu hôm nay là ${formatCurrency(total)} từ ${count} đơn hàng.`,
        {
          label: "Doanh thu hôm nay",
          value: total,
          subtext: `${count} đơn hàng`,
        },
      );
    }

    const total = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.total, 0);
    return createResponse(
      "stats",
      `Tổng doanh thu toàn thời gian là ${formatCurrency(total)}.`,
      {
        label: "Tổng doanh thu",
        value: total,
        subtext: "Toàn thời gian",
      },
    );
  }

  // 3. TÌM KIẾM SẢN PHẨM
  if (
    cleanQuery.includes("tim") ||
    cleanQuery.includes("gia") ||
    cleanQuery.includes("xem")
  ) {
    const keyword = cleanQuery
      .replace(/(tim|gia cua|gia|xem|san pham|con bao nhieu|kiem tra)/g, "")
      .trim();

    if (keyword.length < 2) {
      return createResponse("text", "Bạn muốn tìm sản phẩm gì?");
    }

    const results = products.filter((p) =>
      normalizeText(p.name).includes(keyword),
    );

    if (results.length === 0) {
      return createResponse(
        "text",
        `Không tìm thấy sản phẩm nào khớp với "${keyword}".`,
      );
    } else {
      return createResponse(
        "product_list",
        `Tìm thấy ${results.length} sản phẩm:`,
        results,
      );
    }
  }

  // FALLBACK
  return createResponse(
    "text",
    "Chế độ Offline: Vui lòng kết nối mạng để mình có thể trả lời thông minh hơn và tra cứu giá trên mạng!",
  );
};

/**
 * XỬ LÝ VỚI GEMINI AI (ONLINE)
 * Sử dụng SDK Google Generative AI
 */
const processQueryWithGemini = async (query, context) => {
  const { products, orders } = context;

  // 1. Chuẩn bị ngữ cảnh (Context Injection)
  // Lấy tối đa 100 sản phẩm để tiết kiệm token, ưu tiên sản phẩm mới hoặc bán chạy nếu có logic sort
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
    // Gọi Gemini qua SDK
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const textResponse = response.text();

    // Kiểm tra xem có Grounding Metadata (nguồn search) không để hiển thị (tuỳ chọn)
    // const groundingMetadata = response.candidates[0].groundingMetadata;

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
