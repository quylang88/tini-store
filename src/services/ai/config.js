import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// --- CẤU HÌNH PROVIDERS ---

export const PROVIDERS = {
  GEMINI: "GEMINI",
  GROQ: "GROQ",
};

// --- CẤU HÌNH AI MODES ---
export const AI_MODES = {
  standard: {
    label: "Misa Smart",
    description:
      "Cân bằng giữa tốc độ và trí tuệ. Phù hợp với đa số các tác vụ.",
    config: {
      model: [
        {
          provider: PROVIDERS.GROQ,
          model: import.meta.env.VITE_GROQ_MODEL_VERSATILE,
        },
      ],
      search_depth: "basic",
      max_results: 5,
      temperature: 0.7,
    },
  },
  fast: {
    label: "Misa Flash",
    description: "Phản hồi tức thì, thích hợp tra cứu nhanh.",
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
      temperature: 0.5,
    },
  },
  deep: {
    label: "Misa Deep",
    description: "Tìm kiếm sâu và phân tích kỹ. Sẽ mất thời gian hơn.",
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
      max_results: 10,
      temperature: 0.7,
    },
  },
};

// Hàm lấy config (fallback về standard nếu lỗi)
export const getModeConfig = (modeKey) => {
  return AI_MODES[modeKey]?.config || AI_MODES["standard"].config;
};

// Export MODEL_CONFIGS for backward compatibility (mapped to new structure)
// NOTE: Các file khác nên chuyển dần sang dùng AI_MODES
export const MODEL_CONFIGS = {
  SMART: AI_MODES.standard.config.model,
  FLASH: AI_MODES.fast.config.model,
  DEEP: AI_MODES.deep.config.model,
};

// --- CẤU HÌNH AN TOÀN CHO GEMINI ---

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

// --- CẤU HÌNH API KHÁC ---

export const TAVILY_API_URL = "https://api.tavily.com/search";

export const SEARCH_KEYWORDS = [
  "thời tiết",
  "giá",
  "tin tức",
  "ở đâu",
  "mấy giờ",
  "ai là",
  "sự kiện",
  "hôm nay",
  "tại sao",
  "quán ăn",
  "đường đi",
];
