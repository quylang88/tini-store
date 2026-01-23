import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// --- CẤU HÌNH PROVIDERS ---
export const PROVIDERS = {
  GEMINI: "GEMINI",
  GROQ: "GROQ",
};

// --- CẤU HÌNH AI MODES (Đã điều chỉnh cho Owner) ---
export const AI_MODES = {
  standard: {
    label: "Misa Smart",
    description: "Phân tích, gợi ý nhập hàng và trả lời các câu hỏi chung.",
    config: {
      model: [
        {
          provider: PROVIDERS.GROQ,
          model: import.meta.env.VITE_GROQ_MODEL_VERSATILE,
        },
      ],
      search_depth: "basic",
      max_results: 5,
      temperature: 0.6, // Giảm sáng tạo để tăng độ chính xác
    },
  },
  fast: {
    label: "Misa Flash",
    description: "Phản hồi tức thì, tra cứu nhanh tồn kho và đơn hàng.",
    config: {
      model: [
        {
          provider: PROVIDERS.GEMINI,
          model: import.meta.env.VITE_GEMINI_MODEL_3_FLASH,
        },
        {
          provider: PROVIDERS.GEMINI,
          model: import.meta.env.VITE_GEMINI_MODEL_2_FLASH,
        },
        {
          provider: PROVIDERS.GROQ,
          model: import.meta.env.VITE_GROQ_MODEL_INSTANT,
        },
      ],
      search_depth: "basic",
      max_results: 3,
      temperature: 0.4,
    },
  },
  deep: {
    label: "Misa Deep",
    description: "Tìm nguồn hàng, so sánh giá, phân tích kỹ (Web Search).",
    config: {
      model: [
        {
          provider: PROVIDERS.GROQ,
          model: import.meta.env.VITE_GROQ_MODEL_VERSATILE,
        },
        {
          provider: PROVIDERS.GEMINI,
          model: import.meta.env.VITE_GEMINI_MODEL_3_FLASH,
        },
      ],
      search_depth: "advanced",
      max_results: 8,
      temperature: 0.7,
    },
  },
};

export const getModeConfig = (modeKey) => {
  return AI_MODES[modeKey]?.config || AI_MODES["standard"].config;
};

// Export MODEL_CONFIGS for backward compatibility
export const MODEL_CONFIGS = {
  SMART: AI_MODES.standard.config.model,
  FLASH: AI_MODES.fast.config.model,
  DEEP: AI_MODES.deep.config.model,
};

// --- CẤU HÌNH AN TOÀN ---
export const geminiSafetySettings = [
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

export const TAVILY_API_URL = "https://api.tavily.com/search";

// --- KEYWORDS KÍCH HOẠT SEARCH (Updated cho Sourcing) ---

// Kích hoạt tìm kiếm trong chế độ Standard
export const STANDARD_MODE_SEARCH_TRIGGERS = [
  "tìm",
  "so sánh",
  "giá nhập",
  "giá sỉ",
  "shopee",
  "lazada",
  "amazon",
  "rakuten",
  "cosme",
  "rẻ",
  "tốt",
  "trend",
];

// BẮT BUỘC tìm kiếm (Ưu tiên cao nhất)
export const FORCE_WEB_SEARCH_TRIGGERS = [
  "bên nhật",
  "tại nhật",
  "web nhật",
  "nguồn hàng",
  "giá yên",
  "check giá",
  "review",
  "đánh giá",
];
