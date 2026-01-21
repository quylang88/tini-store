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
import { format } from "date-fns";

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

// Định nghĩa Tool
const tools = [
  {
    googleSearch: {},
  },
  {
    functionDeclarations: [
      {
        name: "getUserLocation",
        description:
          "Lấy tọa độ vị trí hiện tại của người dùng (latitude, longitude). Dùng khi người dùng hỏi về thời tiết, chỉ đường, hoặc các câu hỏi liên quan đến vị trí địa lý của họ.",
        parameters: {
          type: "OBJECT",
          properties: {},
        },
      },
    ],
  },
];

/**
 * Hàm lấy Model thông minh (có Cache)
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
    tools: tools,
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
  let apiKey = context.settings?.aiApiKey || import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return createResponse(
      "text",
      "Chưa có cấu hình API Key. Vui lòng vào Cài đặt để nhập Gemini API Key.",
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
    .slice(0, 100) // Giới hạn 100 sản phẩm để tránh quá token
    .map(
      (p) =>
        `- ${p.name} (Giá: ${formatCurrency(p.price)}, Kho: ${p.stock}, ID: ${p.id})`,
    )
    .join("\n");

  const today = new Date().toLocaleDateString("en-CA");
  const todayRevenue = orders
    .filter((o) => o.date.startsWith(today) && o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  // Lấy 20 đơn hàng gần nhất
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 20)
    .map((o) => {
        const dateStr = format(new Date(o.date), "dd/MM/yyyy HH:mm");
        const itemsSummary = o.items.map(i => `${i.name} (x${i.quantity})`).join(", ");
        return `- Đơn ${o.id} (${dateStr}): ${o.customerName || "Khách lẻ"} - ${formatCurrency(o.total)} - Items: ${itemsSummary} - Trạng thái: ${o.status}`;
    })
    .join("\n");

  const statsContext = `
    - Ngày hiện tại: ${today}
    - Doanh thu hôm nay: ${formatCurrency(todayRevenue)}
    - Tổng số đơn hàng tích lũy: ${orders.length}
    `;

  const systemPrompt = `
      Bạn là Trợ lý ảo Misa của "Tiny Shop".
      Nhiệm vụ: Trả lời ngắn gọn, thân thiện bằng Tiếng Việt.

      DỮ LIỆU SHOP:
      ${statsContext}

      TOP SẢN PHẨM (Tối đa 100):
      ${productContext}

      ĐƠN HÀNG GẦN ĐÂY (Tối đa 20):
      ${recentOrders}

      CÂU HỎI: "${query}"

      QUY TẮC:
      1. Ưu tiên dùng dữ liệu shop (sản phẩm, đơn hàng) để trả lời.
      2. Nếu người dùng hỏi về vị trí của họ, thời tiết nơi họ đang đứng... hãy GỌI TOOL "getUserLocation".
      3. Nếu người dùng hỏi thông tin bên ngoài khác, HÃY DÙNG GOOGLE SEARCH.
      4. Định dạng tiền tệ: Luôn dùng VNĐ (ví dụ: "1.000.000₫").
      5. Nếu không tìm thấy thông tin, trả lời: "Xin lỗi, mình không tìm thấy thông tin bạn cần."
    `;

  try {
    const model = getModel(apiKey);
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;

    // Kiểm tra gọi hàm (Function Call)
    const functionCalls = response.functionCalls();
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      if (call.name === "getUserLocation") {
        return createResponse("location_request", "Mình cần biết vị trí của bạn để trả lời câu hỏi này.");
      }
    }

    return createResponse("text", response.text());
  } catch (error) {
    console.error("Gemini Error:", error);

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

    return createResponse(
      "text",
      "Đã có lỗi xảy ra khi xử lý yêu cầu (" + error.message + ")",
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
    timestamp: new Date(),
  };
};
