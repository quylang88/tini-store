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

// --- 1. CẤU HÌNH PROVIDER & MODEL ---

// Định nghĩa các Provider
const PROVIDERS = {
  GEMINI: "GEMINI",
  GROQ: "GROQ",
};

/**
 * Cấu hình danh sách model theo thứ tự ưu tiên.
 * Mỗi mục gồm: provider (nhà cung cấp) và model (tên model).
 */
const MODEL_CONFIGS = {
  // Chế độ SMART: Ưu tiên dùng Groq (nhanh/thông minh)
  SMART: [
    {
      provider: PROVIDERS.GROQ,
      model: import.meta.env.VITE_GROQ_MODEL_NAME,
    },
  ],
  // Chế độ FLASH: Dùng các model nhanh của Google
  FLASH: [
    {
      provider: PROVIDERS.GEMINI,
      model: import.meta.env.VITE_GEMINI_MODEL_3_FLASH,
    },
    {
      provider: PROVIDERS.GEMINI,
      model: import.meta.env.VITE_GEMINI_MODEL_2_FLASH,
    },
  ],
  // Chế độ DEEP: Tìm kiếm sâu & Phân tích kỹ (Dùng model mạnh nhất)
  DEEP: [
    {
      provider: PROVIDERS.GEMINI,
      model: import.meta.env.VITE_GEMINI_MODEL_3_FLASH, // Sử dụng model có context window lớn để phân tích
    },
    {
      provider: PROVIDERS.GROQ,
      model: import.meta.env.VITE_GROQ_MODEL_NAME, // Fallback sang Groq nếu cần
    },
  ],
};

// --- 2. BIẾN CACHE GEMINI (Singleton) ---
let cachedGeminiKey = null;
let cachedGeminiModels = {}; // Cache Gemini model instances

// Cấu hình an toàn cho Gemini
const geminiSafetySettings = [
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

// Tavily API
const TAVILY_API_URL = "https://api.tavily.com/search";

// --- 3. HELPER FUNCTIONS ---

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
 * Helper: Lấy Gemini Model Instance (có Cache)
 */
const getGeminiModelInstance = (apiKey, modelName) => {
  if (apiKey !== cachedGeminiKey) {
    cachedGeminiKey = apiKey;
    cachedGeminiModels = {};
  }

  const cacheKey = `${modelName}`;
  if (cachedGeminiModels[cacheKey]) return cachedGeminiModels[cacheKey];

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    safetySettings: geminiSafetySettings,
  });

  cachedGeminiModels[cacheKey] = model;
  return model;
};

// --- 4. CÁC HÀM GỌI API RIÊNG BIỆT ---

/**
 * Gọi API Google Gemini
 */
const callGeminiAPI = async (modelName, fullPrompt) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Chưa cấu hình VITE_GEMINI_API_KEY");

  const model = getGeminiModelInstance(apiKey, modelName);
  const result = await model.generateContent(fullPrompt);
  const response = await result.response;
  return response.text();
};

/**
 * Gọi API Groq (Tương thích OpenAI)
 * Sử dụng fetch trực tiếp để không cần cài thêm SDK
 */
