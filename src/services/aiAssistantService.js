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

// --- CẤU HÌNH API ---
const API_CONFIGS = [
  {
    key: import.meta.env.VITE_GEMINI_API_KEY,
    model: import.meta.env.VITE_GEMINI_MODEL_NAME || "gemini-1.5-flash",
  },
  {
    key: import.meta.env.VITE_GEMINI_API_KEY_SECONDARY,
    model: import.meta.env.VITE_GEMINI_MODEL_NAME_SECONDARY || "gemini-1.5-flash",
  },
];

let currentConfigIndex = 0; // Lưu trạng thái config hiện tại (Module Level Scope)

// --- BIẾN CACHE (Singleton) ---
let cachedKey = null;
let cachedModelName = null;
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
];

/**
 * Hàm lấy Model thông minh (có Cache)
 */
const getModel = (apiKey, modelName) => {
  if (apiKey !== cachedKey || modelName !== cachedModelName) {
    cachedKey = apiKey;
    cachedModelName = modelName;
    cachedModel = null;
  }

  if (cachedModel) return cachedModel;

  const genAI = new GoogleGenerativeAI(apiKey);

  cachedModel = genAI.getGenerativeModel({
    model: modelName,
    safetySettings: safetySettings,
    tools: tools,
  });

  return cachedModel;
};

/**
 * Xử lý truy vấn của người dùng (Entry Point).
 */
export const processQuery = async (query, context) => {
  // 1. KIỂM TRA MẠNG
  if (!navigator.onLine) {
    return createResponse(
      "text",
      "Bạn đang Offline. Vui lòng kiểm tra kết nối mạng.",
    );
  }

  // 2. GỌI GEMINI VỚI CƠ CHẾ RETRY/FAILOVER
  return await attemptGeminiRequest(query, context);
};

/**
 * Hàm thực thi request với cơ chế thử lại khi gặp lỗi 429
 */
const attemptGeminiRequest = async (query, context, retryCount = 0) => {
  // Guard loop: Tránh lặp vô tận nếu cả 2 key đều lỗi
  if (retryCount > 6) {
    return createResponse("text", "Hệ thống đang quá tải, vui lòng thử lại sau.");
  }

  const config = API_CONFIGS[currentConfigIndex];

  // Validate Key
  if (!config.key) {
    // Nếu cả 2 key đều thiếu -> Lỗi cấu hình
    if (!API_CONFIGS[0].key && !API_CONFIGS[1].key) {
      return createResponse(
        "text",
        "Chưa có cấu hình API Key. Vui lòng kiểm tra file .env hoặc Cài đặt.",
      );
    }

    // Nếu key hiện tại thiếu nhưng key kia có thể có -> Thử switch
    // (Trường hợp user chỉ config key secondary mà không config key primary, hoặc ngược lại)
    if (!config.key) {
        console.warn(`Config ${currentConfigIndex} is missing API Key, switching...`);
        currentConfigIndex = (currentConfigIndex + 1) % API_CONFIGS.length;
        return attemptGeminiRequest(query, context, retryCount + 1);
    }
  }

  try {
    const text = await executeGeminiLogic(query, context, config.key, config.model);

    // Kiểm tra yêu cầu vị trí qua thẻ
    if (text.includes("[[REQUEST_LOCATION]]")) {
      return createResponse(
        "location_request",
        "Mình cần biết vị trí của bạn để trả lời câu hỏi này.",
      );
    }

    return createResponse("text", text);
  } catch (error) {
    console.error(`Gemini Error (Config ${currentConfigIndex}):`, error);

    // CHECK 429: RESOURCE EXHAUSTED
    const is429 = error.message?.includes("429") ||
                  error.message?.includes("Resource exhausted") ||
                  error.status === 429;

    if (is429) {
      console.warn("Gặp lỗi 429, chuyển đổi API Model/Key...");
      currentConfigIndex = (currentConfigIndex + 1) % API_CONFIGS.length;
      // Thử lại ngay lập tức với key mới
      return attemptGeminiRequest(query, context, retryCount + 1);
    }

    // Các lỗi khác không phải 429
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
 * Logic gọi API Gemini (Core)
 * Hàm này CHỈ thực hiện gọi và trả về text, hoặc throw error để bên ngoài xử lý.
 */
const executeGeminiLogic = async (query, context, apiKey, modelName) => {
  const { products, orders } = context;

  // --- CHUẨN BỊ DATA ---
  const productContext = products
    .slice(0, 100) // Giới hạn 100 sản phẩm
    .map(
      (p) =>
        `- ${p.name} (Giá: ${formatCurrency(p.price)}, Kho: ${p.stock}, ID: ${p.id})`,
    )
    .join("\n");

  const today = new Date().toLocaleDateString("en-CA");
  const todayRevenue = orders
    .filter((o) => o.date.startsWith(today) && o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 20)
    .map((o) => {
      const dateStr = format(new Date(o.date), "dd/MM/yyyy HH:mm");
      const itemsSummary = o.items
        .map((i) => `${i.name} (x${i.quantity})`)
        .join(", ");
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
      2. Nếu người dùng hỏi về vị trí, thời tiết...:
         - NẾU trong câu hỏi hoặc context đã có tọa độ (Vĩ độ/Kinh độ), HÃY DÙNG GOOGLE SEARCH với tọa độ đó để trả lời. KHÔNG được yêu cầu lại vị trí.
         - NẾU CHƯA CÓ tọa độ, hãy trả lời duy nhất bằng thẻ: [[REQUEST_LOCATION]]
      3. Nếu người dùng hỏi thông tin bên ngoài khác, HÃY DÙNG GOOGLE SEARCH.
      4. Định dạng tiền tệ: Luôn dùng VNĐ (ví dụ: "1.000.000₫").
      5. Nếu không tìm thấy thông tin, trả lời: "Xin lỗi, mình không tìm thấy thông tin bạn cần."
    `;

  const model = getModel(apiKey, modelName);
  const result = await model.generateContent(systemPrompt);
  const response = await result.response;
  return response.text();
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
