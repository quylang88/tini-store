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
  },
  FLASH: {
    models: [import.meta.env.VITE_GEMINI_MODEL_NAME_2_LITE],
  },
  LOCAL: {
    models: [import.meta.env.VITE_GEMMA_MODEL_NAME],
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

const TAVILY_API_URL = "https://api.tavily.com/search";

/**
 * Helper: Lấy vị trí
 */
const getCurrentLocation = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(`${pos.coords.latitude}, ${pos.coords.longitude}`),
      () => resolve(null),
      { timeout: 10000 },
    );
  });
};

/**
 * 1. HÀM SEARCH WEB (Dùng Tavily API)
 * Thay thế cho googleSearch tool bị giới hạn.
 */
const searchWeb = async (query, location = null) => {
  const tavilyKey = import.meta.env.VITE_TAVILY_API_KEY;

  if (!tavilyKey) {
    console.warn("Chưa cấu hình VITE_TAVILY_API_KEY");
    return null;
  }

  try {
    // Nếu có location, thêm vào query để search chính xác hơn
    const searchQuery = location ? `${query} tại ${location}` : query;

    const response = await fetch(TAVILY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: searchQuery,
        search_depth: "basic", // "advanced" tốn credit hơn, basic là đủ
        include_answer: false,
        max_results: 3, // Chỉ lấy 3 kết quả đầu để tiết kiệm token cho Gemini
      }),
    });

    const data = await response.json();

    if (!data.results) return null;

    // Format lại kết quả để Gemini dễ đọc
    const searchContext = data.results
      .map(
        (item) =>
          `[Tiêu đề: ${item.title}]\n[Nội dung: ${item.content}]\n[Link: ${item.url}]`,
      )
      .join("\n\n");

    return searchContext;
  } catch (error) {
    console.error("Lỗi tìm kiếm Tavily:", error);
    return null;
  }
};

/**
 * Hàm lấy Model instance (có Cache)
 */
const getModelInstance = (apiKey, modelName) => {
  if (apiKey !== cachedKey) {
    cachedKey = apiKey;
    cachedModels = {}; // Reset cache nếu đổi key
  }

  const cacheKey = `${modelName}`;
  if (cachedModels[cacheKey]) return cachedModels[cacheKey];

  const genAI = new GoogleGenerativeAI(apiKey);

  const modelConfig = {
    model: modelName,
    safetySettings: safetySettings,
  };

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

  // 3. XÁC ĐỊNH VỊ TRÍ VÀ SEARCH WEB
  const userLocation = await getCurrentLocation();

  // --- LOGIC PHÂN LOẠI CÂU HỎI (Đơn giản) ---
  // Để tiết kiệm Tavily quota, chỉ search khi cần thiết
  const needsSearchKeywords = [
    "thời tiết",
    "giá",
    "tin tức",
    "ở đâu",
    "mấy giờ",
    "ai là",
    "sự kiện",
    "bóng đá",
    "tỷ số",
    "thế giới",
    "hôm nay",
    "như thế nào",
    "tại sao",
    "quán ăn",
    "đường đi",
  ];
  const lowerQuery = query.toLowerCase();
  const shouldSearch = needsSearchKeywords.some((kw) =>
    lowerQuery.includes(kw),
  );

  let searchResults = "";

  // Nếu câu hỏi cần search, gọi Tavily trước
  if (shouldSearch) {
    // Gửi thông báo "Đang tìm kiếm..." (Optional, xử lý ở UI thì tốt hơn)
    console.log("Đang tìm kiếm trên Tavily...");
    const webData = await searchWeb(query, userLocation);
    if (webData) {
      searchResults = `\n\nTHÔNG TIN TÌM KIẾM TỪ WEB (Hãy dùng thông tin này để trả lời nếu liên quan):\n${webData}`;
    }
  }

  // 4. XÁC ĐỊNH CẤU HÌNH MODEL DỰA TRÊN MODE
  const config = MODEL_CONFIGS[mode] || MODEL_CONFIGS.PRO;

  // 5. GỌI GEMINI VỚI CƠ CHẾ FAILOVER
  try {
    return await processQueryWithFailover(
      query,
      { ...context, location: userLocation },
      apiKey,
      config,
      searchResults,
    );
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
const processQueryWithFailover = async (
  query,
  context,
  apiKey,
  config,
  searchResults,
) => {
  const { models } = config;
  let lastError = null;

  for (const modelName of models) {
    try {
      if (!modelName) continue;

      const model = getModelInstance(apiKey, modelName);
      return await generateContent(model, query, context, searchResults);
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
const generateContent = async (model, query, context, searchResults) => {
  const systemPrompt = buildSystemPrompt(query, context, searchResults);

  const result = await model.generateContent(systemPrompt);
  const response = await result.response;
  const text = response.text();

  return createResponse("text", text);
};

/**
 * Xây dựng prompt hệ thống
 */
const buildSystemPrompt = (query, context, searchResults) => {
  const { products, orders, location } = context;

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
    - VỊ TRÍ USER: ${location || "Chưa rõ"}
    `;

  return `
      Bạn là Trợ lý ảo Misa của "Tiny Shop".
      Nhiệm vụ: Trả lời ngắn gọn, thân thiện bằng Tiếng Việt.

      DỮ LIỆU SHOP:
      ${statsContext}

      TOP SẢN PHẨM (Tối đa 100):
      ${productContext}

      ĐƠN HÀNG GẦN ĐÂY (Tối đa 20):
      ${recentOrders}

      ${searchResults}

      CÂU HỎI: "${query}"

      QUY TẮC:
      1. Ưu tiên dùng dữ liệu shop (sản phẩm, đơn hàng) để trả lời.
      2. Nếu có thông tin tìm kiếm từ web, hãy sử dụng nó để trả lời các câu hỏi về kiến thức chung, thời tiết, tin tức...
      3. Nếu không có thông tin từ web và dữ liệu shop, hãy trả lời dựa trên kiến thức chung của bạn.
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
