/**
 * providers.js
 * Quản lý các hàm gọi API cấp thấp đến các nhà cung cấp AI (Gemini, Groq) và Search (Tavily).
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { PROVIDERS, TAVILY_API_URL, geminiSafetySettings } from "./config";

// --- QUẢN LÝ CACHE GEMINI ---
let cachedGeminiKey = null;
let cachedGeminiModels = {}; // Cache Gemini model instances

/**
 * Lấy Gemini Model Instance (có Cache)
 * Giúp tránh việc khởi tạo lại instance không cần thiết
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

// --- CÁC HÀM GỌI API ---

/**
 * Gọi API Google Gemini
 */
export const callGeminiAPI = async (modelName, fullPrompt) => {
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
export const callGroqAPI = async (modelName, fullPrompt) => {
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

/**
 * Gọi Tavily API để tìm kiếm thông tin trên web
 */
export const searchWeb = async (query, location = null) => {
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
