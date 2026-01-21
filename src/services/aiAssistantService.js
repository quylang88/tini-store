/**
 * aiAssistantService.js
 *
 * Service này đóng vai trò là "Bộ não" cho Trợ lý ảo.
 */

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  DynamicRetrievalMode,
} from "@google/generative-ai";
import { formatCurrency } from "../utils/formatters/formatUtils";

// --- BIẾN CACHE (Singleton) ---
let cachedKey = null;
let cachedModel = null;

// Cấu hình an toàn
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
 * Chúng ta LUÔN bật googleSearchRetrieval (Search Grounding) vì:
 * Dù prompt ưu tiên "tìm local trước", model cần công cụ này để thực hiện vế "sau đó tìm trên mạng".
 * Mode 'dynamic' cho phép model tự quyết định khi nào cần search.
 */
const getModel = (apiKey) => {
  if (apiKey !== cachedKey) {
    cachedKey = apiKey;
    cachedModel = null;
  }

  if (cachedModel) return cachedModel;

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = import.meta.env.VITE_GEMINI_MODEL_NAME || "gemini-1.5-flash";

  cachedModel = genAI.getGenerativeModel({
    model: modelName,
    safetySettings: safetySettings,
    tools: [
      {
        googleSearchRetrieval: {
          dynamicRetrievalConfig: {
            mode: DynamicRetrievalMode.MODE_DYNAMIC,
            dynamicThreshold: 0.7,
          },
        },
      },
    ],
  });

  return cachedModel;
};

/**
 * Xử lý truy vấn của người dùng.
 */
export const processQuery = async (query, context) => {
  // 1. KIỂM TRA MẠNG (Bước 1: Check Offline API)
  if (!navigator.onLine) {
    return createResponse(
      "text",
      "Bạn đang Offline. Vui lòng kiểm tra kết nối mạng.",
    );
  }

  // 2. LẤY API KEY
  // Ưu tiên key từ biến môi trường, sau đó đến settings (nếu có logic settings)
  let apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey && context.settings?.aiApiKey) {
      apiKey = context.settings.aiApiKey;
  }

  if (!apiKey) {
    return createResponse(
      "text",
      "Chưa có cấu hình API Key. Vui lòng kiểm tra cài đặt.",
    );
  }

  // 3. GỌI GEMINI
  return await processQueryWithGemini(query, context, apiKey);
};

/**
 * XỬ LÝ VỚI GEMINI AI
 */
const processQueryWithGemini = async (query, context, apiKey) => {
  const { products, orders } = context;

  // --- CHUẨN BỊ DATA ---
  const productContext = products
    .slice(0, 100)
    .map(
      (p) =>
        `- ${p.name} (Giá bán: ${formatCurrency(p.price)}, Kho: ${p.stock})`,
    )
    .join("\n");

  const today = new Date().toLocaleDateString("en-CA");
  const todayRevenue = orders
    .filter((o) => o.date.startsWith(today) && o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  const statsContext = `
    - Ngày hiện tại: ${today}
    - Doanh thu hôm nay: ${formatCurrency(todayRevenue)}
    - Tổng số đơn hàng: ${orders.length}
    `;

  const systemPrompt = `
      Bạn là Trợ lý ảo Misa của "Tiny Shop".
      Nhiệm vụ: Trả lời ngắn gọn, thân thiện.

      DỮ LIỆU SHOP:
      ${statsContext}

      TOP SẢN PHẨM:
      ${productContext}

      CÂU HỎI: "${query}"

      QUY TẮC:
      1. Ưu tiên dùng dữ liệu shop để trả lời.
      2. Nếu không có trong dữ liệu shop hoặc user hỏi thông tin bên ngoài (giá thị trường, so sánh...), HÃY DÙNG GOOGLE SEARCH.
      3. Tiền tệ: 150.000đ.
    `;

  try {
    const model = getModel(apiKey);
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    return createResponse("text", response.text());
  } catch (error) {
    console.error("Gemini Error:", error);

    // Xử lý lỗi mạng cụ thể theo yêu cầu
    if (
      !navigator.onLine ||
      error.message?.includes("Failed to fetch") ||
      error.message?.includes("NetworkError")
    ) {
      return createResponse(
        "text",
        "Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.",
      );
    }

    // Các lỗi khác (API Key, Quota...) trả về thông báo chung
    return createResponse(
      "text",
      "Đã có lỗi xảy ra khi xử lý yêu cầu. Vui lòng thử lại sau.",
    );
  }
};

/**
 * Helper tạo object phản hồi
 */
const createResponse = (type, content, data = null) => {
  return {
    id: Date.now().toString(),
    sender: "assistant",
    type,
    content,
    data,
  };
};
