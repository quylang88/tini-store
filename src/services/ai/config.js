import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// --- CẤU HÌNH PROVIDERS & MODELS ---

export const PROVIDERS = {
  GEMINI: "GEMINI",
  GROQ: "GROQ",
};

/**
 * Cấu hình danh sách model theo thứ tự ưu tiên cho từng chế độ.
 * Mỗi mục gồm: provider (nhà cung cấp) và model (tên model).
 */
export const MODEL_CONFIGS = {
  // Chế độ SMART: Ưu tiên dùng Groq (nhanh/thông minh)
  SMART: [
    {
      provider: PROVIDERS.GROQ,
      model: import.meta.env.VITE_GROQ_MODEL_VERSATILE,
    },
  ],
  // Chế độ FLASH: Dùng các model nhanh nhất
  FLASH: [
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
      model: import.meta.env.VITE_GROQ_MODEL_INSTANT, // Fallback sang Groq nếu Gemini limited
    },
  ],
  // Chế độ DEEP: Tìm kiếm sâu & Phân tích kỹ (Dùng model mạnh nhất)
  DEEP: [
    {
      provider: PROVIDERS.GROQ,
      model: import.meta.env.VITE_GROQ_MODEL_VERSATILE, // Sử dụng model có context window lớn để phân tích
    },
    {
      provider: PROVIDERS.GEMINI,
      model: import.meta.env.VITE_GEMINI_MODEL_3_FLASH, // Fallback sang Gemini nếu cần
    },
  ],
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
  "bóng đá",
  "tỷ số",
  "hôm nay",
  "tại sao",
  "quán ăn",
  "đường đi",
];