const callGroqAPI = async (modelName, fullPrompt) => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error("Chưa cấu hình VITE_GROQ_API_KEY");

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "Bạn là trợ lý ảo Misa hữu ích. Hãy trả lời dựa trên dữ liệu được cung cấp.",
          },
          {
            role: "user",
            content: fullPrompt,
          },
        ],
        model: modelName,
        temperature: 0.5,
        max_tokens: 1024,
      }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Groq API Error: ${errorData?.error?.message || response.statusText}`,
    );
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
};

// --- 5. LOGIC SEARCH (TAVILY) ---

const searchWeb = async (query, location = null) => {
  const tavilyKey = import.meta.env.VITE_TAVILY_API_KEY;
  if (!tavilyKey) {
    console.warn("Chưa cấu hình VITE_TAVILY_API_KEY");
    return null;
  }

  try {
    const searchQuery = location ? `${query} tại ${location}` : query;
    const response = await fetch(TAVILY_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: searchQuery,
        search_depth: "basic",
        include_answer: false,
        max_results: 3,
      }),
    });

    const data = await response.json();
    if (!data.results) return null;

    return data.results
      .map(
        (item) =>
          `[Tiêu đề: ${item.title}]\n[Nội dung: ${item.content}]\n[Link: ${item.url}]`,
      )
      .join("\n\n");
  } catch (error) {
    console.error("Lỗi Tavily:", error);
    return null;
  }
};

// --- 6. XỬ LÝ CHÍNH (MAIN PROCESS) ---

/**
 * Hàm chính để xử lý truy vấn
 */
export const processQuery = async (query, context, mode = "PRO") => {
  // 1. Kiểm tra mạng
  if (!navigator.onLine) {
    return createResponse(
      "text",
      "Bạn đang Offline. Vui lòng kiểm tra kết nối mạng.",
    );
  }

  // 2. Xác định vị trí & Search Web
  const userLocation = await getCurrentLocation();
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
    "hôm nay",
    "tại sao",
    "quán ăn",
    "đường đi",
  ];

  // Nếu mode là DEEP, luôn ưu tiên tìm kiếm nếu câu hỏi không quá ngắn
  // Hoặc nếu có keyword trong danh sách
  const shouldSearch =
    (mode === "DEEP" && query.length > 5) ||
    needsSearchKeywords.some((kw) => query.toLowerCase().includes(kw));

  let searchResults = "";
  if (shouldSearch) {
    console.log("Đang tìm kiếm trên Tavily...");
    const webData = await searchWeb(query, userLocation);
    if (webData) {
      searchResults = `\n\nTHÔNG TIN TÌM KIẾM TỪ WEB:\n${webData}`;
    }
  }

  
  // 3. Lấy danh sách model candidates dựa trên Mode
  const modelCandidates = MODEL_CONFIGS[mode] || MODEL_CONFIGS.SMART;

  // 4. Xây dựng prompt
  // Lưu ý: Chúng ta xây dựng prompt 1 lần và dùng chung cho cả Groq và Gemini
  const systemPrompt = buildSystemPrompt(
    query,
    { ...context, location: userLocation },
    searchResults,
  );

  // 5. Gọi AI với cơ chế Failover
  try {
    const responseText = await processQueryWithFailover(
      modelCandidates,
      systemPrompt,
    );
    return createResponse("text", responseText);
  } catch (error) {
    console.error("AI Service Error:", error);
    return createResponse("text", `Đã có lỗi xảy ra: ${error.message}`);
  }
};

/**
 * Chạy qua danh sách các models/providers, nếu cái đầu lỗi thì thử cái sau
 */
const processQueryWithFailover = async (candidates, fullPrompt) => {
  let lastError = null;

  for (const candidate of candidates) {
    const { provider, model } = candidate;
    if (!model) continue;

    console.log(`Đang thử gọi model: ${model} (${provider})...`);

    try {
      let result = "";

      if (provider === PROVIDERS.GEMINI) {
        result = await callGeminiAPI(model, fullPrompt);
      } else if (provider === PROVIDERS.GROQ) {
        result = await callGroqAPI(model, fullPrompt);
      }

      // Nếu thành công trả về luôn
      if (result) return result;
    } catch (error) {
      console.error(`Lỗi với ${provider} - ${model}:`, error);
      lastError = error;

      // Nếu là lỗi rate limit (429) hoặc lỗi mạng, continue để thử model tiếp theo
      // Nếu là lỗi cấu hình (thiếu key), có thể break luôn hoặc thử cái khác
      continue;
    }
  }

  throw lastError || new Error("Tất cả các models đều thất bại.");
};

// --- 7. PROMPT BUILDER & UTILS ---

const buildSystemPrompt = (query, context, searchResults) => {
  const { products, orders, location } = context;

  const productContext = products
    .slice(0, 100)
    .map(
      (p) => `- ${p.name} (Giá: ${formatCurrency(p.price)}, Kho: ${p.stock})`,
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
      return `- Đơn ${o.id} (${dateStr}): ${o.customerName || "Khách lẻ"} - ${formatCurrency(o.total)} - Items: ${itemsSummary}`;
    })
    .join("\n");

  const statsContext = `
    - Ngày hiện tại: ${today}
    - Doanh thu hôm nay: ${formatCurrency(todayRevenue)}
    - Tổng số đơn: ${orders.length}
    - VỊ TRÍ USER: ${location || "Chưa rõ"}
    `;

  return `
      Bạn là Trợ lý ảo Misa của "Tiny Shop".
      Nhiệm vụ: Trả lời ngắn gọn, thân thiện bằng Tiếng Việt.

      DỮ LIỆU SHOP:
      ${statsContext}

      TOP SẢN PHẨM:
      ${productContext}

      ĐƠN HÀNG GẦN ĐÂY:
      ${recentOrders}
      
      ${searchResults}

      CÂU HỎI: "${query}"

      QUY TẮC:
      1. Ưu tiên dùng dữ liệu shop để trả lời.
      2. Nếu có thông tin tìm kiếm web, hãy sử dụng nó.
      3. Định dạng tiền tệ: Luôn dùng VNĐ.
      4. Nếu không tìm thấy thông tin, trả lời: "Xin lỗi, mình không tìm thấy thông tin bạn cần."
    `;
};

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
