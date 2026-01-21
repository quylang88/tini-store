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

// --- CẤU HÌNH MODEL ---
const MODEL_CONFIGS = {
  PRO: {
    models: [
      import.meta.env.VITE_GEMINI_MODEL_NAME_3,
      import.meta.env.VITE_GEMINI_MODEL_NAME_2,
    ],
    enableTools: true,
  },
  FLASH: {
    models: [import.meta.env.VITE_GEMINI_MODEL_NAME_2_LITE],
    enableTools: true,
  },
  LOCAL: {
    models: [import.meta.env.VITE_GEMMA_MODEL_NAME],
    enableTools: false,
  },
};

// --- BIẾN CACHE (Singleton) ---
let cachedKey = null;
let cachedModels = {}; // Cache model instances by modelName

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
 * Hàm lấy Model instance (có Cache)
 */
const getModelInstance = (apiKey, modelName, enableTools) => {
  if (apiKey !== cachedKey) {
    cachedKey = apiKey;
    cachedModels = {}; // Reset cache nếu đổi key
  }

  const cacheKey = `${modelName}_${enableTools}`;
  if (cachedModels[cacheKey]) return cachedModels[cacheKey];

  const genAI = new GoogleGenerativeAI(apiKey);

  const modelConfig = {
    model: modelName,
    safetySettings: safetySettings,
  };

  if (enableTools) {
    modelConfig.tools = tools;
  }

  const model = genAI.getGenerativeModel(modelConfig);
  cachedModels[cacheKey] = model;

  return model;
};

/**
 * Xử lý truy vấn của người dùng.
 * @param {string} query - Câu hỏi của user
 * @param {object} context - Dữ liệu shop (products, orders...)
 * @param {string} mode - 'PRO' | 'FLASH' | 'LOCAL'
 */
export const processQuery = async (query, context, mode = "PRO") => {
  // 1. KIỂM TRA MẠNG
  if (!navigator.onLine) {
    return createResponse(
      "text",
      "Bạn đang Offline. Vui lòng kiểm tra kết nối mạng.",
    );
  }

  // 2. LẤY API KEY
  let apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return createResponse(
      "text",
      "Chưa có cấu hình API Key. Vui lòng vào Cài đặt để nhập Gemini API Key.",
    );
  }

  // 3. XÁC ĐỊNH CẤU HÌNH MODEL DỰA TRÊN MODE
  const config = MODEL_CONFIGS[mode] || MODEL_CONFIGS.PRO;

  // 4. GỌI GEMINI VỚI CƠ CHẾ FAILOVER
  try {
    return await processQueryWithFailover(query, context, apiKey, config);
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
 * Thực hiện gọi AI với cơ chế thử lại (Failover) khi gặp lỗi 429
 */
const processQueryWithFailover = async (query, context, apiKey, config) => {
  const { models, enableTools } = config;
  let lastError = null;

  for (const modelName of models) {
    try {
      if (!modelName) continue;

      const model = getModelInstance(apiKey, modelName, enableTools);
      return await generateContent(model, query, context, enableTools);
    } catch (error) {
      console.error(`Error with model ${modelName}:`, error);
      lastError = error;

      // Nếu lỗi 429 (Resource Exhausted), thử model tiếp theo trong danh sách
      if (error.message?.includes("429") || error.status === 429) {
        console.warn(
          `Model ${modelName} hit rate limit. Switching to backup...`,
        );
        continue;
      }

      // Nếu không phải 429, throw luôn để handle ở catch ngoài
      throw error;
    }
  }

  // Nếu chạy hết vòng lặp mà vẫn lỗi
  if (
    lastError &&
    (lastError.message?.includes("429") || lastError.status === 429)
  ) {
    return createResponse(
      "text",
      "Bạn đã đạt tới giới hạn sử dụng hôm nay cho chế độ này. Vui lòng thử lại vào ngày mai hoặc chuyển sang chế độ khác (FLASH/LOCAL).",
    );
  }

  // Các lỗi khác
  throw lastError;
};

/**
 * Hàm core sinh nội dung
 */
const generateContent = async (model, query, context, enableTools) => {
  const systemPrompt = buildSystemPrompt(query, context, enableTools);

  const result = await model.generateContent(systemPrompt);
  const response = await result.response;
  const text = response.text();

  // Kiểm tra yêu cầu vị trí qua thẻ (chỉ khi có tools hoặc context liên quan)
  if (text.includes("[[REQUEST_LOCATION]]")) {
    return createResponse(
      "location_request",
      "Mình cần biết vị trí của bạn để trả lời câu hỏi này.",
    );
  }

  return createResponse("text", text);
};

/**
 * Xây dựng prompt hệ thống
 */
const buildSystemPrompt = (query, context, enableTools) => {
  const { products, orders } = context;

  // --- CHUẨN BỊ DATA ---
  const productContext = products
    .slice(0, 100)
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

  let searchInstructions = "";
  if (enableTools) {
    searchInstructions = `
      2. Nếu người dùng hỏi về vị trí, thời tiết...:
         - NẾU trong câu hỏi hoặc context đã có tọa độ (Vĩ độ/Kinh độ), HÃY DÙNG GOOGLE SEARCH với tọa độ đó để trả lời. KHÔNG được yêu cầu lại vị trí.
         - NẾU CHƯA CÓ tọa độ, hãy trả lời duy nhất bằng thẻ: [[REQUEST_LOCATION]]
      3. Nếu người dùng hỏi thông tin bên ngoài khác, HÃY DÙNG GOOGLE SEARCH.
      `;
  } else {
    searchInstructions = `
      2. Bạn đang hoạt động ở chế độ OFFLINE/LOCAL. Bạn KHÔNG có khả năng truy cập internet hay Google Search.
      3. Chỉ trả lời dựa trên dữ liệu Shop được cung cấp và kiến thức có sẵn. Nếu không biết, hãy nói rõ là không có thông tin.
      `;
  }

  return `
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
      ${searchInstructions}
      4. Định dạng tiền tệ: Luôn dùng VNĐ (ví dụ: "1.000.000₫").
      5. Nếu không tìm thấy thông tin, trả lời: "Xin lỗi, mình không tìm thấy thông tin bạn cần."
    `;
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
